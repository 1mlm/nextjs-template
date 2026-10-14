"use client";

import { useId, useMemo } from "react";
import { drawGlassMaps, type GlassRect, type GlassSettings } from "./glassMaps";

// room around the rects for the gooey bulge between melting shapes
const BLOB_PADDING_PX = 12;
// how far the soft shadow reaches past the blob box. too small and the
// shadow gets cut off in a straight line, which reads as a rectangular glow
const SHADOW_REACH_PX = 32;

const getBounds = (rects: GlassRect[]) => {
  const left = Math.min(...rects.map(({ x }) => x)) - BLOB_PADDING_PX;
  const top = Math.min(...rects.map(({ y }) => y)) - BLOB_PADDING_PX;
  const right =
    Math.max(...rects.map(({ x, width }) => x + width)) + BLOB_PADDING_PX;
  const bottom =
    Math.max(...rects.map(({ y, height }) => y + height)) + BLOB_PADDING_PX;
  return { left, top, width: right - left, height: bottom - top };
};

// one piece of glass made of one or more melted rects. the maps are rebuilt
// only when the shape or the settings actually change
export function GlassBlob({
  rects,
  settings,
}: {
  rects: GlassRect[];
  settings: GlassSettings;
}) {
  const filterId = `glass-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const bounds = getBounds(rects);
  const localRects = rects.map(({ x, y, width, height, radius }) => ({
    x: x - bounds.left,
    y: y - bounds.top,
    width,
    height,
    radius,
  }));
  const shapeKey = JSON.stringify([localRects, settings]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: shapeKey is the serialized rects + settings, so it changes exactly when they do
  const maps = useMemo(
    () => drawGlassMaps(localRects, bounds.width, bounds.height, settings),
    [shapeKey],
  );
  const mapBox = { x: 0, y: 0, width: bounds.width, height: bounds.height };
  const maskStyle = {
    maskImage: `url(${maps.maskUrl})`,
    maskSize: "100% 100%",
  };

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      }}
    >
      <svg aria-hidden className="absolute size-0">
        <filter
          id={filterId}
          {...mapBox}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={settings.frost}
            result="frosted"
          />
          <feImage
            href={maps.displacementUrl}
            {...mapBox}
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="frosted"
            in2="map"
            scale={maps.displacementScale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="bent"
          />
          <feColorMatrix
            in="bent"
            type="saturate"
            values="1.5"
            result="vivid"
          />
          <feImage
            href={maps.maskUrl}
            {...mapBox}
            preserveAspectRatio="none"
            result="shape"
          />
          {/* a backdrop-filter paints its whole box, mask or not, so the
          cutout happens in here: bent backdrop inside the shape, untouched
          backdrop everywhere else. that's what kills the rectangle glow */}
          <feComposite in="vivid" in2="shape" operator="in" result="glass" />
          <feComposite in="glass" in2="SourceGraphic" operator="over" />
        </filter>
      </svg>
      {/* shadow cut out where the glass sits, or the glass would refract its
      own shadow and look dirty inside */}
      <div
        className="absolute"
        style={{
          inset: -SHADOW_REACH_PX,
          maskImage: `linear-gradient(#000 0 0), url(${maps.maskUrl})`,
          maskSize: `100% 100%, ${bounds.width}px ${bounds.height}px`,
          maskPosition: `0 0, ${SHADOW_REACH_PX}px ${SHADOW_REACH_PX}px`,
          maskRepeat: "no-repeat",
          maskComposite: "exclude",
        }}
      >
        <div
          className="absolute translate-y-1.5 blur-md"
          style={{ inset: SHADOW_REACH_PX }}
        >
          <div className="size-full bg-black/15" style={maskStyle} />
        </div>
      </div>
      <div
        className="absolute inset-0"
        style={{ backdropFilter: `url(#${filterId})` }}
      />
      <div className="absolute inset-0 bg-white/10" style={maskStyle} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${maps.specularUrl})`,
          backgroundSize: "100% 100%",
        }}
      />
    </div>
  );
}
