"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn, formatBytes } from "@/lib/utils";
import { Upload, ImageIcon, X, AlertCircle, Images } from "lucide-react";

interface ImageUploaderProps {
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  multiple?: boolean;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
}

export function ImageUploader({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
}: ImageUploaderProps) {
  const t = useTranslations("imageTools");
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${formatBytes(maxSize)}`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Please upload an image file.");
        } else {
          setError("Unable to upload this file. Please try another.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        if (multiple && onFilesSelect) {
          onFilesSelect(acceptedFiles);
        } else if (onFileSelect) {
          onFileSelect(acceptedFiles[0]);
        }
      }
    },
    [onFileSelect, onFilesSelect, multiple, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxSize,
    multiple,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer border-2 border-dashed transition-all duration-200",
        "hover:border-violet-500/50 hover:bg-violet-500/5",
        isDragActive && !isDragReject && "border-violet-500 bg-violet-500/10",
        isDragReject && "border-destructive bg-destructive/10",
        error && "border-destructive/50"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <motion.div
          animate={{
            scale: isDragActive ? 1.1 : 1,
            rotate: isDragActive ? 5 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
            "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20",
            "border border-violet-500/30"
          )}
        >
          {isDragReject ? (
            <X className="w-8 h-8 text-destructive" />
          ) : isDragActive ? (
            <Upload className="w-8 h-8 text-violet-400" />
          ) : multiple ? (
            <Images className="w-8 h-8 text-violet-400" />
          ) : (
            <ImageIcon className="w-8 h-8 text-violet-400" />
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isDragReject ? (
            <motion.div
              key="reject"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-destructive font-medium mb-2">
                Invalid file type
              </p>
              <p className="text-sm text-muted-foreground">
                Please drop an image file
              </p>
            </motion.div>
          ) : isDragActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-violet-400 font-medium mb-2">
                {multiple ? t("dropImagesHere") : "Drop your image here"}
              </p>
              <p className="text-sm text-muted-foreground">
                Release to upload
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-white font-medium mb-2">
                {multiple ? t("dragDropMultiple") : "Drag and drop your image here"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {multiple 
                  ? t("clickToBrowseMultiple")
                  : "or click to browse from your computer"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-md bg-muted/50">JPEG</span>
                <span className="px-2 py-1 rounded-md bg-muted/50">PNG</span>
                <span className="px-2 py-1 rounded-md bg-muted/50">WebP</span>
                <span className="px-2 py-1 rounded-md bg-muted/50">GIF</span>
                <span className="text-muted-foreground/50">•</span>
                <span>Max {formatBytes(maxSize)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-4 left-4 right-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
            >
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}








