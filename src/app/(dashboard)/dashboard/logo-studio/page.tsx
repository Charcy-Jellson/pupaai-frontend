"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Save, Folder, Home, ChevronRight, ArrowLeft, Plus, X } from "lucide-react";
import { useLogoStudio } from "@/hooks/use-logo-studio";
import {
  LogoPromptInput,
  StyleSelector,
  ColorPalette,
  LogoPreview,
  LogoHistory,
} from "@/components/logo-studio";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export default function LogoStudioPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();

  const {
    state,
    setDescription,
    setSelectedStyle,
    toggleColor,
    setEditInstruction,
    clearError,
    handleGenerateLogo,
    handleEditLogo,
    loadFromHistory,
    removeFromHistory,
    clearHistory,
    downloadLogo,
  } = useLogoStudio();

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Close dialogs when route changes
  useEffect(() => {
    setSaveDialogOpen(false);
    setShowNewFolder(false);
  }, [pathname]);

  const isProcessing = state.isGenerating || state.isEditing;

  // Load folders for save dialog
  const loadFolders = async () => {
    if (!user?.id) return;
    const userFolders = await getAllUserFolders(user.id);
    const currentFolders = userFolders.filter((f) => f.parent_id === currentFolderId);
    setFolders(currentFolders);
  };

  // Open save dialog
  const openSaveDialog = async () => {
    setSaveDialogOpen(true);
    setCurrentFolderId(null);
    setFolderPath([]);
    await loadFolders();
  };

  // Navigate to folder
  const navigateToFolder = async (folder: FolderRecord) => {
    setFolderPath((prev) => [...prev, folder]);
    setCurrentFolderId(folder.id);
    if (!user?.id) return;
    const userFolders = await getAllUserFolders(user.id);
    const childFolders = userFolders.filter((f) => f.parent_id === folder.id);
    setFolders(childFolders);
  };

  const navigateBack = async () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    const newFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setCurrentFolderId(newFolderId);
    if (!user?.id) return;
    const userFolders = await getAllUserFolders(user.id);
    const currentFolders = userFolders.filter((f) => f.parent_id === newFolderId);
    setFolders(currentFolders);
  };

  const navigateToRoot = async () => {
    setFolderPath([]);
    setCurrentFolderId(null);
    await loadFolders();
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!user?.id || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    const folder = await createFolder(user.id, newFolderName.trim(), currentFolderId);

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

  // Save logo to gallery
  const handleSaveToGallery = async () => {
    if (!user?.id || !state.currentLogo) return;

    setIsSaving(true);
    try {
      const timestamp = Date.now();
      const filename = `logo-${timestamp}.png`;

      const saved = await saveFileFromDataUrl(
        user.id,
        state.currentLogo,
        filename,
        currentFolderId
      );

      if (saved) {
        toast({
          title: "Logo Saved",
          description: `Saved to ${folderPath.length > 0 ? folderPath.map((f) => f.name).join(" / ") : "Gallery"}`,
        });
        setSaveDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to save logo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving logo:", error);
      toast({
        title: "Error",
        description: "Failed to save logo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Logo Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate and customize professional logos with AI
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{state.error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Generation Options */}
          <div className="lg:col-span-4 space-y-4">
            <LogoPromptInput
              description={state.description}
              onDescriptionChange={setDescription}
              onGenerate={handleGenerateLogo}
              isGenerating={state.isGenerating}
              disabled={isProcessing}
            />

            <StyleSelector
              selectedStyle={state.selectedStyle}
              onStyleSelect={setSelectedStyle}
              disabled={isProcessing}
            />

            <ColorPalette
              selectedColors={state.selectedColors}
              onToggleColor={toggleColor}
              disabled={isProcessing}
            />
          </div>

          {/* Center - Logo Preview */}
          <div className="lg:col-span-5">
            <LogoPreview
              currentLogo={state.currentLogo}
              editInstruction={state.editInstruction}
              onEditInstructionChange={setEditInstruction}
              onEdit={handleEditLogo}
              onDownload={downloadLogo}
              onSave={state.currentLogo ? openSaveDialog : undefined}
              isEditing={state.isEditing}
              disabled={isProcessing}
            />
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-3">
            <LogoHistory
              history={state.history}
              onSelect={loadFromHistory}
              onRemove={removeFromHistory}
              onClear={clearHistory}
              disabled={isProcessing}
            />
          </div>
        </div>
      </motion.div>

      {/* Save to Gallery Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-amber-400" />
              Save Logo to Gallery
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
                      if (user?.id) {
                        getAllUserFolders(user.id).then((userFolders) => {
                          const childFolders = userFolders.filter(
                            (f) => f.parent_id === folder.id
                          );
                          setFolders(childFolders);
                        });
                      }
                    }}
                    className="h-7 px-2 text-sm"
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}

              <div className="flex-1" />

              {currentFolderId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateBack}
                  className="h-7 px-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </Button>
              )}
            </div>

            {/* New folder button */}
            {!showNewFolder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolder(true)}
                className="gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                New Folder
              </Button>
            )}

            {/* New folder input */}
            {showNewFolder && (
              <div className="flex gap-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
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
                  {isCreatingFolder ? "..." : "Create"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Folders list */}
            <ScrollArea className="h-48 border rounded-lg p-2">
              <div className="space-y-1">
                {folders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Folder className="w-8 h-8 mb-2" />
                    <p className="text-sm">
                      {currentFolderId ? "Empty folder" : "No folders"}
                    </p>
                    <p className="text-xs mt-1">
                      Will save to{" "}
                      {folderPath.length > 0
                        ? folderPath[folderPath.length - 1].name
                        : "root"}
                    </p>
                  </div>
                ) : (
                  folders.map((folder) => (
                    <motion.div
                      key={folder.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => navigateToFolder(folder)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        "border border-border/50 hover:border-amber-500/50",
                        "bg-muted/30 hover:bg-muted/50",
                        "transition-all cursor-pointer"
                      )}
                    >
                      <Folder className="w-5 h-5 text-amber-400" />
                      <span className="text-sm">{folder.name}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Current save location */}
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              <span className="font-medium">Save to: </span>
              {folderPath.length > 0
                ? folderPath.map((f) => f.name).join(" / ")
                : "Root folder"}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveToGallery}
              disabled={isSaving}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Here
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

