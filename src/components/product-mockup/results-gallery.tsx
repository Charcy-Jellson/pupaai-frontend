"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import {
  Download,
  Save,
  ImageIcon,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Maximize2,
} from "lucide-react";
import type { MockupResult } from "@/types/mockup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResultsGalleryProps {
  results: MockupResult[];
  processingCount: number;
  onDownload: (result: MockupResult) => void;
  onSave: (result: MockupResult) => void;
  onRetry: (colorHex: string) => void;
  onDownloadAll: () => void;
  onSaveAll: () => void;
}

export function ResultsGallery({
  results,
  processingCount,
  onDownload,
  onSave,
  onRetry,
  onDownloadAll,
  onSaveAll,
}: ResultsGalleryProps) {
  const [previewResult, setPreviewResult] = useState<MockupResult | null>(null);

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;
  const pendingCount = results.filter((r) => r.status === "pending" || r.status === "processing").length;

  if (results.length === 0 && processingCount === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Generated Mockups
              {results.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {successCount}/{results.length}
                </Badge>
              )}
            </CardTitle>
            {successCount > 1 && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadAll}
                  className="h-7 px-2 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveAll}
                  className="h-7 px-2 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Processing Status */}
          {processingCount > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-violet-300">
                  Generating {processingCount} mockup{processingCount > 1 ? "s" : ""}...
                </span>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <ScrollArea className={cn(results.length > 4 ? "h-[400px]" : "")}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-2">
              <AnimatePresence mode="popLayout">
                {results.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    onDownload={() => onDownload(result)}
                    onSave={() => onSave(result)}
                    onRetry={() => onRetry(result.color)}
                    onPreview={() => setPreviewResult(result)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Summary */}
          {results.length > 0 && pendingCount === 0 && processingCount === 0 && (
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {successCount > 0 && (
                  <span className="text-green-400 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {successCount} successful
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-400 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {errorCount} failed
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewResult} onOpenChange={() => setPreviewResult(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border border-border"
                style={{ backgroundColor: previewResult?.color }}
              />
              {previewResult?.colorName} Mockup
            </DialogTitle>
          </DialogHeader>
          {previewResult?.imageDataUrl && (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/30">
              <img
                src={previewResult.imageDataUrl}
                alt={previewResult.colorName}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => previewResult && onDownload(previewResult)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => previewResult && onSave(previewResult)}>
              <Save className="w-4 h-4 mr-2" />
              Save to Gallery
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Individual result card
interface ResultCardProps {
  result: MockupResult;
  onDownload: () => void;
  onSave: () => void;
  onRetry: () => void;
  onPreview: () => void;
}

function ResultCard({ result, onDownload, onSave, onRetry, onPreview }: ResultCardProps) {
  const isProcessing = result.status === "pending" || result.status === "processing";
  const isSuccess = result.status === "fulfilled";
  const isError = result.status === "rejected";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group relative rounded-lg overflow-hidden border",
        isError ? "border-red-500/50" : "border-border/50",
        isSuccess && "hover:border-violet-500/50"
      )}
    >
      {/* Color indicator */}
      <div
        className="h-1.5"
        style={{ backgroundColor: result.color }}
      />

      {/* Image/Status Area */}
      <div className="aspect-square bg-muted/30 relative">
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <LoadingSpinner size="md" />
            <span className="text-xs text-muted-foreground">Generating...</span>
          </div>
        )}

        {isSuccess && result.imageDataUrl && (
          <>
            <img
              src={result.imageDataUrl}
              alt={result.colorName}
              className="w-full h-full object-contain cursor-pointer"
              onClick={onPreview}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="w-8 h-8"
                onClick={onPreview}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <X className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-400 text-center line-clamp-2">
              {result.error || "Failed"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-3 h-3 rounded-full border border-border/50 flex-shrink-0"
              style={{ backgroundColor: result.color }}
            />
            <span className="text-xs font-medium truncate">{result.colorName}</span>
          </div>

          {isSuccess && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={onDownload}
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={onSave}
              >
                <Save className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

