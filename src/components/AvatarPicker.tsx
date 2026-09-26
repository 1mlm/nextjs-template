"use client";

import {
  Camera01Icon,
  CropIcon,
  Tick02Icon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
} from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Icon } from "@/components/Icon";
import { IconChip } from "@/components/IconChip";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarBadge } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Slider } from "@/shadcn/ui/slider";
import { triggerHaptic } from "@/utils/haptics";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const OUTPUT_QUALITY = 0.92;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });

// paints just the picked square of the photo onto a canvas, as a jpeg
async function cropImage(src: string, area: Area) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas 2d context isn't available");
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("empty crop"))),
      "image/jpeg",
      OUTPUT_QUALITY,
    ),
  );
}

function CropDialog({
  imageSrc,
  onCancel,
  onCropped,
}: {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedArea, setCroppedArea] = useState<Area>();
  const [isApplying, setIsApplying] = useState(false);

  const applyCrop = async () => {
    if (!croppedArea) return;
    setIsApplying(true);
    const blob = await cropImage(imageSrc, croppedArea).finally(() =>
      setIsApplying(false),
    );
    triggerHaptic("success");
    onCropped(blob);
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-2.5">
          <IconChip icon={CropIcon} />
          <DialogTitle>Crop your photo</DialogTitle>
          <DialogDescription className="sr-only">
            drag to move the photo, zoom with the slider
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-72 overflow-hidden rounded-xl bg-black corner-squircle">
          <Cropper
            image={imageSrc}
            {...{ crop, zoom }}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaInPixels) => setCroppedArea(areaInPixels)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Icon
            icon={ZoomOutAreaIcon}
            className="size-4 text-muted-foreground"
          />
          <Slider
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={[zoom]}
            onValueChange={([value]) => setZoom(value ?? MIN_ZOOM)}
            aria-label="Zoom"
            className="flex-1"
          />
          <Icon
            icon={ZoomInAreaIcon}
            className="size-4 text-muted-foreground"
          />
          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
            {zoom.toFixed(1)}x
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={applyCrop} disabled={isApplying || !croppedArea}>
            <Icon icon={Tick02Icon} isLoading={isApplying} />
            Use this photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// avatar you click to pick a photo, crop it to a circle, done. hands back
// the cropped jpeg (to upload) and an object url (to show right away)
export function AvatarPicker({
  name,
  src,
  onChange,
}: {
  name: string;
  src?: string;
  onChange: (blob: Blob, previewUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedImageSrc, setPickedImageSrc] = useState<string>();
  // the url handed out last time, freed once a newer crop replaces it
  const lastPreviewUrl = useRef<string>(undefined);

  const closeCropper = () => {
    if (pickedImageSrc) URL.revokeObjectURL(pickedImageSrc);
    setPickedImageSrc(undefined);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Change profile picture"
        className="group/picker relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UserAvatar {...{ name, src }} className="size-20 text-lg">
          <AvatarBadge className="size-7! bg-foreground text-background ring-4! transition-transform group-hover/picker:scale-110">
            <Icon icon={Camera01Icon} className="size-3.5!" />
          </AvatarBadge>
        </UserAvatar>
        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover/picker:opacity-100">
          Change
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) setPickedImageSrc(URL.createObjectURL(file));
          event.target.value = "";
        }}
      />
      {pickedImageSrc && (
        <CropDialog
          imageSrc={pickedImageSrc}
          onCancel={closeCropper}
          onCropped={(blob) => {
            const previewUrl = URL.createObjectURL(blob);
            onChange(blob, previewUrl);
            if (lastPreviewUrl.current)
              URL.revokeObjectURL(lastPreviewUrl.current);
            lastPreviewUrl.current = previewUrl;
            closeCropper();
          }}
        />
      )}
    </>
  );
}
