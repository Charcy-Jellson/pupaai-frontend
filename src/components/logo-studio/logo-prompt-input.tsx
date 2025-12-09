"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2 } from "lucide-react";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface LogoPromptInputProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function LogoPromptInput({
  description,
  onDescriptionChange,
  onGenerate,
  isGenerating,
  disabled = false,
}: LogoPromptInputProps) {
  const t = useTranslations("logoStudio.promptInput");

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={t("placeholder")}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[120px] resize-none"
          disabled={disabled || isGenerating}
        />
        
        <Button
          onClick={onGenerate}
          disabled={disabled || isGenerating || !description.trim()}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {t("generating")}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              {t("generateLogo")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
