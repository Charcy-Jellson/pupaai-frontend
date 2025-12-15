"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Move,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  RefreshCw,
  Upload,
} from "lucide-react";
import type { LogoPosition, ProductTemplate } from "@/types/mockup";

interface LogoCanvasProps {
  productImage: string | null;
  logoImage: string | null;
  logoPosition: LogoPosition;
  selectedTemplate: ProductTemplate | null;
  onPositionChange: (updates: Partial<LogoPosition>) => void;
  onResetPosition: () => void;
  onUploadLogo: (imageDataUrl: string, mimeType: string) => void;
  generatedMockup: string | null;
  isProcessing: boolean;
}

export function LogoCanvas({
  productImage,
  logoImage,
  logoPosition,
  selectedTemplate,
  onPositionChange,
  onResetPosition,
  onUploadLogo,
  generatedMockup,
  isProcessing,
}: LogoCanvasProps) {
  const t = useTranslations("productMockup.canvas");
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle file upload for logo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onUploadLogo(result, file.type);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onUploadLogo]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!logoImage || isProcessing) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({ x: clientX, y: clientY });
  }, [logoImage, isProcessing]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((clientY - dragStart.y) / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, logoPosition.x + deltaX));
    const newY = Math.max(0, Math.min(100, logoPosition.y + deltaY));

    onPositionChange({ x: newX, y: newY });
    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, dragStart, logoPosition.x, logoPosition.y, onPositionChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle resize start (from corner handles)
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!logoImage || isProcessing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    setResizeStart({ x: clientX, y: clientY, scale: logoPosition.scale });
  }, [logoImage, isProcessing, logoPosition.scale]);

  // Handle resize move
  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !containerRef.current) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    // Calculate distance from start position
    const deltaX = clientX - resizeStart.x;
    const deltaY = clientY - resizeStart.y;
    
    // Use the diagonal distance for more intuitive scaling
    const delta = (deltaX + deltaY) / 2;
    const scaleFactor = delta / (rect.width / 4); // Adjust sensitivity
    
    const newScale = Math.max(0.1, Math.min(3, resizeStart.scale + scaleFactor));
    onPositionChange({ scale: newScale });
  }, [isResizing, resizeStart, onPositionChange]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Set up global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Set up global event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("touchmove", handleResizeMove);
      window.addEventListener("touchend", handleResizeEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
      window.removeEventListener("touchmove", handleResizeMove);
      window.removeEventListener("touchend", handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Scale controls
  const handleScaleChange = useCallback((value: number[]) => {
    onPositionChange({ scale: value[0] });
  }, [onPositionChange]);

  const handleScaleStep = useCallback((delta: number) => {
    const newScale = Math.max(0.1, Math.min(3, logoPosition.scale + delta));
    onPositionChange({ scale: newScale });
  }, [logoPosition.scale, onPositionChange]);

  // Rotation controls
  const handleRotationChange = useCallback((value: number[]) => {
    onPositionChange({ rotation: value[0] });
  }, [onPositionChange]);

  const handleRotationStep = useCallback((delta: number) => {
    const newRotation = logoPosition.rotation + delta;
    onPositionChange({ rotation: newRotation });
  }, [logoPosition.rotation, onPositionChange]);

  // Display image (generated mockup or preview)
  const displayImage = generatedMockup || productImage;

  return (
    <div className="space-y-4">
      {/* Canvas Area */}
      <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className={cn(
              "relative aspect-square bg-[#1a1a1a] overflow-hidden",
              "bg-[radial-gradient(circle_at_center,#2a2a2a_1px,transparent_1px)]",
              "bg-[length:20px_20px]"
            )}
          >
            {/* Product Image */}
            {displayImage ? (
              <img
                src={displayImage}
                alt="Product"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Maximize2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("selectTemplateOrUpload")}</p>
                </div>
              </div>
            )}

            {/* Logo Overlay (only show when not displaying generated mockup) */}
            {productImage && logoImage && !generatedMockup && (
              <div
                ref={logoRef}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className={cn(
                  "absolute cursor-move select-none touch-none",
                  isDragging && "cursor-grabbing",
                  isProcessing && "pointer-events-none opacity-50"
                )}
                style={{
                  left: `${logoPosition.x}%`,
                  top: `${logoPosition.y}%`,
                  transform: `translate(-50%, -50%) scale(${logoPosition.scale}) rotate(${logoPosition.rotation}deg)`,
                }}
              >
                <div className="relative">
                  <img
                    src={logoImage}
                    alt="Logo"
                    className="max-w-[150px] max-h-[150px] pointer-events-none"
                    draggable={false}
                  />
                  {/* Drag indicator border */}
                  <div 
                    className={cn(
                      "absolute inset-0 border-2 border-dashed rounded transition-colors",
                      isDragging ? "border-violet-500" : "border-white/50"
                    )}
                  />
                  {/* Corner handles - draggable for resize */}
                  <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className={cn(
                      "absolute -top-1.5 -left-1.5 w-4 h-4 bg-violet-500 rounded-full cursor-nwse-resize hover:bg-violet-400 transition-colors z-10",
                      isResizing && "bg-violet-400"
                    )}
                  />
                  <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className={cn(
                      "absolute -top-1.5 -right-1.5 w-4 h-4 bg-violet-500 rounded-full cursor-nesw-resize hover:bg-violet-400 transition-colors z-10",
                      isResizing && "bg-violet-400"
                    )}
                  />
                  <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className={cn(
                      "absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-violet-500 rounded-full cursor-nesw-resize hover:bg-violet-400 transition-colors z-10",
                      isResizing && "bg-violet-400"
                    )}
                  />
                  <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className={cn(
                      "absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-violet-500 rounded-full cursor-nwse-resize hover:bg-violet-400 transition-colors z-10",
                      isResizing && "bg-violet-400"
                    )}
                  />
                </div>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-3"
                  />
                  <p className="text-sm text-white">{t("generatingMockup")}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {productImage && !logoImage && !generatedMockup && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white/80">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">{t("uploadLogoToContinue")}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {logoImage ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted/30 overflow-hidden flex-shrink-0">
                <img
                  src={logoImage}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t("logoUploaded")}</p>
                <p className="text-xs text-muted-foreground">{t("dragToPosition")}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {t("change")}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-16 border-dashed border-2 hover:border-violet-500/50"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || !productImage}
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-4 h-4" />
                <span className="text-xs">{t("uploadLogo")}</span>
              </div>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Position Controls (only show when logo is present and no generated mockup) */}
      {logoImage && !generatedMockup && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 space-y-4">
            {/* Scale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <ZoomIn className="w-3 h-3" />
                  {t("scale")}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(logoPosition.scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleScaleStep(-0.1)}
                  disabled={isProcessing}
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <Slider
                  value={[logoPosition.scale]}
                  onValueChange={handleScaleChange}
                  min={0.1}
                  max={3}
                  step={0.05}
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleScaleStep(0.1)}
                  disabled={isProcessing}
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  {t("rotation")}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(logoPosition.rotation)}°
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRotationStep(-15)}
                  disabled={isProcessing}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <Slider
                  value={[logoPosition.rotation]}
                  onValueChange={handleRotationChange}
                  min={-180}
                  max={180}
                  step={1}
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRotationStep(15)}
                  disabled={isProcessing}
                >
                  <RotateCw className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onResetPosition}
              disabled={isProcessing}
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              {t("resetPosition")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
