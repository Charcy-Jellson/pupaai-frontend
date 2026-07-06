"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Plus, RefreshCw, Sparkles, X } from "lucide-react";
import { ANGLE_OPTIONS, type SpriteItem, type SpriteShot } from "@/types/hair-studio";
import type { SpriteAngle, SpriteComposition, SpritePose } from "@/lib/api";

interface SpriteGeneratorProps {
  sprites: SpriteItem[];
  onGenerate: (shots: SpriteShot[]) => void;
  onRegenerate: (id: string, action?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

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
  onGenerate,
  onRegenerate,
  onNext,
  onBack,
}: SpriteGeneratorProps) {
  const t = useTranslations("hairStudio");

  const [shots, setShots] = useState<SpriteShot[]>([{ ...DEFAULT_SHOT }]);
  const [editedActions, setEditedActions] = useState<Record<string, string>>({});

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

  const getEditedAction = (sprite: SpriteItem) =>
    editedActions[sprite.id] ?? sprite.action;

  const handleRegenerate = (sprite: SpriteItem) => {
    onRegenerate(sprite.id, getEditedAction(sprite));
  };

  const hasFulfilled = sprites.some((s) => s.status === "fulfilled");

  return (
    <div className="space-y-6">
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
