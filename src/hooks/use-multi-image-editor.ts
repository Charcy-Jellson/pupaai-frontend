"use client";

import { useState, useCallback } from "react";
import type { 
  MultiImageItem, 
  MultiImageEditorState, 
  ImageOperation,
  BatchOperationType,
} from "@/types";
import { generateId } from "@/lib/utils";
import { withConcurrencyLimitSettled } from "@/lib/concurrency";
import * as api from "@/lib/api";

const initialState: MultiImageEditorState = {
  images: [],
  activeImageId: null,
  globalProcessing: false,
};

// Maximum concurrent AI requests
const AI_CONCURRENCY_LIMIT = 3;

export function useMultiImageEditor() {
  const [state, setState] = useState<MultiImageEditorState>(initialState);

  // Add multiple images
  const addImages = useCallback((files: File[]) => {
    const newImages: MultiImageItem[] = [];
    
    const processFile = (file: File): Promise<MultiImageItem> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          resolve({
            id: generateId(),
            originalImage: dataUrl,
            currentImage: dataUrl,
            mimeType: file.type || "image/png",
            fileName: file.name.replace(/\.[^/.]+$/, ""),
            operations: [],
            isProcessing: false,
            isSelected: true, // Auto-select newly added images
          });
        };
        reader.readAsDataURL(file);
      });
    };

    Promise.all(files.map(processFile)).then((images) => {
      setState((prev) => ({
        ...prev,
        images: [...prev.images, ...images],
      }));
    });
  }, []);

  // Remove an image
  const removeImage = useCallback((imageId: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
      activeImageId: prev.activeImageId === imageId ? null : prev.activeImageId,
    }));
  }, []);

  // Clear all images
  const clearAllImages = useCallback(() => {
    setState(initialState);
  }, []);

  // Toggle image selection
  const toggleImageSelection = useCallback((imageId: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === imageId ? { ...img, isSelected: !img.isSelected } : img
      ),
    }));
  }, []);

  // Select all images
  const selectAllImages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({ ...img, isSelected: true })),
    }));
  }, []);

  // Deselect all images
  const deselectAllImages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({ ...img, isSelected: false })),
    }));
  }, []);

  // Set active image for single-image operations (like Crop)
  const setActiveImage = useCallback((imageId: string | null) => {
    setState((prev) => ({
      ...prev,
      activeImageId: imageId,
    }));
  }, []);

  // Get selected images
  const getSelectedImages = useCallback(() => {
    return state.images.filter((img) => img.isSelected);
  }, [state.images]);

  // Get active image
  const getActiveImage = useCallback(() => {
    return state.images.find((img) => img.id === state.activeImageId) || null;
  }, [state.images, state.activeImageId]);

  // Undo last operation for a specific image
  const undoImageOperation = useCallback((imageId: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => {
        if (img.id !== imageId || img.operations.length === 0) return img;

        const newOperations = img.operations.slice(0, -1);
        const previousImage =
          newOperations.length > 0
            ? newOperations[newOperations.length - 1].resultUrl
            : img.originalImage;

        return {
          ...img,
          currentImage: previousImage,
          operations: newOperations,
        };
      }),
    }));
  }, []);

  // Reset a specific image to original
  const resetImage = useCallback((imageId: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === imageId
          ? { ...img, currentImage: img.originalImage, operations: [] }
          : img
      ),
    }));
  }, []);

  // Helper to add operation to an image
  const addOperationToImage = useCallback(
    (imageId: string, operation: Omit<ImageOperation, "id" | "timestamp">) => {
      const newOperation: ImageOperation = {
        ...operation,
        id: generateId(),
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === imageId
            ? {
                ...img,
                currentImage: operation.resultUrl,
                operations: [...img.operations, newOperation],
                error: undefined,
              }
            : img
        ),
      }));
    },
    []
  );

  // Helper to set error on an image
  const setImageError = useCallback((imageId: string, error: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === imageId ? { ...img, error, isProcessing: false } : img
      ),
    }));
  }, []);

  // Helper to set processing state for images
  const setImagesProcessing = useCallback((imageIds: string[], processing: boolean) => {
    setState((prev) => ({
      ...prev,
      globalProcessing: processing,
      images: prev.images.map((img) =>
        imageIds.includes(img.id) ? { ...img, isProcessing: processing } : img
      ),
    }));
  }, []);

  // =========================================================================
  // Single Image Operations (for Crop - only works on active image)
  // =========================================================================

  const cropActiveImage = useCallback(
    async (x: number, y: number, width: number, height: number) => {
      const activeImage = state.images.find((img) => img.id === state.activeImageId);
      if (!activeImage) return;

      setImagesProcessing([activeImage.id], true);

      try {
        const img = new Image();
        img.src = activeImage.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        const resultUrl = canvas.toDataURL(activeImage.mimeType);
        addOperationToImage(activeImage.id, {
          type: "crop",
          params: { x, y, width, height },
          resultUrl,
        });
      } finally {
        setImagesProcessing([activeImage.id], false);
      }
    },
    [state.images, state.activeImageId, addOperationToImage, setImagesProcessing]
  );

  // =========================================================================
  // Batch Operations (Non-AI - runs in parallel)
  // =========================================================================

  const batchRotate = useCallback(
    async (degrees: number) => {
      const selectedImages = state.images.filter((img) => img.isSelected);
      if (selectedImages.length === 0) return;

      const imageIds = selectedImages.map((img) => img.id);
      setImagesProcessing(imageIds, true);

      try {
        await Promise.all(
          selectedImages.map(async (imgData) => {
            const img = new Image();
            img.src = imgData.currentImage;
            await new Promise((resolve) => (img.onload = resolve));

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;

            const normalizedDegrees = ((degrees % 360) + 360) % 360;

            if (normalizedDegrees === 90 || normalizedDegrees === 270) {
              canvas.width = img.height;
              canvas.height = img.width;
            } else {
              canvas.width = img.width;
              canvas.height = img.height;
            }

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((normalizedDegrees * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            const resultUrl = canvas.toDataURL(imgData.mimeType);
            addOperationToImage(imgData.id, {
              type: "rotate",
              params: { degrees },
              resultUrl,
            });
          })
        );
      } finally {
        setImagesProcessing(imageIds, false);
      }
    },
    [state.images, addOperationToImage, setImagesProcessing]
  );

  const batchResize = useCallback(
    async (newWidth: number, newHeight: number) => {
      const selectedImages = state.images.filter((img) => img.isSelected);
      if (selectedImages.length === 0) return;

      const imageIds = selectedImages.map((img) => img.id);
      setImagesProcessing(imageIds, true);

      try {
        await Promise.all(
          selectedImages.map(async (imgData) => {
            const img = new Image();
            img.src = imgData.currentImage;
            await new Promise((resolve) => (img.onload = resolve));

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            const resultUrl = canvas.toDataURL(imgData.mimeType);
            addOperationToImage(imgData.id, {
              type: "resize",
              params: { width: newWidth, height: newHeight },
              resultUrl,
            });
          })
        );
      } finally {
        setImagesProcessing(imageIds, false);
      }
    },
    [state.images, addOperationToImage, setImagesProcessing]
  );

  const batchCompress = useCallback(
    async (targetSizeKB: number): Promise<{ originalSize: number; finalSize: number; quality: number }> => {
      const selectedImages = state.images.filter((img) => img.isSelected);
      if (selectedImages.length === 0) {
        return { originalSize: 0, finalSize: 0, quality: 0 };
      }

      const imageIds = selectedImages.map((img) => img.id);
      setImagesProcessing(imageIds, true);

      let totalOriginalSize = 0;
      let totalFinalSize = 0;
      let totalQuality = 0;

      try {
        await Promise.all(
          selectedImages.map(async (imgData) => {
            const img = new Image();
            img.src = imgData.currentImage;
            await new Promise((resolve) => (img.onload = resolve));

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Get original size
            const originalBlob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), "image/jpeg", 1.0);
            });
            const originalSizeKB = originalBlob.size / 1024;
            totalOriginalSize += originalSizeKB;

            // Binary search for optimal quality
            let minQuality = 0.1;
            let maxQuality = 1.0;
            let bestBlob: Blob | null = null;
            let bestQuality = 1.0;
            const targetBytes = targetSizeKB * 1024;

            for (let i = 0; i < 10; i++) {
              const midQuality = (minQuality + maxQuality) / 2;
              const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), "image/jpeg", midQuality);
              });

              if (blob.size <= targetBytes) {
                bestBlob = blob;
                bestQuality = midQuality;
                minQuality = midQuality;
              } else {
                maxQuality = midQuality;
              }

              if (maxQuality - minQuality < 0.02) break;
            }

            if (!bestBlob) {
              bestBlob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.1);
              });
              bestQuality = 0.1;
            }

            const finalSizeKB = bestBlob.size / 1024;
            totalFinalSize += finalSizeKB;
            totalQuality += bestQuality * 100;

            const resultUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(bestBlob!);
            });

            addOperationToImage(imgData.id, {
              type: "compress",
              params: { targetSizeKB, quality: Math.round(bestQuality * 100) },
              resultUrl,
            });
          })
        );

        const avgQuality = selectedImages.length > 0 ? totalQuality / selectedImages.length : 0;
        
        return {
          originalSize: Math.round(totalOriginalSize),
          finalSize: Math.round(totalFinalSize),
          quality: Math.round(avgQuality),
        };
      } finally {
        setImagesProcessing(imageIds, false);
      }
    },
    [state.images, addOperationToImage, setImagesProcessing]
  );

  // =========================================================================
  // Batch AI Operations (runs with concurrency limit)
  // =========================================================================

  const batchRemoveBackground = useCallback(
    async (modelId?: string, onProgress?: (completed: number, total: number) => void) => {
      const selectedImages = state.images.filter((img) => img.isSelected);
      if (selectedImages.length === 0) return;

      const imageIds = selectedImages.map((img) => img.id);
      setImagesProcessing(imageIds, true);

      const tasks = selectedImages.map((imgData) => async () => {
        const base64Data = imgData.currentImage.split(",")[1];
        const response = await api.removeBackground(base64Data, imgData.mimeType, modelId);

        if (response.success && response.data) {
          const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
          addOperationToImage(imgData.id, {
            type: "remove-background",
            params: { modelId: modelId || "default" },
            resultUrl,
          });
          return { success: true, imageId: imgData.id };
        } else {
          setImageError(imgData.id, response.error || "Failed to remove background");
          throw new Error(response.error || "Failed to remove background");
        }
      });

      try {
        await withConcurrencyLimitSettled(tasks, AI_CONCURRENCY_LIMIT, (completed, total) => {
          onProgress?.(completed, total);
        });
      } finally {
        setImagesProcessing(imageIds, false);
      }
    },
    [state.images, addOperationToImage, setImagesProcessing, setImageError]
  );

  const batchExtractLogo = useCallback(
    async (
      modelId?: string, 
      removeBackground: boolean = true,
      onProgress?: (completed: number, total: number) => void
    ) => {
      const selectedImages = state.images.filter((img) => img.isSelected);
      if (selectedImages.length === 0) return;

      const imageIds = selectedImages.map((img) => img.id);
      setImagesProcessing(imageIds, true);

      const tasks = selectedImages.map((imgData) => async () => {
        const base64Data = imgData.currentImage.split(",")[1];
        const response = await api.extractLogo(base64Data, imgData.mimeType, modelId, removeBackground);

        if (response.success && response.data) {
          const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
          addOperationToImage(imgData.id, {
            type: "extract-logo",
            params: { modelId: modelId || "default", removeBackground },
            resultUrl,
          });
          return { success: true, imageId: imgData.id };
        } else {
          setImageError(imgData.id, response.error || "Failed to extract logo");
          throw new Error(response.error || "Failed to extract logo");
        }
      });

      try {
        await withConcurrencyLimitSettled(tasks, AI_CONCURRENCY_LIMIT, (completed, total) => {
          onProgress?.(completed, total);
        });
      } finally {
        setImagesProcessing(imageIds, false);
      }
    },
    [state.images, addOperationToImage, setImagesProcessing, setImageError]
  );

  const batchRemoveLogo = useCallback(
    async (modelId?: string, onProgress?: (completed: number, total: number) => void) => {
      const selectedImages = state.images.filter((img) => img.isSelected);
      if (selectedImages.length === 0) return;

      const imageIds = selectedImages.map((img) => img.id);
      setImagesProcessing(imageIds, true);

      const tasks = selectedImages.map((imgData) => async () => {
        const base64Data = imgData.currentImage.split(",")[1];
        const response = await api.removeLogo(base64Data, imgData.mimeType, modelId);

        if (response.success && response.data) {
          const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
          addOperationToImage(imgData.id, {
            type: "remove-logo",
            params: { modelId: modelId || "default" },
            resultUrl,
          });
          return { success: true, imageId: imgData.id };
        } else {
          setImageError(imgData.id, response.error || "Failed to remove logo");
          throw new Error(response.error || "Failed to remove logo");
        }
      });

      try {
        await withConcurrencyLimitSettled(tasks, AI_CONCURRENCY_LIMIT, (completed, total) => {
          onProgress?.(completed, total);
        });
      } finally {
        setImagesProcessing(imageIds, false);
      }
    },
    [state.images, addOperationToImage, setImagesProcessing, setImageError]
  );

  // Download all selected images
  const downloadSelectedImages = useCallback(() => {
    const selectedImages = state.images.filter((img) => img.isSelected);
    
    selectedImages.forEach((img, index) => {
      setTimeout(() => {
        try {
          // Convert base64 to Blob for reliable download
          const base64Data = img.currentImage.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: img.mimeType });
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const extension = img.mimeType.split("/")[1] || "png";
          link.href = url;
          link.download = `${img.fileName || `image-${index + 1}`}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL after download
          setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
          console.error(`Failed to download image ${index + 1}:`, error);
        }
      }, index * 200); // Delay each download to avoid browser blocking
    });
  }, [state.images]);

  return {
    state,
    // Image management
    addImages,
    removeImage,
    clearAllImages,
    // Selection
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    getSelectedImages,
    // Active image (for crop)
    setActiveImage,
    getActiveImage,
    // Single image operations
    cropActiveImage,
    undoImageOperation,
    resetImage,
    // Batch non-AI operations
    batchRotate,
    batchResize,
    batchCompress,
    // Batch AI operations
    batchRemoveBackground,
    batchExtractLogo,
    batchRemoveLogo,
    // Download
    downloadSelectedImages,
  };
}
