"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 128;
const MAX_DRAG = 220;
const EXIT_DURATION = 260;

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
  const [removing, setRemoving] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const active = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    if (removing) return;
    const touch = e.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
    active.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!active.current || removing) return;

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

  function triggerDelete() {
    setDragging(false);
    setRemoving(true);
    active.current = false;
    exitTimer.current = setTimeout(() => onSwipeLeft?.(), EXIT_DURATION);
  }

  function onTouchEnd() {
    active.current = false;
    if (!dragging) {
      setOffset(0);
      return;
    }
    setDragging(false);

    if (offset > SWIPE_THRESHOLD && canSwipeRight) {
      onSwipeRight?.();
      setOffset(0);
    } else if (offset < -SWIPE_THRESHOLD && canSwipeLeft) {
      triggerDelete();
    } else {
      setOffset(0);
    }
  }

  const dragProgress = Math.min(1, Math.abs(offset) / MAX_DRAG);
  const swipingLeft = offset < 0;

  const contentTransform = removing
    ? "translateX(-100%)"
    : `translateX(${offset}px)`;
  const contentOpacity = removing
    ? 0
    : swipingLeft
      ? 1 - dragProgress * 0.85
      : 1;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="pointer-events-none absolute inset-0 flex">
        <div
          className="flex items-center justify-start bg-primary px-4 text-primary-foreground"
          style={{ width: MAX_DRAG, opacity: offset > 0 ? dragProgress : 0 }}
        >
          <Check className="size-5" />
          <span className="ml-2 text-sm font-medium">Selesai</span>
        </div>
        <div className="flex-1" />
        <div
          className="flex items-center justify-end bg-destructive px-4 text-white"
          style={{
            width: MAX_DRAG,
            opacity: removing ? 1 : swipingLeft ? dragProgress : 0,
          }}
        >
          <span className="mr-2 text-sm font-medium">Hapus</span>
          <Trash2 className="size-5" />
        </div>
      </div>

      <div
        className={cn(
          "relative touch-pan-y",
          dragging
            ? "transition-none"
            : "transition-all duration-200 ease-out",
          removing && "ease-in",
        )}
        style={{
          transform: contentTransform,
          opacity: contentOpacity,
          transitionDuration: removing ? `${EXIT_DURATION}ms` : undefined,
        }}
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
