"use client";

import { useState, useCallback } from "react";
import type {
  MockupEditorState,
  LogoPosition,
  ColorOption,
  MockupResult,
  MockupPhase,
} from "@/types/mockup";
import { DEFAULT_LOGO_POSITION } from "@/types/mockup";
import * as api from "@/lib/api";
import { generateId } from "@/lib/utils";

const initialState: MockupEditorState = {
  // Phase tracking
  phase: "compose",
  
  // Phase 1: Compose
  productImage: null,
  productMimeType: "image/png",
  logoImage: null,
  logoMimeType: "image/png",
  logoPosition: DEFAULT_LOGO_POSITION,
  firstMockup: null,
  firstMockupMimeType: "image/png",
  
  // Phase 2: Recolor
  confirmedMockup: null,
  confirmedMockupMimeType: "image/png",
  selectedColors: [],
  results: [],
  
  // Processing state
  isProcessing: false,
  processingCount: 0,
  error: null,
  
  // Legacy
  selectedTemplate: null,
};

export function useMockupEditor() {
  const [state, setState] = useState<MockupEditorState>(initialState);

  // ===========================================================================
  // Phase 1: Compose - Image Selection
  // ===========================================================================

  /**
   * Set product image from user upload or gallery
   */
  const setProductImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState((prev) => ({
      ...prev,
      productImage: imageDataUrl,
      productMimeType: mimeType,
      selectedTemplate: null,
      // Reset subsequent states
      firstMockup: null,
      confirmedMockup: null,
      results: [],
      error: null,
      phase: "compose",
    }));
  }, []);

  /**
   * Clear product image
   */
  const clearProductImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      productImage: null,
      productMimeType: "image/png",
      selectedTemplate: null,
      firstMockup: null,
      confirmedMockup: null,
      results: [],
      error: null,
      phase: "compose",
    }));
  }, []);

  /**
   * Set logo image from user upload or gallery
   */
  const setLogoImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState((prev) => ({
      ...prev,
      logoImage: imageDataUrl,
      logoMimeType: mimeType,
      // Reset subsequent states
      firstMockup: null,
      confirmedMockup: null,
      results: [],
      error: null,
      phase: "compose",
    }));
  }, []);

  /**
   * Clear logo image
   */
  const clearLogoImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logoImage: null,
      logoMimeType: "image/png",
      logoPosition: DEFAULT_LOGO_POSITION,
      firstMockup: null,
      confirmedMockup: null,
      results: [],
      error: null,
      phase: "compose",
    }));
  }, []);

  /**
   * Update logo position (x, y, scale, rotation)
   */
  const updateLogoPosition = useCallback((updates: Partial<LogoPosition>) => {
    setState((prev) => ({
      ...prev,
      logoPosition: { ...prev.logoPosition, ...updates },
      // Clear first mockup when position changes (need to regenerate)
      firstMockup: null,
    }));
  }, []);

  /**
   * Reset logo position to center
   */
  const resetLogoPosition = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logoPosition: DEFAULT_LOGO_POSITION,
      firstMockup: null,
    }));
  }, []);

  // ===========================================================================
  // Phase 1: Compose - Generate First Mockup
  // ===========================================================================

  /**
   * Generate the first mockup (Phase 1) - logo compositing without color change
   */
  const generateFirstMockup = useCallback(async (modelId?: string) => {
    if (!state.productImage || !state.logoImage) {
      setState((prev) => ({
        ...prev,
        error: "Please upload both product image and logo",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
      firstMockup: null,
    }));

    try {
      // Extract base64 data from data URLs
      const productBase64 = state.productImage.split(",")[1];
      const logoBase64 = state.logoImage.split(",")[1];

      const response = await api.generateMockup(
        productBase64,
        state.productMimeType,
        logoBase64,
        state.logoMimeType,
        state.logoPosition,
        undefined, // No color change for first mockup
        modelId
      );

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          firstMockup: resultUrl,
          firstMockupMimeType: response.data!.mime_type,
          error: null,
        }));
      } else {
        throw new Error(response.error || "Failed to generate mockup");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [state.productImage, state.logoImage, state.productMimeType, state.logoMimeType, state.logoPosition]);

  // ===========================================================================
  // Transition: Confirm and Move to Phase 2
  // ===========================================================================

  /**
   * Confirm the first mockup and transition to Phase 2 (Recolor)
   */
  const confirmMockup = useCallback(() => {
    if (!state.firstMockup) {
      setState((prev) => ({
        ...prev,
        error: "No mockup to confirm. Please generate a mockup first.",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      phase: "recolor",
      confirmedMockup: prev.firstMockup,
      confirmedMockupMimeType: prev.firstMockupMimeType,
      selectedColors: [],
      results: [],
      error: null,
    }));
  }, [state.firstMockup]);

  /**
   * Go back to Phase 1 to adjust logo position
   */
  const goBackToCompose = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "compose",
      confirmedMockup: null,
      selectedColors: [],
      results: [],
      error: null,
    }));
  }, []);

  // ===========================================================================
  // Phase 2: Recolor - Color Selection
  // ===========================================================================

  /**
   * Update selected colors
   */
  const setSelectedColors = useCallback((colors: ColorOption[]) => {
    setState((prev) => ({
      ...prev,
      selectedColors: colors,
      results: [], // Clear results when colors change
    }));
  }, []);

  /**
   * Add a single color to selection
   */
  const addSelectedColor = useCallback((color: ColorOption) => {
    setState((prev) => {
      if (prev.selectedColors.some((c) => c.hex === color.hex)) {
        return prev; // Already selected
      }
      return {
        ...prev,
        selectedColors: [...prev.selectedColors, color],
        results: [],
      };
    });
  }, []);

  /**
   * Remove a single color from selection
   */
  const removeSelectedColor = useCallback((colorHex: string) => {
    setState((prev) => ({
      ...prev,
      selectedColors: prev.selectedColors.filter((c) => c.hex !== colorHex),
      results: [],
    }));
  }, []);

  // ===========================================================================
  // Phase 2: Recolor - Batch Generation
  // ===========================================================================

  /**
   * Generate color variants using the recolor API (Phase 2)
   * This is more efficient than regenerating the full mockup
   */
  const generateColorVariants = useCallback(async (modelId?: string) => {
    if (!state.confirmedMockup) {
      setState((prev) => ({
        ...prev,
        error: "No confirmed mockup. Please confirm a mockup first.",
      }));
      return;
    }

    if (state.selectedColors.length === 0) {
      setState((prev) => ({
        ...prev,
        error: "Please select at least one color",
      }));
      return;
    }

    // Extract base64 from confirmed mockup
    const mockupBase64 = state.confirmedMockup.split(",")[1];

    // Initialize results with pending status
    const initialResults: MockupResult[] = state.selectedColors.map((color) => ({
      id: generateId(),
      color: color.hex,
      colorName: color.name,
      status: "pending" as const,
      imageDataUrl: null,
      error: null,
    }));

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      processingCount: state.selectedColors.length,
      results: initialResults,
      error: null,
    }));

    // Generate all color variants in parallel using recolor API
    const promises = state.selectedColors.map(async (color, index) => {
      try {
        // Update status to processing
        setState((prev) => ({
          ...prev,
          results: prev.results.map((r, i) =>
            i === index ? { ...r, status: "processing" as const } : r
          ),
        }));

        // Use the recolor API instead of generate - more efficient!
        const response = await api.recolorMockup(
          mockupBase64,
          state.confirmedMockupMimeType,
          color.hex,
          modelId
        );

        if (response.success && response.data) {
          const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
          
          // Update with success
          setState((prev) => ({
            ...prev,
            processingCount: Math.max(0, prev.processingCount - 1),
            results: prev.results.map((r, i) =>
              i === index
                ? { ...r, status: "fulfilled" as const, imageDataUrl: resultUrl }
                : r
            ),
          }));
        } else {
          throw new Error(response.error || "Failed to recolor mockup");
        }
      } catch (error) {
        // Update with error
        setState((prev) => ({
          ...prev,
          processingCount: Math.max(0, prev.processingCount - 1),
          results: prev.results.map((r, i) =>
            i === index
              ? {
                  ...r,
                  status: "rejected" as const,
                  error: error instanceof Error ? error.message : "Unknown error",
                }
              : r
          ),
        }));
      }
    });

    // Wait for all to complete
    await Promise.allSettled(promises);

    setState((prev) => ({
      ...prev,
      isProcessing: false,
      processingCount: 0,
    }));
  }, [state.confirmedMockup, state.confirmedMockupMimeType, state.selectedColors]);

  /**
   * Retry recoloring a single color mockup
   */
  const retryMockup = useCallback(async (colorHex: string, modelId?: string) => {
    if (!state.confirmedMockup) return;

    const color = state.selectedColors.find((c) => c.hex === colorHex);
    if (!color) return;

    const resultIndex = state.results.findIndex((r) => r.color === colorHex);
    if (resultIndex === -1) return;

    // Update status to processing
    setState((prev) => ({
      ...prev,
      processingCount: prev.processingCount + 1,
      results: prev.results.map((r, i) =>
        i === resultIndex ? { ...r, status: "processing" as const, error: null } : r
      ),
    }));

    try {
      const mockupBase64 = state.confirmedMockup.split(",")[1];

      const response = await api.recolorMockup(
        mockupBase64,
        state.confirmedMockupMimeType,
        colorHex,
        modelId
      );

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        
        setState((prev) => ({
          ...prev,
          processingCount: Math.max(0, prev.processingCount - 1),
          results: prev.results.map((r, i) =>
            i === resultIndex
              ? { ...r, status: "fulfilled" as const, imageDataUrl: resultUrl }
              : r
          ),
        }));
      } else {
        throw new Error(response.error || "Failed to recolor mockup");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        processingCount: Math.max(0, prev.processingCount - 1),
        results: prev.results.map((r, i) =>
          i === resultIndex
            ? {
                ...r,
                status: "rejected" as const,
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : r
        ),
      }));
    }
  }, [state.confirmedMockup, state.confirmedMockupMimeType, state.selectedColors, state.results]);

  // ===========================================================================
  // Download Utilities
  // ===========================================================================

  /**
   * Download a single mockup result
   */
  const downloadMockup = useCallback((result: MockupResult) => {
    if (!result.imageDataUrl) return;

    const link = document.createElement("a");
    link.download = `mockup-${result.colorName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = result.imageDataUrl;
    link.click();
  }, []);

  /**
   * Download all successful mockups
   */
  const downloadAllMockups = useCallback(() => {
    const successfulResults = state.results.filter(
      (r) => r.status === "fulfilled" && r.imageDataUrl
    );

    successfulResults.forEach((result, index) => {
      setTimeout(() => {
        downloadMockup(result);
      }, index * 200); // Stagger downloads
    });
  }, [state.results, downloadMockup]);

  /**
   * Download the confirmed mockup (base version)
   */
  const downloadConfirmedMockup = useCallback(() => {
    if (!state.confirmedMockup) return;

    const link = document.createElement("a");
    link.download = "mockup-base.png";
    link.href = state.confirmedMockup;
    link.click();
  }, [state.confirmedMockup]);

  // ===========================================================================
  // Reset Utilities
  // ===========================================================================

  /**
   * Reset entire editor
   */
  const resetEditor = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: [] }));
  }, []);

  return {
    state,
    // Phase 1: Compose
    setProductImage,
    clearProductImage,
    setLogoImage,
    clearLogoImage,
    updateLogoPosition,
    resetLogoPosition,
    generateFirstMockup,
    // Phase transition
    confirmMockup,
    goBackToCompose,
    // Phase 2: Recolor
    setSelectedColors,
    addSelectedColor,
    removeSelectedColor,
    generateColorVariants,
    retryMockup,
    // Downloads
    downloadMockup,
    downloadAllMockups,
    downloadConfirmedMockup,
    // Utils
    resetEditor,
    clearError,
    clearResults,
  };
}
