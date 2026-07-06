"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANGLE_OPTIONS, type SpriteItem } from "@/types/hair-studio";
import type { SpriteAngle, SpriteComposition, SpritePose } from "@/lib/api";

interface SpriteGeneratorProps {
  sprites: SpriteItem[];
  onGenerate: (
    angles: SpriteAngle[],
    composition: SpriteComposition,
    pose: SpritePose,
    action: string
  ) => void;
  onRegenerate: (id: string, action?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

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

  const [selectedAngles, setSelectedAngles] = useState<Set<SpriteAngle>>(
    () => new Set<SpriteAngle>(["front"])
  );
  const [composition, setComposition] = useState<SpriteComposition>("full_body");
  const [pose, setPose] = useState<SpritePose>("standing");
  const [action, setAction] = useState("");
  const [editedActions, setEditedActions] = useState<Record<string, string>>({});

  const toggleAngle = (angle: SpriteAngle) => {
    setSelectedAngles((prev) => {
      const next = new Set(prev);
      if (next.has(angle)) {
        next.delete(angle);
      } else {
        next.add(angle);
      }
      return next;
    });
  };

  const handleGenerate = () => {
    onGenerate([...selectedAngles], composition, pose, action);
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
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {ANGLE_OPTIONS.map((option) => {
                const isSelected = selectedAngles.has(option.id);
                return (
                  <button key={option.id} type="button" onClick={() => toggleAngle(option.id)}>
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 text-sm transition-colors",
                        !isSelected && "hover:bg-muted/50"
                      )}
                    >
                      {t(option.labelKey)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Select
                value={composition}
                onValueChange={(v) => setComposition(v as SpriteComposition)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_body">{t("composition.full_body")}</SelectItem>
                  <SelectItem value="half_body">{t("composition.half_body")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={pose} onValueChange={(v) => setPose(v as SpritePose)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standing">{t("pose.standing")}</SelectItem>
                  <SelectItem value="sitting">{t("pose.sitting")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder={t("actionPlaceholder")}
              className="text-sm min-h-[72px]"
            />
          </div>

          <Button onClick={handleGenerate} disabled={selectedAngles.size === 0}>
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
