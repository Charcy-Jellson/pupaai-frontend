"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import {
  ModelGenerationOptions,
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  HAIR_OPTIONS,
  AGE_OPTIONS,
} from "@/types/model-studio";

interface ModelGeneratorProps {
  options: ModelGenerationOptions;
  onOptionsChange: (options: Partial<ModelGenerationOptions>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function ModelGenerator({
  options,
  onOptionsChange,
  onGenerate,
  isGenerating,
  disabled = false,
}: ModelGeneratorProps) {
  return (
    <div className="space-y-4">
      {/* Ethnicity */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ethnicity</Label>
        <Select
          value={options.ethnicity}
          onValueChange={(v) => onOptionsChange({ ethnicity: v as ModelGenerationOptions["ethnicity"] })}
          disabled={disabled || isGenerating}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ETHNICITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Gender</Label>
        <Select
          value={options.gender}
          onValueChange={(v) => onOptionsChange({ gender: v as ModelGenerationOptions["gender"] })}
          disabled={disabled || isGenerating}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hair Length */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Hair</Label>
        <Select
          value={options.hairLength}
          onValueChange={(v) => onOptionsChange({ hairLength: v as ModelGenerationOptions["hairLength"] })}
          disabled={disabled || isGenerating}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HAIR_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Age Group */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Age</Label>
        <Select
          value={options.ageGroup}
          onValueChange={(v) => onOptionsChange({ ageGroup: v as ModelGenerationOptions["ageGroup"] })}
          disabled={disabled || isGenerating}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name} ({opt.range})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Glasses Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Glasses</Label>
        <Switch
          checked={options.glasses}
          onCheckedChange={(v) => onOptionsChange({ glasses: v })}
          disabled={disabled || isGenerating}
        />
      </div>

      {/* Generate Button */}
      <Button
        className="w-full"
        onClick={onGenerate}
        disabled={disabled || isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Model
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        AI will generate a fashion model in white underwear
      </p>
    </div>
  );
}





