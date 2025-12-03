"use client";

import { useState, useCallback } from "react";
import type {
  MockupEditorState,
  LogoPosition,
  ProductTemplate,
  ColorOption,
  MockupResult,
} from "@/types/mockup";
import { DEFAULT_LOGO_POSITION, PRESET_COLORS } from "@/types/mockup";
import * as api from "@/lib/api";
import { generateId } from "@/lib/utils";

const initialState: MockupEditorState = {
  productImage: null,
  productMimeType: "image/png",
  logoImage: null,
  logoMimeType: "image/png",
  logoPosition: DEFAULT_LOGO_POSITION,
  selectedColors: [],
  results: [],
  isProcessing: false,
  processingCount: 0,
  error: null,
  selectedTemplate: null,
};

export function useMockupEditor() {
  const [state, setState] = useState<MockupEditorState>(initialState);

  /**
   * Set product image from user upload or gallery
   */
  const setProductImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState((prev) => ({
      ...prev,
      productImage: imageDataUrl,
      productMimeType: mimeType,
      selectedTemplate: null,
      results: [], // Clear results when product changes
      error: null,
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
      results: [],
      error: null,
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
      results: [], // Clear results when logo changes
      error: null,
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
      results: [],
      error: null,
    }));
  }, []);

  /**
   * Update logo position (x, y, scale, rotation)
   */
  const updateLogoPosition = useCallback((updates: Partial<LogoPosition>) => {
    setState((prev) => ({
      ...prev,
      logoPosition: { ...prev.logoPosition, ...updates },
      results: [], // Clear results when position changes
    }));
  }, []);

  /**
   * Reset logo position to center
   */
  const resetLogoPosition = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logoPosition: DEFAULT_LOGO_POSITION,
      results: [],
    }));
  }, []);

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
   * Generate mockups for all selected colors in parallel
   */
  const generateMockups = useCallback(async (modelId?: string) => {
    if (!state.productImage || !state.logoImage) {
      setState((prev) => ({
        ...prev,
        error: "Please upload both product image and logo",
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

    // Extract base64 data from data URLs
    const productBase64 = state.productImage.split(",")[1];
    const logoBase64 = state.logoImage.split(",")[1];

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

    // Generate all mockups in parallel
    const promises = state.selectedColors.map(async (color, index) => {
      try {
        // Update status to processing
        setState((prev) => ({
          ...prev,
          results: prev.results.map((r, i) =>
            i === index ? { ...r, status: "processing" as const } : r
          ),
        }));

        const response = await api.generateMockup(
          productBase64,
          state.productMimeType,
          logoBase64,
          state.logoMimeType,
          state.logoPosition,
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
          throw new Error(response.error || "Failed to generate mockup");
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
  }, [state.productImage, state.logoImage, state.productMimeType, state.logoMimeType, state.logoPosition, state.selectedColors]);

  /**
   * Retry generating a single color mockup
   */
  const retryMockup = useCallback(async (colorHex: string, modelId?: string) => {
    if (!state.productImage || !state.logoImage) return;

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
      const productBase64 = state.productImage.split(",")[1];
      const logoBase64 = state.logoImage.split(",")[1];

      const response = await api.generateMockup(
        productBase64,
        state.productMimeType,
        logoBase64,
        state.logoMimeType,
        state.logoPosition,
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
        throw new Error(response.error || "Failed to generate mockup");
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
  }, [state.productImage, state.logoImage, state.productMimeType, state.logoMimeType, state.logoPosition, state.selectedColors, state.results]);

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
    setProductImage,
    clearProductImage,
    setLogoImage,
    clearLogoImage,
    updateLogoPosition,
    resetLogoPosition,
    setSelectedColors,
    generateMockups,
    retryMockup,
    downloadMockup,
    downloadAllMockups,
    resetEditor,
    clearError,
    clearResults,
  };
}
