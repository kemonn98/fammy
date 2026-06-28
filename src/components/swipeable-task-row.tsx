"use client";

import { useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 72;
const MAX_DRAG = 108;

interface SwipeableTaskRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  canSwipeRight?: boolean;
  canSwipeLeft?: boolean;
}

export function SwipeableTaskRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  canSwipeRight = true,
  canSwipeLeft = true,
}: SwipeableTaskRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const active = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
    active.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!active.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - start.current.x;
    const deltaY = touch.clientY - start.current.y;

    if (!dragging) {
      if (Math.abs(deltaX) < 8) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        active.current = false;
        return;
      }
      setDragging(true);
    }

    let next = deltaX;
    if (!canSwipeRight && next > 0) next = 0;
    if (!canSwipeLeft && next < 0) next = 0;
    next = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, next));
    setOffset(next);
  }

  function onTouchEnd() {
    if (dragging) {
      if (offset > SWIPE_THRESHOLD && canSwipeRight) onSwipeRight?.();
      else if (offset < -SWIPE_THRESHOLD && canSwipeLeft) onSwipeLeft?.();
    }
    setOffset(0);
    setDragging(false);
    active.current = false;
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 flex">
        <div
          className={cn(
            "flex w-28 items-center justify-start bg-primary px-4 text-primary-foreground transition-opacity",
            offset > 0 ? "opacity-100" : "opacity-0",
          )}
        >
          <Check className="size-5" />
          <span className="ml-2 text-sm font-medium">Selesai</span>
        </div>
        <div className="flex-1" />
        <div
          className={cn(
            "flex w-28 items-center justify-end bg-destructive px-4 text-white transition-opacity",
            offset < 0 ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="mr-2 text-sm font-medium">Hapus</span>
          <Trash2 className="size-5" />
        </div>
      </div>

      <div
        className={cn(
          "relative touch-pan-y",
          dragging ? "transition-none" : "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
