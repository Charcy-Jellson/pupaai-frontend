"use client";

import { useState, useCallback } from "react";
import type {
  MockupEditorState,
  LogoPosition,
  ProductTemplate,
  MockupGenerateResponse,
} from "@/types/mockup";
import { DEFAULT_LOGO_POSITION } from "@/types/mockup";
import * as api from "@/lib/api";

const initialState: MockupEditorState = {
  productImage: null,
  productMimeType: "image/png",
  logoImage: null,
  logoMimeType: "image/png",
  logoPosition: DEFAULT_LOGO_POSITION,
  generatedMockup: null,
  isProcessing: false,
  error: null,
  selectedTemplate: null,
};

export function useMockupEditor() {
  const [state, setState] = useState<MockupEditorState>(initialState);

  /**
   * Set product image from a template
   */
  const selectTemplate = useCallback(async (template: ProductTemplate) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Fetch the template image and convert to data URL
      const response = await fetch(template.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      setState((prev) => ({
        ...prev,
        productImage: dataUrl,
        productMimeType: blob.type || "image/png",
        selectedTemplate: template,
        generatedMockup: null,
        isProcessing: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: "Failed to load template image",
      }));
    }
  }, []);

  /**
   * Set product image from user upload
   */
  const setProductImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState((prev) => ({
      ...prev,
      productImage: imageDataUrl,
      productMimeType: mimeType,
      selectedTemplate: null,
      generatedMockup: null,
      error: null,
    }));
  }, []);

  /**
   * Set logo image from user upload
   */
  const setLogoImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState((prev) => ({
      ...prev,
      logoImage: imageDataUrl,
      logoMimeType: mimeType,
      generatedMockup: null,
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
      generatedMockup: null, // Clear generated mockup when position changes
    }));
  }, []);

  /**
   * Reset logo position to center
   */
  const resetLogoPosition = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logoPosition: DEFAULT_LOGO_POSITION,
      generatedMockup: null,
    }));
  }, []);

  /**
   * Generate mockup using AI
   */
  const generateMockup = useCallback(async (modelId?: string) => {
    if (!state.productImage || !state.logoImage) {
      setState((prev) => ({
        ...prev,
        error: "Please upload both product image and logo",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

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
        modelId
      );

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        setState((prev) => ({
          ...prev,
          generatedMockup: resultUrl,
          isProcessing: false,
        }));
      } else {
        throw new Error(response.error || "Failed to generate mockup");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : "Failed to generate mockup",
      }));
    }
  }, [state.productImage, state.logoImage, state.productMimeType, state.logoMimeType, state.logoPosition]);

  /**
   * Download the generated mockup
   */
  const downloadMockup = useCallback((filename: string = "product-mockup") => {
    const imageToDownload = state.generatedMockup || state.productImage;
    if (!imageToDownload) return;

    const link = document.createElement("a");
    const extension = state.generatedMockup 
      ? state.productMimeType.split("/")[1] 
      : state.productMimeType.split("/")[1];
    link.download = `${filename}.${extension}`;
    link.href = imageToDownload;
    link.click();
  }, [state.generatedMockup, state.productImage, state.productMimeType]);

  /**
   * Clear logo
   */
  const clearLogo = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logoImage: null,
      logoMimeType: "image/png",
      logoPosition: DEFAULT_LOGO_POSITION,
      generatedMockup: null,
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
      generatedMockup: null,
      error: null,
    }));
  }, []);

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

  return {
    state,
    selectTemplate,
    setProductImage,
    setLogoImage,
    updateLogoPosition,
    resetLogoPosition,
    generateMockup,
    downloadMockup,
    clearLogo,
    clearProductImage,
    resetEditor,
    clearError,
  };
}

