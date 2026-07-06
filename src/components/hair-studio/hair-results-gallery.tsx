"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Save, RotateCcw, Sparkles, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FuseResultItem } from "@/types/hair-studio";

interface HairResultsGalleryProps {
  results: FuseResultItem[];
  onRun: (id: string) => void;
  onRerun: (id: string) => void;
  onSave: (result: FuseResultItem) => void;
  onDownload: (result: FuseResultItem) => void;
}

export function HairResultsGallery({
  results,
  onRun,
  onRerun,
  onSave,
  onDownload,
}: HairResultsGalleryProps) {
  const t = useTranslations("hairStudio");

  if (results.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {results.map((result) => {
        const previewSrc = result.resultDataUrl ?? result.draftDataUrl ?? null;
        const isFinal = !!result.resultDataUrl;

        return (
          <Card key={result.id} className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
            <CardContent className="p-3 space-y-2">
              <div className="relative w-full aspect-square rounded-md overflow-hidden border border-border/50 bg-muted">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt={`fuse-${result.id}`}
                    className={cn(
                      "w-full h-full object-cover",
                      !isFinal && "opacity-50"
                    )}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                {result.status === "processing" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}

                {result.status === "rejected" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 p-2 text-center">
                    <p className="text-xs text-destructive-foreground">{result.error || t("fuseFailed")}</p>
                  </div>
                )}
              </div>

              {result.status === "pending" && (
                <Button size="sm" className="w-full h-8 text-xs" onClick={() => onRun(result.id)}>
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  {t("fuse")}
                </Button>
              )}

              {result.status === "rejected" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => onRerun(result.id)}
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" />
                  {t("refuse")}
                </Button>
              )}

              {result.status === "fulfilled" && (
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-1"
                    onClick={() => onRerun(result.id)}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {t("refuse")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-1"
                    onClick={() => onSave(result)}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {t("save")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-1"
                    onClick={() => onDownload(result)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {t("download")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
