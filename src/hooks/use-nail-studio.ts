"use client";

import { useState, useCallback } from "react";
import * as api from "@/lib/api";
import {
  NailStudioState,
  NailStudioTab,
  NailImage,
  NailStudioResult,
  BoxOption,
  MAX_CONCURRENT_REQUESTS,
} from "@/types/nail-studio";

const initialState: NailStudioState = {
  activeTab: "background",

  nailImages: [],
  selectedNailId: null,

  backgroundImage: null,
  backgroundMimeType: "image/png",
  backgroundName: "",
  boxOption: "keep_original",

  handImage: null,
  handMimeType: "image/png",
  handName: "",

  results: [],

  isProcessing: false,
  processingCount: 0,
  error: null,
};

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `nail-${Date.now()}-${idCounter}`;
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

export function useNailStudio(getToken?: () => Promise<string | null>) {
  const [state, setState] = useState<NailStudioState>(initialState);

  // ==========================================================================
  // Tab Management
  // ==========================================================================

  const setActiveTab = useCallback((tab: NailStudioTab) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
      error: null,
    }));
  }, []);

  // ==========================================================================
  // Nail Image Management
  // ==========================================================================

  const addNailImages = useCallback(
    (images: { dataUrl: string; mimeType: string; name: string }[]) => {
      const newItems: NailImage[] = images.map((img) => ({
        id: generateId(),
        imageDataUrl: img.dataUrl,
        mimeType: img.mimeType,
        name: img.name,
      }));

      setState((prev) => {
        const updatedImages = [...prev.nailImages, ...newItems];
        return {
          ...prev,
          nailImages: updatedImages,
          selectedNailId: prev.selectedNailId || newItems[0]?.id || null,
          error: null,
        };
      });
    },
    []
  );

  const removeNailImage = useCallback((imageId: string) => {
    setState((prev) => {
      const filtered = prev.nailImages.filter((img) => img.id !== imageId);
      let selectedId = prev.selectedNailId;
      if (selectedId === imageId) {
        selectedId = filtered.length > 0 ? filtered[0].id : null;
      }
      return {
        ...prev,
        nailImages: filtered,
        selectedNailId: selectedId,
      };
    });
  }, []);

  const selectNail = useCallback((imageId: string) => {
    setState((prev) => ({
      ...prev,
      selectedNailId: imageId,
    }));
  }, []);

  const clearNailImages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      nailImages: [],
      selectedNailId: null,
    }));
  }, []);

  // ==========================================================================
  // Background Image Management
  // ==========================================================================

  const setBackgroundImage = useCallback(
    (imageDataUrl: string, mimeType: string, name: string) => {
      setState((prev) => ({
        ...prev,
        backgroundImage: imageDataUrl,
        backgroundMimeType: mimeType,
        backgroundName: name,
        error: null,
      }));
    },
    []
  );

  const clearBackgroundImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      backgroundImage: null,
      backgroundMimeType: "image/png",
      backgroundName: "",
    }));
  }, []);

  const setBoxOption = useCallback((option: BoxOption) => {
    setState((prev) => ({ ...prev, boxOption: option }));
  }, []);

  // ==========================================================================
  // Hand Image Management
  // ==========================================================================

  const setHandImage = useCallback(
    (imageDataUrl: string, mimeType: string, name: string) => {
      setState((prev) => ({
        ...prev,
        handImage: imageDataUrl,
        handMimeType: mimeType,
        handName: name,
        error: null,
      }));
    },
    []
  );

  const clearHandImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      handImage: null,
      handMimeType: "image/png",
      handName: "",
    }));
  }, []);

  // ==========================================================================
  // Background Change Generation
  // ==========================================================================

  const generateBackgroundChange = useCallback(
    async (aiModelId?: string) => {
      const { nailImages, backgroundImage, backgroundMimeType, backgroundName, boxOption } =
        state;

      if (nailImages.length === 0) {
        setState((prev) => ({
          ...prev,
          error: "Please upload at least one nail art image",
        }));
        return;
      }

      if (!backgroundImage) {
        setState((prev) => ({
          ...prev,
          error: "Please select a background image",
        }));
        return;
      }

      const initialResults: NailStudioResult[] = nailImages.map(
        (nail, index) => ({
          id: `bg-result-${Date.now()}-${index}`,
          nailImageId: nail.id,
          nailImageName: nail.name,
          targetImageName: backgroundName || "Custom Background",
          type: "background" as const,
          status: "pending" as const,
          imageDataUrl: null,
          error: null,
        })
      );

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        processingCount: nailImages.length,
        results: initialResults,
        error: null,
      }));

      const authToken = getToken ? await getToken() : null;
      const bgBase64 = backgroundImage.split(",")[1] || backgroundImage;

      const tasks = nailImages.map((nail, index) => async () => {
        setState((prev) => ({
          ...prev,
          results: prev.results.map((r, i) =>
            i === index ? { ...r, status: "processing" as const } : r
          ),
        }));

        try {
          const nailBase64 = nail.imageDataUrl.split(",")[1] || nail.imageDataUrl;

          const response = await api.changeNailBackground(
            nailBase64,
            nail.mimeType,
            bgBase64,
            backgroundMimeType,
            boxOption,
            aiModelId,
            authToken || undefined
          );

          if (response.success && response.data) {
            const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
            setState((prev) => ({
              ...prev,
              results: prev.results.map((r, i) =>
                i === index
                  ? {
                      ...r,
                      status: "fulfilled" as const,
                      imageDataUrl: resultUrl,
                      error: null,
                    }
                  : r
              ),
            }));
            return { success: true };
          } else {
            throw new Error(response.error || "Failed to change background");
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          setState((prev) => ({
            ...prev,
            results: prev.results.map((r, i) =>
              i === index
                ? { ...r, status: "rejected" as const, error: errorMessage }
                : r
            ),
          }));
          return { success: false };
        }
      });

      await runWithConcurrency(tasks, MAX_CONCURRENT_REQUESTS);

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        processingCount: 0,
      }));
    },
    [state, getToken]
  );

  // ==========================================================================
  // Hand Apply Generation
  // ==========================================================================

  const generateHandApply = useCallback(
    async (aiModelId?: string) => {
      const { nailImages, handImage, handMimeType, handName } = state;

      if (nailImages.length === 0) {
        setState((prev) => ({
          ...prev,
          error: "Please upload at least one nail art image",
        }));
        return;
      }

      if (!handImage) {
        setState((prev) => ({
          ...prev,
          error: "Please select a hand image",
        }));
        return;
      }

      const initialResults: NailStudioResult[] = nailImages.map(
        (nail, index) => ({
          id: `hand-result-${Date.now()}-${index}`,
          nailImageId: nail.id,
          nailImageName: nail.name,
          targetImageName: handName || "Custom Hand",
          type: "hand" as const,
          status: "pending" as const,
          imageDataUrl: null,
          error: null,
        })
      );

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        processingCount: nailImages.length,
        results: initialResults,
        error: null,
      }));

      const authToken = getToken ? await getToken() : null;
      const handBase64 = handImage.split(",")[1] || handImage;

      const tasks = nailImages.map((nail, index) => async () => {
        setState((prev) => ({
          ...prev,
          results: prev.results.map((r, i) =>
            i === index ? { ...r, status: "processing" as const } : r
          ),
        }));

        try {
          const nailBase64 = nail.imageDataUrl.split(",")[1] || nail.imageDataUrl;

          const response = await api.applyNailToHand(
            nailBase64,
            nail.mimeType,
            handBase64,
            handMimeType,
            aiModelId,
            authToken || undefined
          );

          if (response.success && response.data) {
            const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
            setState((prev) => ({
              ...prev,
              results: prev.results.map((r, i) =>
                i === index
                  ? {
                      ...r,
                      status: "fulfilled" as const,
                      imageDataUrl: resultUrl,
                      error: null,
                    }
                  : r
              ),
            }));
            return { success: true };
          } else {
            throw new Error(response.error || "Failed to apply nail to hand");
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          setState((prev) => ({
            ...prev,
            results: prev.results.map((r, i) =>
              i === index
                ? { ...r, status: "rejected" as const, error: errorMessage }
                : r
            ),
          }));
          return { success: false };
        }
      });

      await runWithConcurrency(tasks, MAX_CONCURRENT_REQUESTS);

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        processingCount: 0,
      }));
    },
    [state, getToken]
  );

  // ==========================================================================
  // Retry
  // ==========================================================================

  const retryResult = useCallback(
    async (resultId: string, aiModelId?: string) => {
      const result = state.results.find((r) => r.id === resultId);
      if (!result) return;

      const nail = state.nailImages.find((n) => n.id === result.nailImageId);
      if (!nail) return;

      setState((prev) => ({
        ...prev,
        results: prev.results.map((r) =>
          r.id === resultId
            ? { ...r, status: "processing" as const, error: null }
            : r
        ),
      }));

      const authToken = getToken ? await getToken() : null;

      try {
        const nailBase64 = nail.imageDataUrl.split(",")[1] || nail.imageDataUrl;
        let response;

        if (result.type === "background" && state.backgroundImage) {
          const bgBase64 =
            state.backgroundImage.split(",")[1] || state.backgroundImage;
          response = await api.changeNailBackground(
            nailBase64,
            nail.mimeType,
            bgBase64,
            state.backgroundMimeType,
            state.boxOption,
            aiModelId,
            authToken || undefined
          );
        } else if (result.type === "hand" && state.handImage) {
          const handBase64 =
            state.handImage.split(",")[1] || state.handImage;
          response = await api.applyNailToHand(
            nailBase64,
            nail.mimeType,
            handBase64,
            state.handMimeType,
            aiModelId,
            authToken || undefined
          );
        } else {
          throw new Error("Target image no longer available");
        }

        if (response.success && response.data) {
          const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
          setState((prev) => ({
            ...prev,
            results: prev.results.map((r) =>
              r.id === resultId
                ? {
                    ...r,
                    status: "fulfilled" as const,
                    imageDataUrl: resultUrl,
                    error: null,
                  }
                : r
            ),
          }));
        } else {
          throw new Error(response.error || "Failed to retry");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          results: prev.results.map((r) =>
            r.id === resultId
              ? { ...r, status: "rejected" as const, error: errorMessage }
              : r
          ),
        }));
      }
    },
    [state, getToken]
  );

  // ==========================================================================
  // Download
  // ==========================================================================

  const downloadResult = useCallback((result: NailStudioResult) => {
    if (!result.imageDataUrl) return;

    const link = document.createElement("a");
    link.download = `nail-${result.type}-${result.nailImageName}-${Date.now()}.png`;
    link.href = result.imageDataUrl;
    link.click();
  }, []);

  const downloadAllResults = useCallback(() => {
    const successfulResults = state.results.filter(
      (r) => r.status === "fulfilled" && r.imageDataUrl
    );

    successfulResults.forEach((result, index) => {
      setTimeout(() => {
        downloadResult(result);
      }, index * 300);
    });
  }, [state.results, downloadResult]);

  // ==========================================================================
  // Reset / Clear
  // ==========================================================================

  const resetEditor = useCallback(() => {
    setState(initialState);
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: [] }));
  }, []);

  return {
    state,
    // Tab
    setActiveTab,
    // Nail images
    addNailImages,
    removeNailImage,
    selectNail,
    clearNailImages,
    // Background
    setBackgroundImage,
    clearBackgroundImage,
    setBoxOption,
    // Hand
    setHandImage,
    clearHandImage,
    // Generation
    generateBackgroundChange,
    generateHandApply,
    retryResult,
    // Download
    downloadResult,
    downloadAllResults,
    // Reset
    resetEditor,
    clearError,
    clearResults,
  };
}
