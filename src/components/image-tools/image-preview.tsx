"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { cn } from "@/lib/utils";
import { Check, X, Crop as CropIcon, ZoomIn, ZoomOut } from "lucide-react";

interface ImagePreviewProps {
  imageUrl: string;
  isProcessing: boolean;
  onCrop: (x: number, y: number, width: number, height: number) => void;
  previewRotation?: number;
}

export function ImagePreview({ imageUrl, isProcessing, onCrop, previewRotation = 0 }: ImagePreviewProps) {
  const t = useTranslations("imageTools");
  const tc = useTranslations("common");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate base width based on image and container dimensions
  const calculateBaseWidth = useCallback(() => {
    if (imgRef.current && containerRef.current) {
      const img = imgRef.current;
      
      // Only proceed if image has natural dimensions
      if (img.naturalWidth === 0 || img.naturalHeight === 0) return;
      
      // Calculate the natural display width based on container constraints
      const containerWidth = containerRef.current.clientWidth - 32; // minus padding
      const maxHeight = window.innerHeight * 0.5; // 50vh
      
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      // Calculate width that fits within constraints
      let displayWidth = Math.min(containerWidth, img.naturalWidth);
      let displayHeight = displayWidth / aspectRatio;
      
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * aspectRatio;
      }
      
      setBaseWidth(displayWidth);
    }
  }, []);

  // Get base width when image loads via onLoad event
  const handleImageLoad = useCallback(() => {
    calculateBaseWidth();
  }, [calculateBaseWidth]);

  // Reset state when image changes
  useEffect(() => {
    setBaseWidth(null);
    setZoom(1);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsCropping(false);
  }, [imageUrl]);

  // Check if image is already loaded (cached) and calculate base width
  // This handles the case where onLoad doesn't fire for cached images
  useEffect(() => {
    // Use a small timeout to ensure the DOM is ready
    const timeoutId = setTimeout(() => {
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        calculateBaseWidth();
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [imageUrl, calculateBaseWidth]);

  const handleCropComplete = useCallback(() => {
    if (completedCrop && imgRef.current) {
      // Calculate scale based on actual displayed size vs natural size
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const x = Math.round(completedCrop.x * scaleX);
      const y = Math.round(completedCrop.y * scaleY);
      const width = Math.round(completedCrop.width * scaleX);
      const height = Math.round(completedCrop.height * scaleY);

      onCrop(x, y, width, height);
      setIsCropping(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [completedCrop, onCrop]);

  const handleCancelCrop = () => {
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleToggleCrop = () => {
    if (!isCropping) {
      setIsCropping(true);
    } else {
      handleCancelCrop();
    }
  };

  // Calculate the actual display width based on zoom
  const displayWidth = baseWidth ? baseWidth * zoom : undefined;

  return (
    <Card className="relative overflow-hidden bg-card/50 border-border/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant={isCropping ? "secondary" : "ghost"}
            size="sm"
            onClick={handleToggleCrop}
            disabled={isProcessing}
          >
            <CropIcon className="w-4 h-4 mr-2" />
            {isCropping ? t("cropping") : t("tools.crop")}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomOut} 
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomIn} 
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {isCropping && completedCrop && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancelCrop}>
              <X className="w-4 h-4 mr-1" />
              {tc("cancel")}
            </Button>
            <Button variant="default" size="sm" onClick={handleCropComplete}>
              <Check className="w-4 h-4 mr-1" />
              {t("applyCrop")}
            </Button>
          </div>
        )}
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="relative overflow-auto" 
        style={{ maxHeight: "60vh" }}
      >
        <div className="flex items-center justify-center min-h-[300px] p-4">
          {isCropping ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Preview"
                onLoad={handleImageLoad}
                style={{
                  width: displayWidth ? `${displayWidth}px` : "auto",
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
            </ReactCrop>
          ) : (
            <motion.img
              ref={imgRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, rotate: previewRotation }}
              transition={{ rotate: { duration: 0.15 } }}
              src={imageUrl}
              alt="Preview"
              onLoad={handleImageLoad}
              className="rounded-lg shadow-xl"
              style={{
                width: displayWidth ? `${displayWidth}px` : "auto",
                maxWidth: "100%",
                height: "auto",
              }}
            />
          )}
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-muted-foreground">{t("processingImage")}</p>
          </motion.div>
        )}
      </div>

      {/* Crop Instructions */}
      {isCropping && !completedCrop && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-violet-500/90 text-white text-sm">
          {t("cropInstructions")}
        </div>
      )}
    </Card>
  );
}
