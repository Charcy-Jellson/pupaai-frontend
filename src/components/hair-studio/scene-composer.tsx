"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacementCanvas } from "./placement-canvas";
import type { SpriteItem, PlacementTransform } from "@/types/hair-studio";
import type { FuseImageSize } from "@/lib/api";

interface SceneComposerProps {
  sprites: SpriteItem[];
  backgroundDataUrl: string | null;
  imageSize: FuseImageSize;
  onSetBackground: (dataUrl: string | null) => void;
  onSetImageSize: (s: FuseImageSize) => void;
  onCompose: (spriteId: string, draftDataUrl: string, transform: PlacementTransform) => void;
  onBack: () => void;
}

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;
const IMAGE_SIZES: FuseImageSize[] = ["1K", "2K", "4K"];

const readFile = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });

// Cap the long edge of the cropped background so the composite draft can't
// blow past Gemini's ~20MB inline limit / the backend's 25MB body cap when a
// user uploads a high-resolution (e.g. 12MP phone) photo. Never scales up.
const MAX_OUTPUT_DIMENSION = 2048;

async function cropToAspect(dataUrl: string, ratioW: number, ratioH: number): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const target = ratioW / ratioH;
  const cur = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  if (cur > target) {
    sw = img.naturalHeight * target;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / target;
    sy = (img.naturalHeight - sh) / 2;
  }

  // Scale the output canvas down (never up) so its long edge is capped,
  // while keeping the exact aspect ratio.
  const longEdge = Math.max(sw, sh);
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / longEdge);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);

  const c = document.createElement("canvas");
  c.width = dw;
  c.height = dh;
  const ctx = c.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  return c.toDataURL("image/png");
}

export function SceneComposer({
  sprites,
  backgroundDataUrl,
  imageSize,
  onSetBackground,
  onSetImageSize,
  onCompose,
  onBack,
}: SceneComposerProps) {
  const t = useTranslations("hairStudio");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fulfilledSprites = sprites.filter(
    (s) => s.status === "fulfilled" && s.imageDataUrl
  );

  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(
    () => fulfilledSprites[0]?.id ?? null
  );
  const [originalBg, setOriginalBg] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);

  const selectedSprite =
    fulfilledSprites.find((s) => s.id === selectedSpriteId) ?? fulfilledSprites[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await readFile(file);
    setOriginalBg(dataUrl);
    setSelectedAspect(null);
    onSetBackground(dataUrl);
  };

  const handleAspectClick = async (ratio: (typeof ASPECT_RATIOS)[number]) => {
    const source = originalBg ?? backgroundDataUrl;
    if (!source) return;
    const [w, h] = ratio.split(":").map(Number);
    const cropped = await cropToAspect(source, w, h);
    setSelectedAspect(ratio);
    onSetBackground(cropped);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>

        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" />
          {t("uploadBackground")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4 space-y-5">
          {backgroundDataUrl && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">{t("aspect")}</span>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button key={ratio} type="button" onClick={() => handleAspectClick(ratio)}>
                    <Badge
                      variant={selectedAspect === ratio ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 text-sm transition-colors",
                        selectedAspect !== ratio && "hover:bg-muted/50"
                      )}
                    >
                      {ratio}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">{t("resolution")}</span>
            <div className="flex flex-wrap gap-2">
              {IMAGE_SIZES.map((size) => (
                <button key={size} type="button" onClick={() => onSetImageSize(size)}>
                  <Badge
                    variant={imageSize === size ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-sm transition-colors",
                      imageSize !== size && "hover:bg-muted/50"
                    )}
                  >
                    {size}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {fulfilledSprites.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                {fulfilledSprites.map((sprite) => (
                  <button
                    key={sprite.id}
                    type="button"
                    onClick={() => setSelectedSpriteId(sprite.id)}
                    className={cn(
                      "relative w-16 h-16 rounded-lg overflow-hidden border-2 bg-muted transition-colors",
                      selectedSprite?.id === sprite.id
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    {sprite.imageDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sprite.imageDataUrl}
                        alt={sprite.angle}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noSprites")}</p>
          )}
        </CardContent>
      </Card>

      {backgroundDataUrl && selectedSprite?.imageDataUrl ? (
        <PlacementCanvas
          key={`${selectedSprite.id}-${backgroundDataUrl.length}`}
          backgroundDataUrl={backgroundDataUrl}
          spriteDataUrl={selectedSprite.imageDataUrl}
          onConfirm={(draft, tf) => onCompose(selectedSprite.id, draft, tf)}
        />
      ) : null}
    </div>
  );
}
