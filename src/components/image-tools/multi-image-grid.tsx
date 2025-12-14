"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  Check, 
  X, 
  Undo2, 
  Trash2, 
  MoreVertical, 
  Loader2,
  CheckSquare,
  Square,
  Crop,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import type { MultiImageItem } from "@/types";

interface MultiImageGridProps {
  images: MultiImageItem[];
  activeImageId: string | null;
  onToggleSelection: (imageId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSetActiveImage: (imageId: string | null) => void;
  onUndoImage: (imageId: string) => void;
  onResetImage: (imageId: string) => void;
  onRemoveImage: (imageId: string) => void;
}

export function MultiImageGrid({
  images,
  activeImageId,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onSetActiveImage,
  onUndoImage,
  onResetImage,
  onRemoveImage,
}: MultiImageGridProps) {
  const t = useTranslations("imageTools");
  const tc = useTranslations("common");
  
  const selectedCount = images.filter((img) => img.isSelected).length;
  const allSelected = selectedCount === images.length && images.length > 0;

  const handleImageClick = useCallback((imageId: string, event: React.MouseEvent) => {
    // If clicking on the crop button area, don't toggle selection
    if ((event.target as HTMLElement).closest('[data-crop-btn]')) {
      return;
    }
    onToggleSelection(imageId);
  }, [onToggleSelection]);

  const handleCropClick = useCallback((imageId: string) => {
    // Set as active image for cropping
    onSetActiveImage(imageId);
  }, [onSetActiveImage]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with selection controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">
            {t("multiImage.images")} ({images.length})
          </h3>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {t("multiImage.selected", { count: selectedCount })}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs"
          >
            {allSelected ? (
              <>
                <Square className="w-3.5 h-3.5 mr-1.5" />
                {t("multiImage.deselectAll")}
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                {t("multiImage.selectAll")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {images.map((image) => (
            <motion.div
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all group",
                  "hover:ring-2 hover:ring-violet-500/50",
                  image.isSelected && "ring-2 ring-violet-500",
                  image.error && "ring-2 ring-destructive",
                  activeImageId === image.id && "ring-2 ring-amber-500"
                )}
                onClick={(e) => handleImageClick(image.id, e)}
              >
                {/* Thumbnail */}
                <div className="aspect-square relative bg-muted/30">
                  <img
                    src={image.currentImage}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Processing Overlay */}
                  {image.isProcessing && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    </div>
                  )}

                  {/* Error Overlay */}
                  {image.error && !image.isProcessing && (
                    <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                  )}
                  
                  {/* Selection Checkbox */}
                  <div className={cn(
                    "absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                    image.isSelected 
                      ? "bg-violet-500 text-white" 
                      : "bg-background/80 text-muted-foreground group-hover:bg-background"
                  )}>
                    {image.isSelected ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />
                    )}
                  </div>

                  {/* Operations Count Badge */}
                  {image.operations.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5"
                    >
                      {image.operations.length}
                    </Badge>
                  )}

                  {/* Active for Crop Indicator */}
                  {activeImageId === image.id && (
                    <Badge 
                      className="absolute bottom-2 left-2 text-[10px] bg-amber-500 hover:bg-amber-500"
                    >
                      <Crop className="w-3 h-3 mr-1" />
                      Crop
                    </Badge>
                  )}

                  {/* Hover Actions */}
                  <div className={cn(
                    "absolute bottom-2 right-2 flex items-center gap-1 transition-opacity",
                    "opacity-0 group-hover:opacity-100"
                  )}>
                    {/* Crop Button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCropClick(image.id);
                      }}
                      data-crop-btn
                      title={t("tools.crop")}
                    >
                      <Crop className="w-3.5 h-3.5" />
                    </Button>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="w-7 h-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onUndoImage(image.id);
                          }}
                          disabled={image.operations.length === 0}
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          {t("undo")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetImage(image.id);
                          }}
                          disabled={image.operations.length === 0}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {tc("reset")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImage(image.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {tc("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* File Name */}
                <div className="p-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground truncate" title={image.fileName}>
                    {image.fileName}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/20"
        >
          <p className="text-sm text-violet-300">
            {t("multiImage.selectedSummary", { count: selectedCount })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            className="text-violet-300 hover:text-violet-100"
          >
            <X className="w-4 h-4 mr-1" />
            {t("multiImage.clearSelection")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
