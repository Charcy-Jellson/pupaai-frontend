"use client";

import { useState, useRef, useCallback } from "react";
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
}

export function ImagePreview({ imageUrl, isProcessing, onCrop }: ImagePreviewProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCropComplete = useCallback(() => {
    if (completedCrop && imgRef.current) {
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

  return (
    <Card className="relative overflow-hidden bg-card/50 border-border/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant={isCropping ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsCropping(!isCropping)}
            disabled={isProcessing}
          >
            <CropIcon className="w-4 h-4 mr-2" />
            {isCropping ? "Cropping..." : "Crop"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {isCropping && completedCrop && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancelCrop}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleCropComplete}>
              <Check className="w-4 h-4 mr-1" />
              Apply Crop
            </Button>
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative overflow-auto" style={{ maxHeight: "60vh" }}>
        <div
          className="flex items-center justify-center min-h-[300px] p-4"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
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
                className="max-w-full h-auto"
                style={{ maxHeight: "50vh" }}
              />
            </ReactCrop>
          ) : (
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={imageUrl}
              alt="Preview"
              className="max-w-full h-auto rounded-lg shadow-xl"
              style={{ maxHeight: "50vh" }}
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
            <p className="mt-4 text-sm text-muted-foreground">Processing image...</p>
          </motion.div>
        )}
      </div>

      {/* Crop Instructions */}
      {isCropping && !completedCrop && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-violet-500/90 text-white text-sm">
          Click and drag to select crop area
        </div>
      )}
    </Card>
  );
}


