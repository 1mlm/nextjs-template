"use client";

import { useEffect, useRef } from "react";
import type { Vector3Tuple } from "three";
import { cn } from "@/shadcn/utils";
import { type Color, getColorSwatch } from "@/utils/color";
import { triggerHaptic } from "@/utils/haptics";

// which way each face points, and the two directions across it that the pips
// are laid out along. opposite faces add up to 7 like a real die
const FACES: {
  normal: Vector3Tuple;
  across: Vector3Tuple;
  up: Vector3Tuple;
  pips: [number, number][];
}[] = [
  { normal: [0, 0, 1], across: [1, 0, 0], up: [0, 1, 0], pips: [[0, 0]] },
  {
    normal: [1, 0, 0],
    across: [0, 0, -1],
    up: [0, 1, 0],
    pips: [
      [-1, -1],
      [1, 1],
    ],
  },
  {
    normal: [0, 1, 0],
    across: [1, 0, 0],
    up: [0, 0, -1],
    pips: [
      [-1, -1],
      [0, 0],
      [1, 1],
    ],
  },
  {
    normal: [0, -1, 0],
    across: [1, 0, 0],
    up: [0, 0, 1],
    pips: [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ],
  },
  {
    normal: [-1, 0, 0],
    across: [0, 0, 1],
    up: [0, 1, 0],
    pips: [
      [-1, -1],
      [1, -1],
      [0, 0],
      [-1, 1],
      [1, 1],
    ],
  },
  {
    normal: [0, 0, -1],
    across: [-1, 0, 0],
    up: [0, 1, 0],
    pips: [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ],
  },
];

const IDLE_SPIN = { x: 0.004, y: 0.007 };
const FRICTION = 0.955;
// a press that moves less than this is a tap (rolls the die), more is a drag
const TAP_DISTANCE = 5;

// tailwind hands out oklch() strings and three only reads hex/rgb, so let the
// browser convert: paint one pixel and read back its srgb bytes
function cssColorToHex(cssColor: string) {
  const context = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!context) return 0xffffff;
  context.fillStyle = cssColor;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return (red << 16) | (green << 8) | blue;
}

async function createScene(canvasParent: HTMLElement, color: Color) {
  const THREE = await import("three");
  const { RoundedBoxGeometry } = await import(
    "three/examples/jsm/geometries/RoundedBoxGeometry.js"
  );

  // alpha on and nothing painted behind it, the die is the only thing in the
  // canvas so it reads as part of the page instead of an embed
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%";
  canvasParent.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0, 4);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8890b0, 0.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  keyLight.position.set(2.5, 3.5, 4);
  const rimLight = new THREE.DirectionalLight(0xaebcff, 0.9);
  rimLight.position.set(-3, -1.5, -2.5);
  scene.add(keyLight, rimLight);

  const die = new THREE.Group();
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: cssColorToHex(getColorSwatch(color)),
    roughness: 0.3,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
  });
  const pipMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
  });
  const bodyGeometry = new RoundedBoxGeometry(1, 1, 1, 6, 0.16);
  const pipGeometry = new THREE.SphereGeometry(0.075, 24, 16);
  die.add(new THREE.Mesh(bodyGeometry, bodyMaterial));

  for (const { normal, across, up, pips } of FACES) {
    const faceNormal = new THREE.Vector3(...normal);
    const faceQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      faceNormal,
    );
    for (const [x, y] of pips) {
      const pip = new THREE.Mesh(pipGeometry, pipMaterial);
      pip.position
        .copy(faceNormal)
        .multiplyScalar(0.5)
        .addScaledVector(new THREE.Vector3(...across), x * 0.26)
        .addScaledVector(new THREE.Vector3(...up), y * 0.26);
      pip.quaternion.copy(faceQuaternion);
      // squashed flat so it sits in the face like a dot, not a ball
      pip.scale.set(1, 1, 0.35);
      die.add(pip);
    }
  }
  die.rotation.set(0.5, -0.6, 0);
  scene.add(die);

  return {
    THREE,
    renderer,
    scene,
    camera,
    die,
    dispose: () => {
      renderer.dispose();
      bodyGeometry.dispose();
      pipGeometry.dispose();
      bodyMaterial.dispose();
      pipMaterial.dispose();
      renderer.domElement.remove();
    },
  };
}

// a 3D die with no canvas background: it sits in the page like part of the
// text, drag it to spin it (it coasts and slows down), tap it to roll. three
// only downloads once it's near the screen. on touch it takes horizontal
// drags and leaves vertical ones to scroll the page
export function Die3D({
  color = "violet",
  className,
}: {
  color?: Color;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spin = useRef({ x: 0, y: IDLE_SPIN.y });
  const rotate = useRef<(x: number, y: number) => void>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const loop: {
      frame: number;
      isVisible: boolean;
      isDisposed: boolean;
      isLoading: boolean;
      draw?: () => void;
    } = { frame: 0, isVisible: false, isDisposed: false, isLoading: false };
    const cleanups: (() => void)[] = [];
    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const idle = isReducedMotion ? { x: 0, y: 0 } : IDLE_SPIN;

    // runs only while the die is on screen, scrolling away stops it drawing
    const runLoop = () => {
      cancelAnimationFrame(loop.frame);
      if (!loop.isVisible || loop.isDisposed || !loop.draw) return;
      loop.draw();
      loop.frame = requestAnimationFrame(runLoop);
    };

    const loadScene = async () => {
      loop.isLoading = true;
      const scene = await createScene(container, color);
      if (loop.isDisposed) return scene.dispose();
      const { THREE, renderer, camera, die } = scene;

      rotate.current = (x, y) =>
        die.quaternion.premultiply(
          new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, 0)),
        );
      const resize = () => {
        renderer.setSize(container.clientWidth, container.clientHeight, false);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();
      cleanups.push(() => resizeObserver.disconnect(), scene.dispose);

      loop.draw = () => {
        const speed = spin.current;
        rotate.current?.(speed.x, speed.y);
        // coast to a stop, then settle into a lazy idle drift
        speed.x = speed.x * FRICTION + idle.x * (1 - FRICTION);
        speed.y = speed.y * FRICTION + idle.y * (1 - FRICTION);
        renderer.render(scene.scene, camera);
      };
      runLoop();
    };

    // three (a few hundred kb) only downloads once the die is near the screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        loop.isVisible = entry.isIntersecting;
        if (!entry.isIntersecting) return;
        if (loop.draw) runLoop();
        else if (!loop.isLoading) loadScene();
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);

    return () => {
      loop.isDisposed = true;
      cancelAnimationFrame(loop.frame);
      observer.disconnect();
      for (const cleanup of cleanups) cleanup();
    };
  }, [color]);

  const drag = useRef({ isDragging: false, lastX: 0, lastY: 0, travelled: 0 });

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="A 3D die, drag to spin it, tap to roll it"
      style={{ touchAction: "pan-y" }}
      className={cn(
        "relative size-32 shrink-0 cursor-grab touch-pan-y select-none active:cursor-grabbing",
        className,
      )}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          isDragging: true,
          lastX: event.clientX,
          lastY: event.clientY,
          travelled: 0,
        };
        spin.current = { x: 0, y: 0 };
      }}
      onPointerMove={(event) => {
        if (!drag.current.isDragging) return;
        const deltaX = event.clientX - drag.current.lastX;
        const deltaY = event.clientY - drag.current.lastY;
        drag.current.lastX = event.clientX;
        drag.current.lastY = event.clientY;
        drag.current.travelled += Math.abs(deltaX) + Math.abs(deltaY);
        spin.current = { x: deltaY * 0.012, y: deltaX * 0.012 };
        rotate.current?.(spin.current.x, spin.current.y);
      }}
      onPointerUp={() => {
        const { travelled } = drag.current;
        drag.current.isDragging = false;
        if (travelled > TAP_DISTANCE) return;
        // a tap throws it: a big random spin that coasts down
        triggerHaptic("medium");
        spin.current = {
          x: (Math.random() - 0.5) * 0.7,
          y: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.25),
        };
      }}
      onPointerCancel={() => {
        drag.current.isDragging = false;
      }}
    />
  );
}
