"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle, ArrowLeft, ArrowRight, ChevronDown, Loader2, Plus, RefreshCw, Sparkles, Upload, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ANGLE_OPTIONS, type SpriteItem, type SpriteOverrides, type SpriteShot } from "@/types/hair-studio";
import type { SpriteAngle, SpriteComposition, SpritePose } from "@/lib/api";

interface SpriteGeneratorProps {
  sprites: SpriteItem[];
  overrides: SpriteOverrides;
  onOverridesChange: (patch: Partial<SpriteOverrides>) => void;
  onGenerate: (shots: SpriteShot[]) => void;
  onRegenerate: (id: string, action?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

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

// Verify the browser can actually decode the image data (not just that the
// file extension/MIME type looked right). Unsupported formats throw a
// DOMException here ("The source image cannot be decoded.") — callers
// should catch this and surface a translated, actionable message instead.
const assertDecodable = (dataUrl: string): Promise<void> => {
  const img = new Image();
  img.src = dataUrl;
  return img.decode();
};

type OverrideKey = "hair" | "outfit";

const DEFAULT_SHOT: SpriteShot = {
  angle: "front",
  composition: "full_body",
  pose: "standing",
  action: "",
};

const CHECKERBOARD = {
  backgroundImage:
    "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
} as const;

export function SpriteGenerator({
  sprites,
  overrides,
  onOverridesChange,
  onGenerate,
  onRegenerate,
  onNext,
  onBack,
}: SpriteGeneratorProps) {
  const t = useTranslations("hairStudio");

  const [shots, setShots] = useState<SpriteShot[]>([{ ...DEFAULT_SHOT }]);
  const [editedActions, setEditedActions] = useState<Record<string, string>>({});
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [draggingKey, setDraggingKey] = useState<OverrideKey | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const updateShot = (index: number, patch: Partial<SpriteShot>) => {
    setShots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addShot = () => {
    setShots((prev) => [...prev, { ...prev[prev.length - 1] }]);
  };

  const removeShot = (index: number) => {
    setShots((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const isProcessing = sprites.some((s) => s.status === "processing");

  const handleGenerate = () => {
    onGenerate(shots);
  };

  // Shared handler for both the click-to-upload input and drag-and-drop.
  // Dropped files bypass the <input accept> filter, so the MIME type is
  // validated here, and the image is decode-checked so unsupported formats
  // surface a clear, translated error instead of a raw DOMException.
  const processOverrideFile = async (key: OverrideKey, file: File) => {
    setOverrideError(null);
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setOverrideError(t("invalidImage"));
      return;
    }
    const dataUrl = await readFile(file);
    try {
      await assertDecodable(dataUrl);
    } catch {
      setOverrideError(t("invalidImage"));
      return;
    }
    onOverridesChange(key === "hair" ? { hairImage: dataUrl } : { outfitImage: dataUrl });
  };

  const handleOverrideFileChange = (key: OverrideKey) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await processOverrideFile(key, file);
  };

  const handleOverrideDragOver = (key: OverrideKey) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingKey(key);
  };

  const handleOverrideDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingKey(null);
  };

  const handleOverrideDrop = (key: OverrideKey) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingKey(null);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    await processOverrideFile(key, file);
  };

  const clearOverrideImage = (key: OverrideKey) => {
    onOverridesChange(key === "hair" ? { hairImage: null } : { outfitImage: null });
  };

  const getEditedAction = (sprite: SpriteItem) =>
    editedActions[sprite.id] ?? sprite.action;

  const handleRegenerate = (sprite: SpriteItem) => {
    onRegenerate(sprite.id, getEditedAction(sprite));
  };

  const hasFulfilled = sprites.some((s) => s.status === "fulfilled");

  return (
    <div className="space-y-6">
      {/* Overrides */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 p-4"
          onClick={() => setOverridesOpen((v) => !v)}
        >
          <p className="text-sm font-medium">{t("overridesTitle")}</p>
          <ChevronDown
            className={cn("w-4 h-4 text-muted-foreground transition-transform", overridesOpen && "rotate-180")}
          />
        </button>
        {overridesOpen && (
          <CardContent className="p-4 pt-0 space-y-4">
            {overrideError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{overrideError}</AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">{t("overrideHint")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["hair", "outfit"] as const satisfies readonly OverrideKey[]).map((key) => {
                const image = key === "hair" ? overrides.hairImage : overrides.outfitImage;
                const desc = key === "hair" ? overrides.hairDesc : overrides.outfitDesc;
                return (
                  <div key={key} className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2">
                    <Label className="text-xs font-medium">
                      {t(key === "hair" ? "overrideHair" : "overrideOutfit")}
                    </Label>

                    {image ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt={key} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                          onClick={() => clearOverrideImage(key)}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label
                        className={cn(
                          "flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center px-1",
                          draggingKey === key
                            ? "border-primary bg-primary/10"
                            : "bg-muted/20 hover:bg-muted/40"
                        )}
                        onDragOver={handleOverrideDragOver(key)}
                        onDragEnter={handleOverrideDragOver(key)}
                        onDragLeave={handleOverrideDragLeave}
                        onDrop={handleOverrideDrop(key)}
                      >
                        <Upload
                          className={cn("w-4 h-4", draggingKey === key ? "text-primary" : "text-muted-foreground")}
                        />
                        <span
                          className={cn(
                            "text-[10px] mt-1 leading-tight",
                            draggingKey === key ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {draggingKey === key ? t("dropHere") : t("clickOrDragImage")}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleOverrideFileChange(key)}
                        />
                      </label>
                    )}

                    <Input
                      value={desc}
                      onChange={(e) => onOverridesChange(
                        key === "hair" ? { hairDesc: e.target.value } : { outfitDesc: e.target.value }
                      )}
                      placeholder={t(key === "hair" ? "overrideHair" : "overrideOutfit")}
                      disabled={!!image}
                      className="text-sm h-8"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Controls */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4 space-y-5">
          <div className="space-y-3">
            {shots.map((shot, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("shotLabel", { count: index + 1 })}
                  </p>
                  {shots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label={t("removeShot")}
                      onClick={() => removeShot(index)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    value={shot.angle}
                    onValueChange={(v) => updateShot(index, { angle: v as SpriteAngle })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANGLE_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={shot.composition}
                    onValueChange={(v) =>
                      updateShot(index, { composition: v as SpriteComposition })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_body">{t("composition.full_body")}</SelectItem>
                      <SelectItem value="half_body">{t("composition.half_body")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={shot.pose}
                    onValueChange={(v) => updateShot(index, { pose: v as SpritePose })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standing">{t("pose.standing")}</SelectItem>
                      <SelectItem value="sitting">{t("pose.sitting")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  value={shot.action}
                  onChange={(e) => updateShot(index, { action: e.target.value })}
                  placeholder={t("actionPlaceholder")}
                  className="text-sm"
                />
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addShot}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t("addShot")}
            </Button>
          </div>

          <Button onClick={handleGenerate} disabled={shots.length === 0 || isProcessing}>
            <Sparkles className="w-4 h-4 mr-2" />
            {t("generateSprites")}
          </Button>
        </CardContent>
      </Card>

      {/* Sprite grid */}
      {sprites.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sprites.map((sprite) => {
            const angleLabelKey = ANGLE_OPTIONS.find((a) => a.id === sprite.angle)?.labelKey;
            return (
              <Card key={sprite.id} className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
                <CardContent className="p-3 space-y-2">
                  <div
                    className="relative w-full aspect-square rounded-md overflow-hidden border border-border/50"
                    style={CHECKERBOARD}
                  >
                    {sprite.imageDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sprite.imageDataUrl}
                        alt={angleLabelKey ? t(angleLabelKey) : sprite.angle}
                        className="w-full h-full object-contain"
                      />
                    )}

                    {sprite.status === "processing" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}

                    {sprite.status === "rejected" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 p-2 text-center">
                        <p className="text-xs text-destructive-foreground">{sprite.error}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {angleLabelKey ? t(angleLabelKey) : sprite.angle}
                  </p>

                  {(sprite.status === "fulfilled" || sprite.status === "rejected") && (
                    <div className="space-y-1.5">
                      <Input
                        value={getEditedAction(sprite)}
                        onChange={(e) =>
                          setEditedActions((prev) => ({ ...prev, [sprite.id]: e.target.value }))
                        }
                        placeholder={t("actionPlaceholder")}
                        className="h-8 text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => handleRegenerate(sprite)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        {t("regenerate")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
        <Button onClick={onNext} disabled={!hasFulfilled}>
          {t("nextCompose")}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
