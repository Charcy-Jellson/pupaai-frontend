"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Check, ImageIcon } from "lucide-react";
import { PresetImage } from "@/types/nail-studio";
import { cn } from "@/lib/utils";

interface PresetSelectorProps {
  presets: PresetImage[];
  selectedImage: string | null;
  selectedPresetId: string | null;
  onPresetSelect: (imageDataUrl: string, mimeType: string, name: string, presetId: string) => void;
  onUpload: (imageDataUrl: string, mimeType: string, name: string) => void;
  onClear: () => void;
  title: string;
  icon: React.ReactNode;
  uploadLabel: string;
  emptyLabel: string;
  disabled?: boolean;
}

export function PresetSelector({
  presets,
  selectedImage,
  selectedPresetId,
  onPresetSelect,
  onUpload,
  onClear,
  title,
  icon,
  uploadLabel,
  emptyLabel,
  disabled = false,
}: PresetSelectorProps) {
  const tc = useTranslations("common");
  const [isDragging, setIsDragging] = useState(false);

  const handlePresetClick = useCallback(
    async (preset: PresetImage) => {
      if (disabled) return;

      try {
        const response = await fetch(preset.src);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const mimeType = blob.type || "image/jpeg";
          onPresetSelect(reader.result as string, mimeType, preset.name, preset.id);
        };
        reader.readAsDataURL(blob);
      } catch {
        console.error("Failed to load preset image:", preset.src);
      }
    },
    [onPresetSelect, disabled]
  );

  const processUploadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(
          reader.result as string,
          file.type,
          file.name.replace(/\.[^/.]+$/, "")
        );
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleUploadChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processUploadFile(file);
      e.target.value = "";
    },
    [processUploadFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const file = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith("image/")
      );
      if (file) processUploadFile(file);
    },
    [disabled, processUploadFile]
  );

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold">
            {icon}
            {title}
          </div>
          {selectedImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled}
            >
              {tc("clear")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection Preview */}
        {selectedImage && (
          <div className="relative aspect-video rounded-lg overflow-hidden border border-pink-400/30 bg-muted/20">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <div className="bg-pink-500/90 text-white rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
            </div>
          </div>
        )}

        {/* Upload Custom (click or drag) */}
        <label
          className={cn(
            "flex items-center justify-center gap-2 w-full h-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-sm",
            isDragging
              ? "border-pink-400 bg-pink-400/10 text-pink-400"
              : "bg-muted/20 hover:bg-muted/40 text-muted-foreground",
            disabled && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-4 h-4" />
          {isDragging ? tc("dropHere") : uploadLabel}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleUploadChange}
            disabled={disabled}
          />
        </label>

        {/* Preset Grid */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">{emptyLabel}</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border-2",
                    isSelected
                      ? "border-pink-400 ring-1 ring-pink-400/50"
                      : "border-transparent hover:border-pink-300",
                    disabled && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => handlePresetClick(preset)}
                >
                  <img
                    src={preset.thumbnail}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.classList.add(
                        "bg-muted/50"
                      );
                    }}
                  />
                  {/* Fallback for missing images */}
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30 pointer-events-none">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                      <div className="bg-pink-500/90 text-white rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                    <p className="text-[10px] text-white truncate text-center">
                      {preset.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
