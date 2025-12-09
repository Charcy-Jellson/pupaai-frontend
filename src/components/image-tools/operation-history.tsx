"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ImageOperation } from "@/types";
import { 
  Undo2, 
  RotateCw, 
  Crop, 
  Maximize2, 
  Scissors, 
  Eraser, 
  Wand2,
  History,
  FileDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OperationHistoryProps {
  operations: ImageOperation[];
  onUndo: () => void;
}

const operationIcons: Record<ImageOperation["type"], React.ComponentType<{ className?: string }>> = {
  crop: Crop,
  resize: Maximize2,
  rotate: RotateCw,
  compress: FileDown,
  "extract-logo": Scissors,
  "remove-background": Eraser,
  "remove-logo": Wand2,
};

export function OperationHistory({ operations, onUndo }: OperationHistoryProps) {
  const t = useTranslations("imageTools");

  const operationLabels: Record<ImageOperation["type"], string> = {
    crop: t("tools.crop"),
    resize: t("resize"),
    rotate: t("tools.rotate"),
    compress: t("compress"),
    "extract-logo": t("tools.extractLogo"),
    "remove-background": t("tools.removeBackgroundShort"),
    "remove-logo": t("tools.removeLogoShort"),
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" />
            {t("operationHistory")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={operations.length === 0}
            className="text-muted-foreground hover:text-white"
          >
            <Undo2 className="w-4 h-4 mr-1" />
            {t("undo")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {operations.map((operation, index) => {
              const Icon = operationIcons[operation.type];
              const label = operationLabels[operation.type];
              
              return (
                <div
                  key={operation.id}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg",
                    "bg-muted/50 border border-border/50",
                    "min-w-[80px]",
                    index === operations.length - 1 && "border-violet-500/50 bg-violet-500/10"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-[10px] text-muted-foreground/50">
                    #{index + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        {operations.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {t("noOperationsYet")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
