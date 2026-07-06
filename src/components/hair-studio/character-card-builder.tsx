"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, ArrowLeft, Save, Loader2, X } from "lucide-react";
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

const readFile = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });

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

  const handleFileChange = async (
    key: DimensionKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await readFile(file);
    const imgField = `${key}Image` as keyof CardBuilderState;
    onChange({ [imgField]: dataUrl } as Partial<CardBuilderState>);
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
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(key, e)}
                    />
                  </label>
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
