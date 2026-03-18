'use client'

import { useEffect, useRef } from "react";
import { MotionValue, useMotionValue, useReducedMotion } from "framer-motion";

type UseFollowCursorResult = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  lastRaw: { x: number; y: number };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function useFollowCursor(): UseFollowCursorResult {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const lastRaw = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      x.set(0);
      y.set(0);
      return undefined;
    }

    const state = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };

    const update = () => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const normalizedX = clamp((state.clientX - centerX) / centerX, -1, 1);
      const normalizedY = clamp((state.clientY - centerY) / centerY, -1, 1);

      lastRaw.current = { x: state.clientX, y: state.clientY };
      x.set(normalizedX);
      y.set(normalizedY);
      rafRef.current = null;
    };

    const onMouseMove = (event: MouseEvent) => {
      state.clientX = event.clientX;
      state.clientY = event.clientY;
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [prefersReducedMotion, x, y]);

  return {
    x,
    y,
    lastRaw: lastRaw.current,
  };
}
