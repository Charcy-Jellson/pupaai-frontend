"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Sparkles, ArrowLeft, Save, Loader2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardBuilderState } from "@/types/hair-studio";

interface CharacterCardBuilderProps {
  builder: CardBuilderState;
  onChange: (patch: Partial<CardBuilderState>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generatedCardDataUrl: string | null;
  onSave: () => void;
  onBack: () => void;
}

type DimensionKey = "face" | "hair" | "outfit";

const DIMENSIONS = [{ key: "face" }, { key: "hair" }, { key: "outfit" }] as const satisfies readonly { key: DimensionKey }[];

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

export function CharacterCardBuilder({
  builder,
  onChange,
  onGenerate,
  isGenerating,
  generatedCardDataUrl,
  onSave,
  onBack,
}: CharacterCardBuilderProps) {
  const t = useTranslations("hairStudio");
  const [imageErrors, setImageErrors] = useState<Partial<Record<DimensionKey, string>>>({});
  const [draggingKey, setDraggingKey] = useState<DimensionKey | null>(null);

  // Shared handler for both the click-to-upload input and drag-and-drop.
  // Dropped files bypass the <input accept> filter, so the MIME type is
  // validated here, and the image is decode-checked so unsupported formats
  // surface a clear, translated error instead of a raw DOMException.
  const processFile = async (key: DimensionKey, file: File) => {
    setImageErrors((prev) => ({ ...prev, [key]: undefined }));
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setImageErrors((prev) => ({ ...prev, [key]: t("invalidImage") }));
      return;
    }
    const dataUrl = await readFile(file);
    try {
      await assertDecodable(dataUrl);
    } catch {
      setImageErrors((prev) => ({ ...prev, [key]: t("invalidImage") }));
      return;
    }
    const imgField = `${key}Image` as keyof CardBuilderState;
    onChange({ [imgField]: dataUrl } as Partial<CardBuilderState>);
  };

  const handleFileChange = async (
    key: DimensionKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await processFile(key, file);
  };

  const handleDragOver = (key: DimensionKey) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingKey(key);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingKey(null);
  };

  const handleDrop = (key: DimensionKey) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingKey(null);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    await processFile(key, file);
  };

  const clearImage = (key: DimensionKey) => {
    const imgField = `${key}Image` as keyof CardBuilderState;
    onChange({ [imgField]: null } as Partial<CardBuilderState>);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left column: inputs */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t("characterName")}</Label>
          <Input
            value={builder.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={t("characterName")}
          />
        </div>

        {DIMENSIONS.map(({ key }) => {
          const imgField = `${key}Image` as keyof CardBuilderState;
          const descField = `${key}Desc` as keyof CardBuilderState;
          const image = builder[imgField] as string | null;
          const desc = builder[descField] as string;

          return (
            <Card key={key} className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t(`dims.${key}`)}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dimHint")}</p>
                </div>

                {image ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={key} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                      onClick={() => clearImage(key)}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center px-1",
                      draggingKey === key
                        ? "border-primary bg-primary/10"
                        : "bg-muted/20 hover:bg-muted/40"
                    )}
                    onDragOver={handleDragOver(key)}
                    onDragEnter={handleDragOver(key)}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop(key)}
                  >
                    <Upload
                      className={cn(
                        "w-5 h-5",
                        draggingKey === key ? "text-primary" : "text-muted-foreground"
                      )}
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
                      onChange={(e) => handleFileChange(key, e)}
                    />
                  </label>
                )}

                {imageErrors[key] && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs">{imageErrors[key]}</AlertDescription>
                  </Alert>
                )}

                <Textarea
                  value={desc}
                  onChange={(e) => onChange({ [descField]: e.target.value } as Partial<CardBuilderState>)}
                  placeholder={t("dimHint")}
                  className="text-sm min-h-[72px]"
                />
              </CardContent>
            </Card>
          );
        })}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onBack} disabled={isGenerating}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back")}
          </Button>
          <Button onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {t("generateCard")}
          </Button>
        </div>
      </div>

      {/* Right column: preview */}
      <div>
        {generatedCardDataUrl ? (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-border/50 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedCardDataUrl}
                alt={builder.name || "character card"}
                className="w-full h-auto object-contain"
              />
            </div>
            <Button className="w-full" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              {t("saveToLibrary")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border/50 bg-muted/20 gap-2">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("dimHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
