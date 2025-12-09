"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, MapPin, Move, Footprints } from "lucide-react";
import {
  SceneOption,
  PoseOption,
  PantsType,
  SCENE_OPTIONS,
  POSE_OPTIONS,
  PANTS_OPTIONS,
} from "@/types/model-studio";
import { cn } from "@/lib/utils";

interface OptionsPanelProps {
  selectedScene: SceneOption;
  selectedPoses: PoseOption[];
  selectedPantsType: PantsType;
  onSceneChange: (scene: SceneOption) => void;
  onPoseToggle: (pose: PoseOption) => void;
  onPantsTypeChange: (pantsType: PantsType) => void;
  disabled?: boolean;
}

export function OptionsPanel({
  selectedScene,
  selectedPoses,
  selectedPantsType,
  onSceneChange,
  onPoseToggle,
  onPantsTypeChange,
  disabled = false,
}: OptionsPanelProps) {
  const t = useTranslations("modelStudio.optionsPanel");

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-orange-400" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Scene Selection */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            {t("scene")}
          </Label>
          <Select
            value={selectedScene}
            onValueChange={(v) => onSceneChange(v as SceneOption)}
            disabled={disabled}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex flex-col items-start">
                    <span>{option.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pose Selection (Multi) */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Move className="w-3 h-3 text-muted-foreground" />
            {t("poses")}
          </Label>
          <div className="flex flex-wrap gap-2">
            {POSE_OPTIONS.map((option) => {
              const isSelected = selectedPoses.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => onPoseToggle(option.id)}
                  disabled={disabled}
                  className={cn(
                    "px-3 py-2 rounded-lg border transition-all text-sm",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 hover:bg-muted/50 border-border/50",
                    disabled && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">{option.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("posesSelected", { count: selectedPoses.length })}
          </p>
        </div>

        {/* Pants Type Selection */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Footprints className="w-3 h-3 text-muted-foreground" />
            {t("bottomWear")}
          </Label>
          <Select
            value={selectedPantsType}
            onValueChange={(v) => onPantsTypeChange(v as PantsType)}
            disabled={disabled}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PANTS_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{t("generationSummary")}:</span>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {t("sceneLabel")}: {SCENE_OPTIONS.find((s) => s.id === selectedScene)?.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedPoses.length} {t("posesLabel")}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {PANTS_OPTIONS.find((p) => p.id === selectedPantsType)?.name}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
