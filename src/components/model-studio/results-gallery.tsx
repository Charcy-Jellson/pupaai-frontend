"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Save,
  RotateCcw,
  Loader2,
  ImageIcon,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { ModelStudioResult, POSE_OPTIONS } from "@/types/model-studio";
import { SelectFolderDialog } from "@/components/common/select-folder-dialog";
import { saveFileFromDataUrl } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ModelStudioResultsProps {
  results: ModelStudioResult[];
  processingCount: number;
  onDownload: (result: ModelStudioResult) => void;
  onRetry: (resultId: string) => void;
  onDownloadAll: () => void;
}

export function ModelStudioResults({
  results,
  processingCount,
  onDownload,
  onRetry,
  onDownloadAll,
}: ModelStudioResultsProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [previewResult, setPreviewResult] = useState<ModelStudioResult | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [fileToSave, setFileToSave] = useState<ModelStudioResult | null>(null);
  const [saveAllMode, setSaveAllMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Close dialogs when route changes to prevent Radix Portal overlay from getting stuck
  useEffect(() => {
    setPreviewResult(null);
    setSaveDialogOpen(false);
    setFileToSave(null);
    setSaveAllMode(false);
  }, [pathname]);

  const successfulResults = results.filter(
    (r) => r.status === "fulfilled" && r.imageDataUrl
  );
  const failedResults = results.filter((r) => r.status === "rejected");
  const pendingResults = results.filter(
    (r) => r.status === "pending" || r.status === "processing"
  );

  const handleSave = useCallback(
    async (folderId: string | null) => {
      if (!user?.id || !fileToSave?.imageDataUrl) return;

      setIsSaving(true);
      try {
        const poseName = POSE_OPTIONS.find((p) => p.id === fileToSave.pose)?.name || fileToSave.pose;
        const fileName = `model-${fileToSave.clothingName}-${poseName}-${Date.now()}.png`;
        const saved = await saveFileFromDataUrl(
          user.id,
          fileToSave.imageDataUrl,
          fileName,
          folderId
        );

        if (saved) {
          toast({
            title: "Saved!",
            description: `"${fileName}" saved to gallery`,
          });
        } else {
          throw new Error("Failed to save");
        }
      } catch {
        toast({
          title: "Save Failed",
          description: "Could not save image to gallery",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
        setSaveDialogOpen(false);
        setFileToSave(null);
      }
    },
    [user?.id, fileToSave, toast]
  );

  const handleSaveAll = useCallback(
    async (folderId: string | null) => {
      if (!user?.id) return;

      setIsSaving(true);
      let savedCount = 0;

      for (const result of successfulResults) {
        if (!result.imageDataUrl) continue;
        try {
          const poseName = POSE_OPTIONS.find((p) => p.id === result.pose)?.name || result.pose;
          const fileName = `model-${result.clothingName}-${poseName}-${Date.now()}.png`;
          const saved = await saveFileFromDataUrl(
            user.id,
            result.imageDataUrl,
            fileName,
            folderId
          );
          if (saved) savedCount++;
        } catch {
          console.error("Failed to save:", result.id);
        }
      }

      toast({
        title: "Batch Save Complete",
        description: `${savedCount}/${successfulResults.length} images saved`,
      });

      setIsSaving(false);
      setSaveDialogOpen(false);
      setSaveAllMode(false);
    },
    [user?.id, successfulResults, toast]
  );

  if (results.length === 0 && processingCount === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-400" />
              Results
              {processingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {processingCount} processing
                </Badge>
              )}
            </CardTitle>
            {successfulResults.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSaveAllMode(true);
                    setSaveDialogOpen(true);
                  }}
                  disabled={isSaving}
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save All
                </Button>
                <Button variant="outline" size="sm" onClick={onDownloadAll}>
                  <Download className="w-3 h-3 mr-1" />
                  Download All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          {results.length > 0 && (
            <div className="flex gap-4 mb-4 text-sm">
              {successfulResults.length > 0 && (
                <div className="flex items-center gap-1 text-green-400">
                  <Check className="w-4 h-4" />
                  {successfulResults.length} completed
                </div>
              )}
              {failedResults.length > 0 && (
                <div className="flex items-center gap-1 text-red-400">
                  <X className="w-4 h-4" />
                  {failedResults.length} failed
                </div>
              )}
              {pendingResults.length > 0 && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {pendingResults.length} in progress
                </div>
              )}
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                className={cn(
                  "relative aspect-[3/4] rounded-lg overflow-hidden border border-border/50",
                  result.status === "processing" && "animate-pulse"
                )}
              >
                {/* Image or Placeholder */}
                {result.imageDataUrl ? (
                  <img
                    src={result.imageDataUrl}
                    alt={`${result.clothingName} - ${result.pose}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewResult(result)}
                  />
                ) : result.status === "rejected" ? (
                  <div className="w-full h-full bg-red-500/10 flex flex-col items-center justify-center p-4">
                    <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                    <p className="text-xs text-red-400 text-center">
                      {result.error || "Failed"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => onRetry(result.id)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Info Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white font-medium truncate">
                    {result.clothingName}
                  </p>
                  <p className="text-xs text-white/70">
                    {POSE_OPTIONS.find((p) => p.id === result.pose)?.name}
                  </p>
                </div>

                {/* Status Badge */}
                {result.status === "fulfilled" && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500/90 text-white text-xs">
                      <Check className="w-3 h-3" />
                    </Badge>
                  </div>
                )}

                {/* Actions Overlay */}
                {result.status === "fulfilled" && result.imageDataUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDownload(result)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFileToSave(result);
                        setSaveAllMode(false);
                        setSaveDialogOpen(true);
                      }}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewResult}
        onOpenChange={(open) => !open && setPreviewResult(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {previewResult?.clothingName} -{" "}
              {POSE_OPTIONS.find((p) => p.id === previewResult?.pose)?.name}
            </DialogTitle>
          </DialogHeader>
          {previewResult?.imageDataUrl && (
            <div className="relative">
              <img
                src={previewResult.imageDataUrl}
                alt="Preview"
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => onDownload(previewResult)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFileToSave(previewResult);
                    setSaveAllMode(false);
                    setSaveDialogOpen(true);
                    setPreviewResult(null);
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save to Gallery
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Save Folder Dialog */}
      {user?.id && (
        <SelectFolderDialog
          userId={user.id}
          open={saveDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSaveDialogOpen(false);
              setFileToSave(null);
              setSaveAllMode(false);
            }
          }}
          onSelectFolder={saveAllMode ? handleSaveAll : handleSave}
        />
      )}
    </>
  );
}





