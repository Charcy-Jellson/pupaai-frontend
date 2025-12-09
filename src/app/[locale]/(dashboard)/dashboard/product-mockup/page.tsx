"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt,
  Sparkles,
  Wand2,
  Check,
  ArrowLeft,
  Palette,
  Image as ImageIcon,
  FolderOpen,
  Home,
  ChevronRight,
  Plus,
  Folder,
  Save,
} from "lucide-react";
import { useMockupEditor } from "@/hooks/use-mockup-editor";
import {
  ImagePicker,
  LogoCanvas,
  ColorSelector,
  ResultsGallery,
} from "@/components/product-mockup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  getAllUserFolders,
  createFolder,
  saveFileFromDataUrl,
  type FolderRecord,
} from "@/lib/supabase";
import { LoadingSpinner } from "@/components/common/loading-spinner";

export default function ProductMockupPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();
  const t = useTranslations("productMockup");
  const tc = useTranslations("common");

  const {
    state,
    // Phase 1: Compose
    setProductImage,
    clearProductImage,
    setLogoImage,
    clearLogoImage,
    updateLogoPosition,
    resetLogoPosition,
    generateFirstMockup,
    // Phase transition
    confirmMockup,
    goBackToCompose,
    // Phase 2: Recolor
    setSelectedColors,
    generateColorVariants,
    retryMockup,
    // Downloads
    downloadMockup,
    downloadAllMockups,
    downloadConfirmedMockup,
    // Utils
    clearError,
  } = useMockupEditor();

  // Save dialog state for confirmed mockup
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderRecord[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Close dialogs when route changes to prevent Radix Portal overlay from getting stuck
  useEffect(() => {
    setSaveDialogOpen(false);
    setShowNewFolder(false);
  }, [pathname]);

  // Check if ready for Phase 1 (generate first mockup)
  const canGenerateFirst =
    state.productImage && state.logoImage && !state.isProcessing;

  // Check if ready for Phase 2 (generate color variants)
  const canGenerateColors =
    state.confirmedMockup &&
    state.selectedColors.length > 0 &&
    !state.isProcessing;

  // Load folders when dialog opens
  const loadFolders = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFolders(true);
    const userFolders = await getAllUserFolders(user.id);
    const currentFolders = userFolders.filter(
      (f) => f.parent_id === currentFolderId
    );
    setFolders(currentFolders);
    setLoadingFolders(false);
  }, [user?.id, currentFolderId]);

  // Open save dialog
  const handleOpenSaveDialog = useCallback(() => {
    setCurrentFolderId(null);
    setFolderPath([]);
    setSaveDialogOpen(true);
    loadFolders();
  }, [loadFolders]);

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

  // Reload folders when folder ID changes
  const handleFolderNavigation = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
    },
    []
  );

  // Watch folder ID changes
  useState(() => {
    if (saveDialogOpen && user?.id) {
      loadFolders();
    }
  });

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
        title: "Folder Created",
        description: `"${folder.name}" has been created.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create folder.",
        variant: "destructive",
      });
    }
    setIsCreatingFolder(false);
  };

  // Save confirmed mockup to selected folder
  const handleSaveToFolder = async () => {
    if (!user?.id || !state.confirmedMockup) return;

    setIsSaving(true);
    try {
      const fileName = `mockup-base-${Date.now()}.png`;
      const saved = await saveFileFromDataUrl(
        user.id,
        state.confirmedMockup,
        fileName,
        currentFolderId
      );

      if (saved) {
        toast({
          title: "Saved!",
          description: "Base mockup saved to gallery.",
        });
        setSaveDialogOpen(false);
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      toast({
        title: "Save Failed",
        description: "Could not save mockup to gallery.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Phase Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            state.phase === "compose"
              ? "bg-violet-500/20 border border-violet-500/50 text-violet-300"
              : "bg-green-500/20 border border-green-500/50 text-green-300"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              state.phase === "compose" ? "bg-violet-500" : "bg-green-500"
            }`}
          >
            {state.phase === "recolor" ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <span className="text-xs font-bold text-white">1</span>
            )}
          </div>
          <span className="text-sm font-medium">{t("logoPlacement")}</span>
        </div>

        <div className="h-0.5 w-8 bg-border/50" />

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            state.phase === "recolor"
              ? "bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300"
              : "bg-muted/50 border border-border/50 text-muted-foreground"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              state.phase === "recolor" ? "bg-fuchsia-500" : "bg-muted"
            }`}
          >
            <span className="text-xs font-bold text-white">2</span>
          </div>
          <span className="text-sm font-medium">{t("colorVariants")}</span>
        </div>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert
              variant="destructive"
              className="bg-red-500/10 border-red-500/30"
            >
              <AlertDescription className="flex items-center justify-between">
                <span>{state.error}</span>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  {t("dismiss")}
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== PHASE 1: COMPOSE ========== */}
      <AnimatePresence mode="wait">
        {state.phase === "compose" && (
          <motion.div
            key="compose-phase"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Info Alert */}
            <Alert className="bg-violet-500/10 border-violet-500/30 mb-6">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong className="text-violet-300">{t("step1")}:</strong> {t("step1Description")}
              </AlertDescription>
            </Alert>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Product & Logo Selection */}
              <div className="lg:col-span-3 space-y-4">
                <ImagePicker
                  title={t("productImage")}
                  icon={<Shirt className="w-4 h-4 text-violet-400" />}
                  selectedImage={state.productImage}
                  selectedMimeType={state.productMimeType}
                  onImageSelect={setProductImage}
                  onClear={clearProductImage}
                  disabled={state.isProcessing}
                  allowSaveToGallery={true}
                />

                <ImagePicker
                  title={t("logo")}
                  icon={<Sparkles className="w-4 h-4 text-fuchsia-400" />}
                  selectedImage={state.logoImage}
                  selectedMimeType={state.logoMimeType}
                  onImageSelect={setLogoImage}
                  onClear={clearLogoImage}
                  disabled={state.isProcessing}
                  allowSaveToGallery={true}
                />
              </div>

              {/* Center - Canvas & Logo Positioning */}
              <div className="lg:col-span-5">
                <LogoCanvas
                  productImage={state.productImage}
                  logoImage={state.logoImage}
                  logoPosition={state.logoPosition}
                  selectedTemplate={null}
                  onPositionChange={updateLogoPosition}
                  onResetPosition={resetLogoPosition}
                  onUploadLogo={setLogoImage}
                  generatedMockup={state.firstMockup}
                  isProcessing={state.isProcessing}
                />
              </div>

              {/* Right Column - Generate & Preview */}
              <div className="lg:col-span-4 space-y-4">
                {/* Generate First Mockup */}
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-violet-400" />
                      {t("generatePreview")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                      size="lg"
                      disabled={!canGenerateFirst}
                      onClick={() => generateFirstMockup()}
                    >
                      {state.isProcessing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full"
                          />
                          {t("generatingPreview")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t("generatePreview")}
                        </>
                      )}
                    </Button>

                    {/* Status indicators */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            state.productImage ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                        {t("productImage")} {state.productImage ? "✓" : t("required")}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            state.logoImage ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                        {t("logo")} {state.logoImage ? "✓" : t("required")}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Confirm Mockup (show when first mockup is generated) */}
                <AnimatePresence>
                  {state.firstMockup && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                    >
                      <Card className="bg-green-500/10 border-green-500/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-green-300">
                            <Check className="w-4 h-4" />
                            {t("previewReady")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {t("previewReadyDescription")}
                          </p>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            size="lg"
                            onClick={confirmMockup}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {t("confirmAndSelectColors")}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            {t("adjustAndRegenerate")}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tips Section */}
            {!state.firstMockup && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <TipCard
                  number="1"
                  title={t("tip1Title")}
                  description={t("tip1Description")}
                />
                <TipCard
                  number="2"
                  title={t("tip2Title")}
                  description={t("tip2Description")}
                />
                <TipCard
                  number="3"
                  title={t("tip3Title")}
                  description={t("tip3Description")}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ========== PHASE 2: RECOLOR ========== */}
        {state.phase === "recolor" && (
          <motion.div
            key="recolor-phase"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-4 text-muted-foreground hover:text-white"
              onClick={goBackToCompose}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("backToLogoPlacement")}
            </Button>

            {/* Info Alert */}
            <Alert className="bg-fuchsia-500/10 border-fuchsia-500/30 mb-6">
              <Palette className="h-4 w-4 text-fuchsia-400" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong className="text-fuchsia-300">{t("step2")}:</strong> {t("step2Description")}
              </AlertDescription>
            </Alert>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Confirmed Mockup Preview */}
              <div className="lg:col-span-4">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-green-400" />
                      {t("confirmedMockup")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {state.confirmedMockup && (
                      <div className="relative rounded-lg overflow-hidden bg-muted/30 border border-border/50">
                        <img
                          src={state.confirmedMockup}
                          alt="Confirmed mockup"
                          className="w-full h-auto object-contain"
                        />
                        <div className="absolute top-2 right-2 bg-green-500/90 px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t("confirmed")}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={downloadConfirmedMockup}
                      >
                        {tc("download")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleOpenSaveDialog}
                      >
                        {t("saveToGallery")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Center - Color Selector */}
              <div className="lg:col-span-4">
                <ColorSelector
                  selectedColors={state.selectedColors}
                  onColorsChange={setSelectedColors}
                  disabled={state.isProcessing}
                />
              </div>

              {/* Right Column - Generate Colors */}
              <div className="lg:col-span-4">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="w-4 h-4 text-fuchsia-400" />
                      {t("generateColorVariants")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-fuchsia-500/25"
                      size="lg"
                      disabled={!canGenerateColors}
                      onClick={() => generateColorVariants()}
                    >
                      {state.isProcessing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full"
                          />
                          {t("generatingVariants", { count: state.processingCount })}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t("generateVariants", { count: state.selectedColors.length })}
                        </>
                      )}
                    </Button>

                    {/* Status indicators */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {t("baseMockupConfirmed")} ✓
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            state.selectedColors.length > 0
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }`}
                        />
                        {t("colorsSelected", { count: state.selectedColors.length })}
                      </div>
                    </div>

                    {state.selectedColors.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {state.selectedColors.map((color) => (
                          <div
                            key={color.hex}
                            className="w-6 h-6 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Results Gallery */}
            <div className="mt-6">
              <ResultsGallery
                results={state.results}
                processingCount={state.processingCount}
                onDownload={downloadMockup}
                onSave={() => {}}
                onRetry={retryMockup}
                onDownloadAll={downloadAllMockups}
                onSaveAll={() => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save to Folder Dialog for Confirmed Mockup */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-violet-400" />
              {t("saveBaseMockup")}
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
                      handleFolderNavigation(folder.id);
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
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300">
                        <Home className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {t("rootGallery")}
                        </span>
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
    </div>
  );
}

function TipCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card/30 border border-border/50 hover:border-violet-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-violet-400">{number}</span>
        </div>
        <div>
          <h3 className="font-medium text-white mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
