"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import type { PlacementTransform } from "@/types/hair-studio";

interface PlacementCanvasProps {
  backgroundDataUrl: string;
  spriteDataUrl: string;
  // draftDataUrl = composited PNG; transform = sprite placement (x,y top-left as
  // fraction of background; scale = sprite width / background width)
  onConfirm: (draftDataUrl: string, transform: PlacementTransform) => void;
}

export function PlacementCanvas({ backgroundDataUrl, spriteDataUrl, onConfirm }: PlacementCanvasProps) {
  const t = useTranslations("hairStudio");
  const containerRef = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState<PlacementTransform>({ x: 0.35, y: 0.2, scale: 0.5 });
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origX: tf.x, origY: tf.y };
  }, [tf.x, tf.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    const clamp = (v: number) => Math.max(-0.9, Math.min(0.9, v));
    // Snapshot origX/origY into locals above — never deref `drag.current`
    // inside this updater. React may invoke the updater asynchronously,
    // after pointerup/pointercancel has already reset drag.current to null,
    // which previously crashed with "Cannot read properties of null".
    setTf((p) => ({ ...p, x: clamp(d.origX + dx), y: clamp(d.origY + dy) }));
  }, []);

  const onPointerUp = useCallback(() => { drag.current = null; }, []);

  const confirm = useCallback(async () => {
    setBusy(true);
    try {
      const bg = new Image();
      bg.src = backgroundDataUrl;
      await bg.decode();
      const sp = new Image();
      sp.src = spriteDataUrl;
      await sp.decode();

      const canvas = document.createElement("canvas");
      canvas.width = bg.naturalWidth;
      canvas.height = bg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      ctx.drawImage(bg, 0, 0);
      const spriteW = canvas.width * tf.scale;
      const spriteH = spriteW * (sp.naturalHeight / sp.naturalWidth);
      ctx.drawImage(sp, tf.x * canvas.width, tf.y * canvas.height, spriteW, spriteH);

      onConfirm(canvas.toDataURL("image/png"), tf);
    } finally {
      setBusy(false);
    }
  }, [backgroundDataUrl, spriteDataUrl, tf, onConfirm]);

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div
          ref={containerRef}
          // inline-block + the flex/justify-center wrapper above so the
          // container hugs the rendered size of the background image
          // exactly. If the container were always full-width, a tall/large
          // photo capped by max-h below would leave empty space inside the
          // container that the sprite's x/y percentages don't account for.
          className="relative inline-block max-w-full overflow-hidden rounded-lg border select-none bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundDataUrl}
            alt="background"
            className="block w-auto h-auto max-w-full max-h-[60vh] object-contain"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spriteDataUrl}
            alt="sprite"
            draggable={false}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute cursor-move touch-none"
            style={{ left: `${tf.x * 100}%`, top: `${tf.y * 100}%`, width: `${tf.scale * 100}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t("placement.size")}</span>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={tf.scale}
          onChange={(e) => setTf((p) => ({ ...p, scale: Number(e.target.value) }))}
          className="flex-1"
        />
        <Button onClick={confirm} disabled={busy}>
          {t("placement.confirm")}
        </Button>
      </div>
    </div>
  );
}
