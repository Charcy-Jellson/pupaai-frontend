"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Upload, Check } from "lucide-react";
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

// Browsers (Chrome in particular) cannot decode HEIC/HEIF, which is the
// default photo format on iPhone/macOS. Accept only formats every major
// browser can actually decode, matching the app's other image uploaders.
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

// Verify the browser can actually decode the image data (not just that the
// file extension/MIME type looked right). HEIC/HEIF files, or any other
// format the browser can't decode, throw a DOMException here ("The source
// image cannot be decoded.") — callers should catch this and surface a
// translated, actionable message instead of the raw browser error.
async function assertDecodable(dataUrl: string): Promise<void> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
}

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

  const fulfilledSprites = sprites.filter(
    (s) => s.status === "fulfilled" && s.imageDataUrl
  );

  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(
    () => fulfilledSprites[0]?.id ?? null
  );
  const [originalBg, setOriginalBg] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sprite ids already composed onto the CURRENT background, so the user can
  // see progress while placing multiple sprites (e.g. front + back) one at a
  // time onto the same background. Reset whenever the background changes,
  // since "composed" is only meaningful relative to a specific background.
  const [composedSpriteIds, setComposedSpriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setComposedSpriteIds(new Set());
  }, [backgroundDataUrl]);

  const selectedSprite =
    fulfilledSprites.find((s) => s.id === selectedSpriteId) ?? fulfilledSprites[0];

  // Shared handler for both the click-to-upload input and drag-and-drop.
  // Dropped files bypass the <input accept> filter, so the MIME type is
  // validated here, and the image is decode-checked so unsupported formats
  // (e.g. HEIC photos from iPhone/macOS, which Chrome cannot decode) surface
  // a clear, translated error instead of a raw DOMException.
  const processFile = async (file: File) => {
    setUploadError(null);
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setUploadError(t("invalidImage"));
      return;
    }
    const dataUrl = await readFile(file);
    try {
      await assertDecodable(dataUrl);
    } catch {
      setUploadError(t("invalidImage"));
      return;
    }
    setOriginalBg(dataUrl);
    setSelectedAspect(null);
    onSetBackground(dataUrl);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    await processFile(file);
  };

  const handleAspectClick = async (ratio: (typeof ASPECT_RATIOS)[number]) => {
    const source = originalBg ?? backgroundDataUrl;
    if (!source) return;
    const [w, h] = ratio.split(":").map(Number);
    try {
      const cropped = await cropToAspect(source, w, h);
      setSelectedAspect(ratio);
      onSetBackground(cropped);
    } catch {
      setUploadError(t("invalidImage"));
    }
  };

  return (
    <div className="space-y-6">
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>

        <label
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/10 text-primary"
              : "border-input bg-background hover:bg-muted/50"
          )}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-4 h-4" />
          {isDragging ? t("dropHere") : t("uploadBackground")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
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
              <p className="text-xs text-muted-foreground">{t("composeHint")}</p>
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
                    {composedSpriteIds.has(sprite.id) && (
                      <span
                        className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground"
                        title={t("composedBadge")}
                      >
                        <Check className="w-3 h-3" />
                      </span>
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
          onConfirm={(draft, tf) => {
            onCompose(selectedSprite.id, draft, tf);
            setComposedSpriteIds((prev) => new Set(prev).add(selectedSprite.id));
          }}
        />
      ) : null}
    </div>
  );
}
