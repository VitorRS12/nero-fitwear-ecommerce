import { Move } from "lucide-react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

export interface ImagePosition {
  x: number;
  y: number;
}

interface ImagePositionEditorProps {
  src: string;
  alt: string;
  value: ImagePosition;
  onChange: (position: ImagePosition) => void;
  className?: string;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Prévia acessível para escolher o ponto focal arrastando a própria imagem. */
export function ImagePositionEditor({
  src,
  alt,
  value,
  onChange,
  className,
}: ImagePositionEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    onChange({
      x: clamp(((clientX - bounds.left) / bounds.width) * 100),
      y: clamp(((clientY - bounds.top) / bounds.height) * 100),
    });
  };

  return (
    <div
      ref={frameRef}
      role="slider"
      tabIndex={0}
      aria-label="Posição da imagem"
      aria-valuetext={`${Math.round(value.x)}% horizontal, ${Math.round(value.y)}% vertical`}
      className={cn(
        "relative touch-none cursor-move overflow-hidden border border-border bg-graphite outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          updateFromPointer(event.clientX, event.clientY);
        }
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 10 : 2;
        const movement = {
          ArrowLeft: { x: -step, y: 0 },
          ArrowRight: { x: step, y: 0 },
          ArrowUp: { x: 0, y: -step },
          ArrowDown: { x: 0, y: step },
        }[event.key];
        if (!movement) return;
        event.preventDefault();
        onChange({ x: clamp(value.x + movement.x), y: clamp(value.y + movement.y) });
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="pointer-events-none h-full w-full select-none object-cover"
        style={{ objectPosition: `${value.x}% ${value.y}%` }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-foreground bg-background/80 text-foreground"
        style={{ left: `${value.x}%`, top: `${value.y}%` }}
      >
        <Move className="size-4" />
      </span>
      <span className="label-caps pointer-events-none absolute bottom-2 left-2 bg-background/85 px-2 py-1">
        Arraste para enquadrar
      </span>
    </div>
  );
}