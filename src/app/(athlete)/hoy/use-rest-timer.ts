"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const DEFAULT_REST_SECONDS = 90;

/**
 * Cronómetro de descanso entre series (diseño: overlay de la vista "enfoque").
 * Solo cuenta hacia atrás; no persiste — si se recarga la página el descanso se
 * pierde a propósito (el registro de la serie ya está guardado en el servidor).
 */
export function useRestTimer(total: number = DEFAULT_REST_SECONDS) {
  const [left, setLeft] = useState(0);
  const [target, setTarget] = useState(total);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (left <= 0) return;
    raf.current = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, [left]);

  const start = useCallback(
    (seconds: number = total) => {
      setTarget(seconds);
      setLeft(seconds);
    },
    [total],
  );

  return {
    left,
    total: target,
    running: left > 0,
    /** Fracción transcurrida 0..1 — alimenta el anillo `conic-gradient`. */
    elapsed: target > 0 ? 1 - left / target : 0,
    start,
    add: useCallback((seconds: number) => {
      setTarget((t) => t + seconds);
      setLeft((v) => v + seconds);
    }, []),
    skip: useCallback(() => setLeft(0), []),
  };
}

export function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
