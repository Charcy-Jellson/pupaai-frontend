"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import {
  Download,
  Save,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Maximize2,
  Folder,
  FolderOpen,
  Home,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { MockupResult } from "@/types/mockup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getAllUserFolders,
  createFolder,
  saveFileFromDataUrl,
  type FolderRecord,
} from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
  onRetry,
  onDownloadAll,
}: ResultsGalleryProps) {
  const t = useTranslations("productMockup.results");
  const tc = useTranslations("common");
  const { user } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();

  const [previewResult, setPreviewResult] = useState<MockupResult | null>(null);

  // Folder selection dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [resultToSave, setResultToSave] = useState<MockupResult | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderRecord[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New folder creation
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Close dialogs when route changes to prevent Radix Portal overlay from getting stuck
  useEffect(() => {
    setPreviewResult(null);
    setSaveDialogOpen(false);
    setResultToSave(null);
    setSavingAll(false);
    setShowNewFolder(false);
  }, [pathname]);

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;
  const pendingCount = results.filter(
    (r) => r.status === "pending" || r.status === "processing"
  ).length;

  // Load folders when dialog opens
  useEffect(() => {
    if (saveDialogOpen && user?.id) {
      loadFolders();
    }
  }, [saveDialogOpen, user?.id, currentFolderId]);

  const loadFolders = async () => {
    if (!user?.id) return;
    setLoadingFolders(true);
    const userFolders = await getAllUserFolders(user.id);
    const currentFolders = userFolders.filter(
      (f) => f.parent_id === currentFolderId
    );
    setFolders(currentFolders);
    setLoadingFolders(false);
  };

  // Open save dialog for single result
  const handleOpenSaveDialog = useCallback((result: MockupResult) => {
    setResultToSave(result);
    setSavingAll(false);
    setCurrentFolderId(null);
    setFolderPath([]);
    setSaveDialogOpen(true);
  }, []);

  // Open save dialog for all results
  const handleOpenSaveAllDialog = useCallback(() => {
    setResultToSave(null);
    setSavingAll(true);
    setCurrentFolderId(null);
    setFolderPath([]);
    setSaveDialogOpen(true);
  }, []);

  // Navigate to folder
  const navigateToFolder = (folder: FolderRecord) => {
    setFolderPath((prev) => [...prev, folder]);
    setCurrentFolderId(folder.id);
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(
      newPath.length > 0 ? newPath[newPath.length - 1].id : null
    );
  };

  const navigateToRoot = () => {
    setFolderPath([]);
    setCurrentFolderId(null);
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!user?.id || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    const folder = await createFolder(
      user.id,
      newFolderName.trim(),
      currentFolderId
    );

    if (folder) {
      setFolders((prev) => [...prev, folder]);
      setNewFolderName("");
      setShowNewFolder(false);
      toast({
        title: t("folderCreated"),
        description: t("folderCreatedDesc", { name: folder.name }),
      });
    } else {
      toast({
        title: tc("error"),
        description: t("failedToCreateFolder"),
        variant: "destructive",
      });
    }
    setIsCreatingFolder(false);
  };

  // Save to selected folder
  const handleSaveToFolder = async () => {
    if (!user?.id) return;

    setIsSaving(true);

    if (savingAll) {
      // Save all successful results
      const successfulResults = results.filter(
        (r) => r.status === "fulfilled" && r.imageDataUrl
      );

      let savedCount = 0;
      for (const result of successfulResults) {
        try {
          const fileName = `mockup-${result.colorName
            .toLowerCase()
            .replace(/\s+/g, "-")}.png`;
          const saved = await saveFileFromDataUrl(
            user.id,
            result.imageDataUrl!,
            fileName,
            currentFolderId
          );
          if (saved) savedCount++;
        } catch {
          // Continue with others
        }
      }

      toast({
        title: t("saved"),
        description: t("savedCount", { saved: savedCount, total: successfulResults.length }),
      });
    } else if (resultToSave?.imageDataUrl) {
      // Save single result
      try {
        const fileName = `mockup-${resultToSave.colorName
          .toLowerCase()
          .replace(/\s+/g, "-")}.png`;
        const saved = await saveFileFromDataUrl(
          user.id,
          resultToSave.imageDataUrl,
          fileName,
          currentFolderId
        );

        if (saved) {
          toast({
            title: t("saved"),
            description: t("savedSingle", { name: resultToSave.colorName }),
          });
        } else {
          throw new Error("Failed to save");
        }
      } catch {
        toast({
          title: t("saveFailed"),
          description: t("saveFailedDesc"),
          variant: "destructive",
        });
      }
    }

    setIsSaving(false);
    setSaveDialogOpen(false);
    setResultToSave(null);
  };

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
              {t("title")}
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
                  {t("all")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSaveAllDialog}
                  className="h-7 px-2 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {t("saveAll")}
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
                  {t("generatingCount", { count: processingCount })}
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
                    onSave={() => handleOpenSaveDialog(result)}
                    onRetry={() => onRetry(result.color)}
                    onPreview={() => setPreviewResult(result)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Summary */}
          {results.length > 0 &&
            pendingCount === 0 &&
            processingCount === 0 && (
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {successCount > 0 && (
                    <span className="text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {t("successful", { count: successCount })}
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-400 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {t("failed", { count: errorCount })}
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
              {previewResult?.colorName} {t("mockupLabel")}
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
              {tc("download")}
            </Button>
            <Button
              onClick={() => {
                if (previewResult) {
                  setPreviewResult(null);
                  handleOpenSaveDialog(previewResult);
                }
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {t("saveToGallery")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save to Folder Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-violet-400" />
              {savingAll
                ? t("saveAllTitle", { count: successCount })
                : t("saveSingleTitle", { name: resultToSave?.colorName ?? "" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToRoot}
                className="h-7 px-2"
              >
                <Home className="w-3.5 h-3.5" />
              </Button>

              {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPath = folderPath.slice(0, index + 1);
                      setFolderPath(newPath);
                      setCurrentFolderId(folder.id);
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}

              <div className="flex-1" />

              {!showNewFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewFolder(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t("newFolder")}
                </Button>
              )}
            </div>

            {/* New folder input */}
            {showNewFolder && (
              <div className="flex gap-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={t("folderName")}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") {
                      setShowNewFolder(false);
                      setNewFolderName("");
                    }
                  }}
                  autoFocus
                  disabled={isCreatingFolder}
                />
                <Button
                  size="sm"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                >
                  {isCreatingFolder ? "..." : tc("create")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                >
                  {tc("cancel")}
                </Button>
              </div>
            )}

            {/* Folder list */}
            <div className="border rounded-lg bg-muted/30">
              {loadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-1">
                    {/* Root folder option */}
                    {currentFolderId === null && (
                      <div
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer",
                          "bg-violet-500/10 border border-violet-500/30 text-violet-300"
                        )}
                      >
                        <Home className="w-4 h-4" />
                        <span className="text-sm font-medium">{t("rootGallery")}</span>
                        <Check className="w-4 h-4 ml-auto" />
                      </div>
                    )}

                    {/* Back option when in subfolder */}
                    {currentFolderId !== null && (
                      <div
                        onClick={navigateBack}
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
                      >
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">..</span>
                      </div>
                    )}

                    {/* Subfolders */}
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => navigateToFolder(folder)}
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
                      >
                        <Folder className="w-4 h-4 text-violet-400" />
                        <span className="text-sm">{folder.name}</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                      </div>
                    ))}

                    {folders.length === 0 && currentFolderId !== null && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {t("noSubfolders")}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {t("saveTo")}:{" "}
              <span className="text-violet-300">
                {folderPath.length > 0
                  ? folderPath.map((f) => f.name).join(" / ")
                  : t("rootGallery")}
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleSaveToFolder} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t("saveHere")}
                </>
              )}
            </Button>
          </DialogFooter>
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

function ResultCard({
  result,
  onDownload,
  onSave,
  onRetry,
  onPreview,
}: ResultCardProps) {
  const t = useTranslations("productMockup.results");

  const isProcessing =
    result.status === "pending" || result.status === "processing";
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
      <div className="h-1.5" style={{ backgroundColor: result.color }} />

      {/* Image/Status Area */}
      <div className="aspect-square bg-muted/30 relative">
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <LoadingSpinner size="md" />
            <span className="text-xs text-muted-foreground">{t("generating")}</span>
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
              {result.error || t("failedLabel")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {t("retry")}
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
            <span className="text-xs font-medium truncate">
              {result.colorName}
            </span>
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
