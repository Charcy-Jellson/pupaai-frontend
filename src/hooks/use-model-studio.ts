"use client";

import { useState, useCallback } from "react";
import * as api from "@/lib/api";
import {
  ModelStudioState,
  ModelGenerationOptions,
  DEFAULT_MODEL_OPTIONS,
  ClothingItem,
  SceneOption,
  PoseOption,
  PantsType,
  ModelStudioResult,
  ModelSourceType,
} from "@/types/model-studio";

const initialState: ModelStudioState = {
  // Model selection
  modelSource: "upload",
  modelImage: null,
  modelMimeType: "image/png",
  modelGenerationOptions: DEFAULT_MODEL_OPTIONS,
  isGeneratingModel: false,

  // Clothing selection
  selectedClothingItems: [],

  // Generation options
  selectedScene: "original",
  selectedPoses: ["front_standing"],
  selectedPantsType: "jeans",

  // Results
  results: [],

  // Processing state
  isProcessing: false,
  processingCount: 0,
  error: null,
};

export function useModelStudio() {
  const [state, setState] = useState<ModelStudioState>(initialState);

  // ==========================================================================
  // Model Selection
  // ==========================================================================

  const setModelSource = useCallback((source: ModelSourceType) => {
    setState((prev) => ({
      ...prev,
      modelSource: source,
      // Clear model image when switching source (except for generated models)
      modelImage: source === prev.modelSource ? prev.modelImage : null,
      error: null,
    }));
  }, []);

  const setModelImage = useCallback((image: string, mimeType: string = "image/png") => {
    setState((prev) => ({
      ...prev,
      modelImage: image,
      modelMimeType: mimeType,
      error: null,
    }));
  }, []);

  const clearModelImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modelImage: null,
      modelMimeType: "image/png",
    }));
  }, []);

  const setModelGenerationOptions = useCallback((options: Partial<ModelGenerationOptions>) => {
    setState((prev) => ({
      ...prev,
      modelGenerationOptions: {
        ...prev.modelGenerationOptions,
        ...options,
      },
    }));
  }, []);

  const generateModel = useCallback(async (aiModelId?: string) => {
    setState((prev) => ({
      ...prev,
      isGeneratingModel: true,
      error: null,
    }));

    try {
      const { modelGenerationOptions } = state;
      
      const response = await api.generateFashionModel({
        ethnicity: modelGenerationOptions.ethnicity,
        gender: modelGenerationOptions.gender,
        hair_length: modelGenerationOptions.hairLength,
        glasses: modelGenerationOptions.glasses,
        age_group: modelGenerationOptions.ageGroup,
      }, aiModelId);

      if (response.success && response.data) {
        const imageDataUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        setState((prev) => ({
          ...prev,
          modelImage: imageDataUrl,
          modelMimeType: response.data!.mime_type,
          isGeneratingModel: false,
        }));
      } else {
        throw new Error(response.error || "Failed to generate model");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setState((prev) => ({
        ...prev,
        isGeneratingModel: false,
        error: errorMessage,
      }));
    }
  }, [state]);

  // ==========================================================================
  // Clothing Selection
  // ==========================================================================

  const addClothingItem = useCallback((item: ClothingItem) => {
    setState((prev) => ({
      ...prev,
      selectedClothingItems: [...prev.selectedClothingItems, item],
      error: null,
    }));
  }, []);

  const removeClothingItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      selectedClothingItems: prev.selectedClothingItems.filter((item) => item.id !== itemId),
    }));
  }, []);

  const clearClothingItems = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedClothingItems: [],
    }));
  }, []);

  // ==========================================================================
  // Generation Options
  // ==========================================================================

  const setSelectedScene = useCallback((scene: SceneOption) => {
    setState((prev) => ({
      ...prev,
      selectedScene: scene,
    }));
  }, []);

  const togglePose = useCallback((pose: PoseOption) => {
    setState((prev) => {
      const isSelected = prev.selectedPoses.includes(pose);
      let newPoses: PoseOption[];

      if (isSelected) {
        // Can't deselect if it's the only one
        if (prev.selectedPoses.length === 1) {
          return prev;
        }
        newPoses = prev.selectedPoses.filter((p) => p !== pose);
      } else {
        newPoses = [...prev.selectedPoses, pose];
      }

      return {
        ...prev,
        selectedPoses: newPoses,
      };
    });
  }, []);

  const setSelectedPantsType = useCallback((pantsType: PantsType) => {
    setState((prev) => ({
      ...prev,
      selectedPantsType: pantsType,
    }));
  }, []);

  // ==========================================================================
  // Generation
  // ==========================================================================

  const generateResults = useCallback(async (aiModelId?: string) => {
    const { modelImage, modelMimeType, selectedClothingItems, selectedScene, selectedPoses, selectedPantsType } = state;

    if (!modelImage) {
      setState((prev) => ({ ...prev, error: "Please select or generate a model first" }));
      return;
    }

    if (selectedClothingItems.length === 0) {
      setState((prev) => ({ ...prev, error: "Please select at least one clothing item" }));
      return;
    }

    // Generate all combinations: clothing × poses
    const combinations: Array<{ clothing: ClothingItem; pose: PoseOption }> = [];
    for (const clothing of selectedClothingItems) {
      for (const pose of selectedPoses) {
        combinations.push({ clothing, pose });
      }
    }

    // Create initial results
    const initialResults: ModelStudioResult[] = combinations.map(({ clothing, pose }, index) => ({
      id: `result-${Date.now()}-${index}`,
      clothingId: clothing.id,
      clothingName: clothing.name,
      pose,
      scene: selectedScene,
      pantsType: selectedPantsType,
      status: "pending" as const,
      imageDataUrl: null,
      error: null,
    }));

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      processingCount: combinations.length,
      results: initialResults,
      error: null,
    }));

    // Extract base64 from model image (data URL)
    const modelBase64 = modelImage.split(",")[1];

    // Process all combinations in parallel
    const promises = combinations.map(async ({ clothing, pose }, index) => {
      // Update status to processing
      setState((prev) => ({
        ...prev,
        results: prev.results.map((r, i) =>
          i === index ? { ...r, status: "processing" as const } : r
        ),
      }));

      try {
        const clothingBase64 = clothing.imageDataUrl.split(",")[1];

        const response = await api.dressModel({
          model_image_base64: modelBase64,
          model_mime_type: modelMimeType,
          clothing_image_base64: clothingBase64,
          clothing_mime_type: clothing.mimeType,
          scene: selectedScene,
          pose,
          pants_type: selectedPantsType,
        }, aiModelId);

        if (response.success && response.data) {
          const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
          return {
            index,
            status: "fulfilled" as const,
            imageDataUrl: resultUrl,
            error: null,
          };
        } else {
          throw new Error(response.error || "Failed to generate image");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          index,
          status: "rejected" as const,
          imageDataUrl: null,
          error: errorMessage,
        };
      }
    });

    // Wait for all to complete
    const settledResults = await Promise.allSettled(promises);

    // Update results
    setState((prev) => {
      const newResults = [...prev.results];
      
      settledResults.forEach((settled) => {
        if (settled.status === "fulfilled") {
          const { index, status, imageDataUrl, error } = settled.value;
          newResults[index] = {
            ...newResults[index],
            status,
            imageDataUrl,
            error,
          };
        } else {
          // Promise rejected (shouldn't happen with our try/catch)
          console.error("Unexpected promise rejection:", settled.reason);
        }
      });

      return {
        ...prev,
        isProcessing: false,
        processingCount: 0,
        results: newResults,
      };
    });
  }, [state]);

  const retryResult = useCallback(async (resultId: string, aiModelId?: string) => {
    const result = state.results.find((r) => r.id === resultId);
    if (!result || !state.modelImage) return;

    const clothing = state.selectedClothingItems.find((c) => c.id === result.clothingId);
    if (!clothing) return;

    // Update status
    setState((prev) => ({
      ...prev,
      results: prev.results.map((r) =>
        r.id === resultId ? { ...r, status: "processing" as const, error: null } : r
      ),
    }));

    try {
      const modelBase64 = state.modelImage.split(",")[1];
      const clothingBase64 = clothing.imageDataUrl.split(",")[1];

      const response = await api.dressModel({
        model_image_base64: modelBase64,
        model_mime_type: state.modelMimeType,
        clothing_image_base64: clothingBase64,
        clothing_mime_type: clothing.mimeType,
        scene: result.scene,
        pose: result.pose,
        pants_type: result.pantsType,
      }, aiModelId);

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        setState((prev) => ({
          ...prev,
          results: prev.results.map((r) =>
            r.id === resultId ? { ...r, status: "fulfilled", imageDataUrl: resultUrl, error: null } : r
          ),
        }));
      } else {
        throw new Error(response.error || "Failed to retry");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        results: prev.results.map((r) =>
          r.id === resultId ? { ...r, status: "rejected", error: errorMessage } : r
        ),
      }));
    }
  }, [state]);

  // ==========================================================================
  // Download / Save
  // ==========================================================================

  const downloadResult = useCallback((result: ModelStudioResult) => {
    if (!result.imageDataUrl) return;
    
    const link = document.createElement("a");
    link.download = `model-${result.clothingName}-${result.pose}-${Date.now()}.png`;
    link.href = result.imageDataUrl;
    link.click();
  }, []);

  const downloadAllResults = useCallback(() => {
    const successfulResults = state.results.filter((r) => r.status === "fulfilled" && r.imageDataUrl);
    
    successfulResults.forEach((result, index) => {
      setTimeout(() => {
        downloadResult(result);
      }, index * 300); // Stagger downloads
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
    // Model selection
    setModelSource,
    setModelImage,
    clearModelImage,
    setModelGenerationOptions,
    generateModel,
    // Clothing selection
    addClothingItem,
    removeClothingItem,
    clearClothingItems,
    // Options
    setSelectedScene,
    togglePose,
    setSelectedPantsType,
    // Generation
    generateResults,
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

