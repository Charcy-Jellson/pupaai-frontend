"use client";

import { useState, useCallback } from "react";
import type { ImageEditorState, ImageOperation } from "@/types";
import { generateId } from "@/lib/utils";
import * as api from "@/lib/api";

const initialState: ImageEditorState = {
  originalImage: null,
  currentImage: null,
  mimeType: "image/png",
  operations: [],
  isProcessing: false,
};

export function useImageEditor() {
  const [state, setState] = useState<ImageEditorState>(initialState);

  const setImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState({
      originalImage: imageDataUrl,
      currentImage: imageDataUrl,
      mimeType,
      operations: [],
      isProcessing: false,
    });
  }, []);

  const clearImage = useCallback(() => {
    setState(initialState);
  }, []);

  const addOperation = useCallback((operation: Omit<ImageOperation, "id" | "timestamp">) => {
    const newOperation: ImageOperation = {
      ...operation,
      id: generateId(),
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      currentImage: operation.resultUrl,
      operations: [...prev.operations, newOperation],
    }));
  }, []);

  const undoLastOperation = useCallback(() => {
    setState((prev) => {
      if (prev.operations.length === 0) return prev;

      const newOperations = prev.operations.slice(0, -1);
      const lastImage =
        newOperations.length > 0
          ? newOperations[newOperations.length - 1].resultUrl
          : prev.originalImage;

      return {
        ...prev,
        currentImage: lastImage,
        operations: newOperations,
      };
    });
  }, []);

  const resetToOriginal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentImage: prev.originalImage,
      operations: [],
    }));
  }, []);

  const rotateImage = useCallback(
    async (degrees: number) => {
      if (!state.currentImage) return;

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const img = new Image();
        img.src = state.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        const radians = (degrees * Math.PI) / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));

        canvas.width = img.width * cos + img.height * sin;
        canvas.height = img.width * sin + img.height * cos;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        const resultUrl = canvas.toDataURL(state.mimeType);

        addOperation({
          type: "rotate",
          params: { degrees },
          resultUrl,
        });
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.currentImage, state.mimeType, addOperation]
  );

  const cropImage = useCallback(
    async (x: number, y: number, width: number, height: number) => {
      if (!state.currentImage) return;

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const img = new Image();
        img.src = state.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        const resultUrl = canvas.toDataURL(state.mimeType);

        addOperation({
          type: "crop",
          params: { x, y, width, height },
          resultUrl,
        });
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.currentImage, state.mimeType, addOperation]
  );

  const resizeImage = useCallback(
    async (newWidth: number, newHeight: number) => {
      if (!state.currentImage) return;

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const img = new Image();
        img.src = state.currentImage;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const resultUrl = canvas.toDataURL(state.mimeType);

        addOperation({
          type: "resize",
          params: { width: newWidth, height: newHeight },
          resultUrl,
        });
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.currentImage, state.mimeType, addOperation]
  );

  const extractLogo = useCallback(async () => {
    if (!state.currentImage) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const base64Data = state.currentImage.split(",")[1];
      const response = await api.extractLogo(base64Data, state.mimeType);

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        addOperation({
          type: "extract-logo",
          resultUrl,
        });
      } else {
        throw new Error(response.error || "Failed to extract logo");
      }
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentImage, state.mimeType, addOperation]);

  const removeBackground = useCallback(async () => {
    if (!state.currentImage) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const base64Data = state.currentImage.split(",")[1];
      const response = await api.removeBackground(base64Data, state.mimeType);

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        addOperation({
          type: "remove-background",
          resultUrl,
        });
      } else {
        throw new Error(response.error || "Failed to remove background");
      }
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentImage, state.mimeType, addOperation]);

  const removeLogo = useCallback(async () => {
    if (!state.currentImage) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const base64Data = state.currentImage.split(",")[1];
      const response = await api.removeLogo(base64Data, state.mimeType);

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        addOperation({
          type: "remove-logo",
          resultUrl,
        });
      } else {
        throw new Error(response.error || "Failed to remove logo");
      }
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentImage, state.mimeType, addOperation]);

  const downloadImage = useCallback(
    (filename: string = "edited-image") => {
      if (!state.currentImage) return;

      const link = document.createElement("a");
      link.download = `${filename}.${state.mimeType.split("/")[1]}`;
      link.href = state.currentImage;
      link.click();
    },
    [state.currentImage, state.mimeType]
  );

  return {
    state,
    setImage,
    clearImage,
    rotateImage,
    cropImage,
    resizeImage,
    extractLogo,
    removeBackground,
    removeLogo,
    undoLastOperation,
    resetToOriginal,
    downloadImage,
  };
}


