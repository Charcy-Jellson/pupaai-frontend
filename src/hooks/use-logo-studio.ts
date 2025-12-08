"use client";

import { useState, useCallback } from "react";
import {
  LogoStudioState,
  LogoStyle,
  LogoHistoryItem,
  DEFAULT_LOGO_STUDIO_STATE,
} from "@/types/logo-studio";
import { generateLogo, editLogo } from "@/lib/api";

/**
 * Hook for managing Logo Studio state and operations
 */
export function useLogoStudio() {
  const [state, setState] = useState<LogoStudioState>(DEFAULT_LOGO_STUDIO_STATE);

  // =========================================================================
  // State Setters
  // =========================================================================

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setSelectedStyle = useCallback((style: LogoStyle | null) => {
    setState((prev) => ({ ...prev, selectedStyle: style }));
  }, []);

  const setSelectedColors = useCallback((colors: string[]) => {
    setState((prev) => ({ ...prev, selectedColors: colors }));
  }, []);

  const toggleColor = useCallback((color: string) => {
    setState((prev) => {
      const colors = prev.selectedColors.includes(color)
        ? prev.selectedColors.filter((c) => c !== color)
        : [...prev.selectedColors, color];
      return { ...prev, selectedColors: colors };
    });
  }, []);

  const setEditInstruction = useCallback((instruction: string) => {
    setState((prev) => ({ ...prev, editInstruction: instruction }));
  }, []);

  const setCurrentLogo = useCallback((logo: string | null, mimeType: string = "image/png") => {
    setState((prev) => ({
      ...prev,
      currentLogo: logo,
      currentMimeType: mimeType,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // =========================================================================
  // Logo Operations
  // =========================================================================

  /**
   * Generate a new logo from description
   */
  const handleGenerateLogo = useCallback(async () => {
    if (!state.description.trim()) {
      setState((prev) => ({ ...prev, error: "Please enter a description" }));
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const result = await generateLogo({
        description: state.description,
        style: state.selectedStyle || undefined,
        colors: state.selectedColors.length > 0 ? state.selectedColors : undefined,
      });

      if (result.success && result.data) {
        const dataUrl = `data:${result.data.mime_type};base64,${result.data.image_base64}`;
        
        // Add to history
        const historyItem: LogoHistoryItem = {
          id: crypto.randomUUID(),
          imageDataUrl: dataUrl,
          description: state.description,
          timestamp: Date.now(),
          type: "generated",
        };

        setState((prev) => ({
          ...prev,
          currentLogo: dataUrl,
          currentMimeType: result.data!.mime_type,
          isGenerating: false,
          history: [historyItem, ...prev.history],
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: result.error || "Failed to generate logo",
        }));
      }
    } catch (error) {
      console.error("Error generating logo:", error);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: "Failed to generate logo. Please try again.",
      }));
    }
  }, [state.description, state.selectedStyle, state.selectedColors]);

  /**
   * Edit the current logo based on instruction
   */
  const handleEditLogo = useCallback(async () => {
    if (!state.currentLogo) {
      setState((prev) => ({ ...prev, error: "No logo to edit" }));
      return;
    }

    if (!state.editInstruction.trim()) {
      setState((prev) => ({ ...prev, error: "Please enter an edit instruction" }));
      return;
    }

    setState((prev) => ({ ...prev, isEditing: true, error: null }));

    try {
      // Extract base64 from data URL
      const base64 = state.currentLogo.split(",")[1];

      const result = await editLogo({
        image_base64: base64,
        mime_type: state.currentMimeType,
        instruction: state.editInstruction,
      });

      if (result.success && result.data) {
        const dataUrl = `data:${result.data.mime_type};base64,${result.data.image_base64}`;
        
        // Add to history
        const historyItem: LogoHistoryItem = {
          id: crypto.randomUUID(),
          imageDataUrl: dataUrl,
          instruction: state.editInstruction,
          timestamp: Date.now(),
          type: "edited",
        };

        setState((prev) => ({
          ...prev,
          currentLogo: dataUrl,
          currentMimeType: result.data!.mime_type,
          isEditing: false,
          editInstruction: "",
          history: [historyItem, ...prev.history],
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isEditing: false,
          error: result.error || "Failed to edit logo",
        }));
      }
    } catch (error) {
      console.error("Error editing logo:", error);
      setState((prev) => ({
        ...prev,
        isEditing: false,
        error: "Failed to edit logo. Please try again.",
      }));
    }
  }, [state.currentLogo, state.currentMimeType, state.editInstruction]);

  /**
   * Load a logo from history
   */
  const loadFromHistory = useCallback((item: LogoHistoryItem) => {
    setState((prev) => ({
      ...prev,
      currentLogo: item.imageDataUrl,
      currentMimeType: "image/png",
      description: item.description || prev.description,
    }));
  }, []);

  /**
   * Clear history item
   */
  const removeFromHistory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((item) => item.id !== id),
    }));
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
  }, []);

  /**
   * Download the current logo
   */
  const downloadLogo = useCallback(() => {
    if (!state.currentLogo) return;

    const link = document.createElement("a");
    link.href = state.currentLogo;
    link.download = `logo-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.currentLogo]);

  /**
   * Reset the entire state
   */
  const reset = useCallback(() => {
    setState(DEFAULT_LOGO_STUDIO_STATE);
  }, []);

  return {
    state,
    // Setters
    setDescription,
    setSelectedStyle,
    setSelectedColors,
    toggleColor,
    setEditInstruction,
    setCurrentLogo,
    clearError,
    // Operations
    handleGenerateLogo,
    handleEditLogo,
    loadFromHistory,
    removeFromHistory,
    clearHistory,
    downloadLogo,
    reset,
  };
}

