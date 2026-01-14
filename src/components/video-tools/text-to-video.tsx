"use client";

import { useTranslations } from "next-intl";
import { Type, Wand2, Video, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TextToVideo() {
  const t = useTranslations("videoTools.textToVideo");
  const tc = useTranslations("common");

  return (
    <div className="space-y-6">
      {/* Coming Soon Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
            <Type className="w-8 h-8 text-blue-400" />
          </div>
          <Badge variant="outline" className="mb-3 border-blue-500/50 text-blue-400">
            {tc("comingSoon")}
          </Badge>
          <h3 className="text-xl font-semibold text-white mb-2">
            {t("title")}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {t("description")}
          </p>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            {t("plannedFeatures")}
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {["promptInput", "styleSelection", "durationControl", "aiGeneration"].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 opacity-60"
              >
                <Wand2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t(`features.${feature}`)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Input Area */}
      <Card className="bg-card/50 border-border/50 border-dashed opacity-50 cursor-not-allowed">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <Video className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">{t("inputPlaceholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}




