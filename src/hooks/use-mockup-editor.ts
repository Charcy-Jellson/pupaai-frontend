"use client";

import { useState, useCallback } from "react";
import type {
  MockupEditorState,
  LogoPosition,
  ColorOption,
  MockupResult,
  ProductItem,
} from "@/types/mockup";
import { DEFAULT_LOGO_POSITION, MAX_CONCURRENT_REQUESTS } from "@/types/mockup";
import * as api from "@/lib/api";
import { generateId } from "@/lib/utils";

const initialState: MockupEditorState = {
  // Phase tracking
  phase: "compose",
  
  // Multi-product support
  products: [],
  activeProductId: null,
  
  // Logo (shared)
  logoImage: null,
  logoMimeType: "image/png",
  
  // Color variants
  selectedColors: [],
  
  // Processing state
  isProcessing: false,
  processingCount: 0,
  totalToProcess: 0,
  error: null,
  
  // Legacy support
  productImage: null,
  productMimeType: "image/png",
  logoPosition: DEFAULT_LOGO_POSITION,
  firstMockup: null,
  firstMockupMimeType: "image/png",
  confirmedMockup: null,
  confirmedMockupMimeType: "image/png",
  results: [],
  selectedTemplate: null,
};

/**
 * Helper function to run tasks with concurrency limit
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then((result) => {
      results.push(result);
    });
    executing.push(p as unknown as Promise<void>);

    if (executing.length >= limit) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        // Check if promise is settled by racing with resolved promise
        const isSettled = await Promise.race([
          executing[i].then(() => true).catch(() => true),
          Promise.resolve(false),
        ]);
        if (isSettled) {
          executing.splice(i, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}

export function useMockupEditor(getToken: () => Promise<string | null>) {
  const [state, setState] = useState<MockupEditorState>(initialState);

  // ===========================================================================
  // Multi-Product Management
  // ===========================================================================

  /**
   * Add multiple products at once
   */
  const addProducts = useCallback((images: { dataUrl: string; mimeType: string }[]) => {
    const newProducts: ProductItem[] = images.map((img) => ({
      id: generateId(),
      image: img.dataUrl,
      mimeType: img.mimeType,
      logoPosition: { ...DEFAULT_LOGO_POSITION },
      preview: null,
      previewStatus: "idle" as const,
      previewError: null,
      selected: false,
      variants: [],
    }));

    setState((prev) => {
      const updatedProducts = [...prev.products, ...newProducts];
      return {
        ...prev,
        products: updatedProducts,
        activeProductId: prev.activeProductId || (newProducts[0]?.id ?? null),
        phase: "compose",
        error: null,
      };
    });
  }, []);

  /**
   * Add a single product
   */
  const addProduct = useCallback((dataUrl: string, mimeType: string) => {
    addProducts([{ dataUrl, mimeType }]);
  }, [addProducts]);

  /**
   * Remove a product by ID
   */
  const removeProduct = useCallback((productId: string) => {
    setState((prev) => {
      const updatedProducts = prev.products.filter((p) => p.id !== productId);
      let newActiveId = prev.activeProductId;
      
      if (prev.activeProductId === productId) {
        newActiveId = updatedProducts[0]?.id ?? null;
      }
      
      return {
        ...prev,
        products: updatedProducts,
        activeProductId: newActiveId,
      };
    });
  }, []);

  /**
   * Clear all products
   */
  const clearAllProducts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      products: [],
      activeProductId: null,
      phase: "compose",
    }));
  }, []);

  /**
   * Set active product for editing
   */
  const setActiveProduct = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      activeProductId: productId,
    }));
  }, []);

  /**
   * Toggle product selection for batch operations
   */
  const toggleProductSelection = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, selected: !p.selected } : p
      ),
    }));
  }, []);

  /**
   * Select all products
   */
  const selectAllProducts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => ({ ...p, selected: true })),
    }));
  }, []);

  /**
   * Deselect all products
   */
  const deselectAllProducts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => ({ ...p, selected: false })),
    }));
  }, []);

  /**
   * Update logo position for a specific product
   */
  const updateProductLogoPosition = useCallback((productId: string, updates: Partial<LogoPosition>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              logoPosition: { ...p.logoPosition, ...updates },
              preview: null, // Clear preview when position changes
              previewStatus: "idle" as const,
            }
          : p
      ),
    }));
  }, []);

  /**
   * Reset logo position for a specific product
   */
  const resetProductLogoPosition = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              logoPosition: { ...DEFAULT_LOGO_POSITION },
              preview: null,
              previewStatus: "idle" as const,
            }
          : p
      ),
    }));
  }, []);

  /**
   * Clear preview for a specific product (for re-editing)
   */
  const clearProductPreview = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              preview: null,
              previewStatus: "idle" as const,
              previewError: null,
            }
          : p
      ),
    }));
  }, []);

  // ===========================================================================
  // Logo Management (Shared)
  // ===========================================================================

  /**
   * Set logo image (shared across all products)
   */
  const setLogoImage = useCallback((imageDataUrl: string, mimeType: string) => {
    setState((prev) => ({
      ...prev,
      logoImage: imageDataUrl,
      logoMimeType: mimeType,
      // Reset all product previews
      products: prev.products.map((p) => ({
        ...p,
        preview: null,
        previewStatus: "idle" as const,
        variants: [],
      })),
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
      products: prev.products.map((p) => ({
        ...p,
        preview: null,
        previewStatus: "idle" as const,
        variants: [],
      })),
      error: null,
    }));
  }, []);

  // ===========================================================================
  // Generate Previews (Batch with Concurrency Control)
  // ===========================================================================

  /**
   * Generate previews for all products with logo
   */
  const generateAllPreviews = useCallback(async (modelId?: string) => {
    if (state.products.length === 0) {
      setState((prev) => ({ ...prev, error: "Please add at least one product image" }));
      return;
    }

    if (!state.logoImage) {
      setState((prev) => ({ ...prev, error: "Please upload a logo" }));
      return;
    }

    const logoBase64 = state.logoImage.split(",")[1];
    const productsToProcess = state.products.filter((p) => p.previewStatus !== "fulfilled");

    if (productsToProcess.length === 0) {
      setState((prev) => ({ ...prev, error: "All previews already generated" }));
      return;
    }

    // Set all to pending
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      processingCount: 0,
      totalToProcess: productsToProcess.length,
      error: null,
      products: prev.products.map((p) =>
        productsToProcess.find((pp) => pp.id === p.id)
          ? { ...p, previewStatus: "pending" as const, previewError: null }
          : p
      ),
    }));

    // Create tasks with concurrency control
    const tasks = productsToProcess.map((product) => async () => {
      // Set to processing
      setState((prev) => ({
        ...prev,
        processingCount: prev.processingCount + 1,
        products: prev.products.map((p) =>
          p.id === product.id ? { ...p, previewStatus: "processing" as const } : p
        ),
      }));

      try {
        const productBase64 = product.image.split(",")[1];
        const authToken = await getToken() || undefined;

        const response = await api.generateMockup(
          productBase64,
          product.mimeType,
          logoBase64,
          state.logoMimeType,
          product.logoPosition,
          undefined,
          modelId,
          authToken
        );

        if (response.success && response.data) {
          const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
          
          setState((prev) => ({
            ...prev,
            processingCount: Math.max(0, prev.processingCount - 1),
            products: prev.products.map((p) =>
              p.id === product.id
                ? { ...p, preview: resultUrl, previewStatus: "fulfilled" as const }
                : p
            ),
          }));
        } else {
          throw new Error(response.error || "Failed to generate mockup");
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          processingCount: Math.max(0, prev.processingCount - 1),
          products: prev.products.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  previewStatus: "rejected" as const,
                  previewError: error instanceof Error ? error.message : "Unknown error",
                }
              : p
          ),
        }));
      }
    });

    // Run with concurrency limit
    await runWithConcurrency(tasks, MAX_CONCURRENT_REQUESTS);

    setState((prev) => ({
      ...prev,
      isProcessing: false,
      processingCount: 0,
      phase: "preview",
    }));
  }, [state.products, state.logoImage, state.logoMimeType, getToken]);

  /**
   * Regenerate preview for a single product
   */
  const regenerateProductPreview = useCallback(async (productId: string, modelId?: string) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product || !state.logoImage) return;

    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? { ...p, previewStatus: "processing" as const, previewError: null }
          : p
      ),
    }));

    try {
      const productBase64 = product.image.split(",")[1];
      const logoBase64 = state.logoImage.split(",")[1];
      const authToken = await getToken() || undefined;

      const response = await api.generateMockup(
        productBase64,
        product.mimeType,
        logoBase64,
        state.logoMimeType,
        product.logoPosition,
        undefined,
        modelId,
        authToken
      );

      if (response.success && response.data) {
        const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
        
        setState((prev) => ({
          ...prev,
          products: prev.products.map((p) =>
            p.id === productId
              ? { ...p, preview: resultUrl, previewStatus: "fulfilled" as const }
              : p
          ),
        }));
      } else {
        throw new Error(response.error || "Failed to generate mockup");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId
            ? {
                ...p,
                previewStatus: "rejected" as const,
                previewError: error instanceof Error ? error.message : "Unknown error",
              }
            : p
        ),
      }));
    }
  }, [state.products, state.logoImage, state.logoMimeType, getToken]);

  // ===========================================================================
  // Color Variants (Batch with Concurrency Control)
  // ===========================================================================

  /**
   * Set selected colors
   */
  const setSelectedColors = useCallback((colors: ColorOption[]) => {
    setState((prev) => ({
      ...prev,
      selectedColors: colors,
      // Clear variants when colors change
      products: prev.products.map((p) => ({ ...p, variants: [] })),
    }));
  }, []);

  /**
   * Generate color variants for selected products
   */
  const generateColorVariants = useCallback(async (modelId?: string) => {
    const selectedProducts = state.products.filter((p) => p.selected && p.preview);
    
    if (selectedProducts.length === 0) {
      setState((prev) => ({ ...prev, error: "Please select at least one product with preview" }));
      return;
    }

    if (state.selectedColors.length === 0) {
      setState((prev) => ({ ...prev, error: "Please select at least one color" }));
      return;
    }

    // Total tasks = products × colors
    const totalTasks = selectedProducts.length * state.selectedColors.length;

    // Initialize variants for each selected product
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      processingCount: 0,
      totalToProcess: totalTasks,
      error: null,
      phase: "recolor",
      products: prev.products.map((p) => {
        if (!p.selected || !p.preview) return p;
        
        const initialVariants: MockupResult[] = state.selectedColors.map((color) => ({
          id: generateId(),
          color: color.hex,
          colorName: color.name,
          status: "pending" as const,
          imageDataUrl: null,
          error: null,
        }));
        
        return { ...p, variants: initialVariants };
      }),
    }));

    // Create all tasks
    const tasks: (() => Promise<void>)[] = [];

    for (const product of selectedProducts) {
      const mockupBase64 = product.preview!.split(",")[1];

      for (let colorIndex = 0; colorIndex < state.selectedColors.length; colorIndex++) {
        const color = state.selectedColors[colorIndex];

        tasks.push(async () => {
          // Set to processing
          setState((prev) => ({
            ...prev,
            processingCount: prev.processingCount + 1,
            products: prev.products.map((p) => {
              if (p.id !== product.id) return p;
              return {
                ...p,
                variants: p.variants.map((v, i) =>
                  i === colorIndex ? { ...v, status: "processing" as const } : v
                ),
              };
            }),
          }));

          try {
            const authToken = await getToken() || undefined;
            const response = await api.recolorMockup(
              mockupBase64,
              "image/png",
              color.hex,
              modelId,
              authToken
            );

            if (response.success && response.data) {
              const resultUrl = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
              
              setState((prev) => ({
                ...prev,
                processingCount: Math.max(0, prev.processingCount - 1),
                products: prev.products.map((p) => {
                  if (p.id !== product.id) return p;
                  return {
                    ...p,
                    variants: p.variants.map((v, i) =>
                      i === colorIndex
                        ? { ...v, status: "fulfilled" as const, imageDataUrl: resultUrl }
                        : v
                    ),
                  };
                }),
              }));
            } else {
              throw new Error(response.error || "Failed to recolor mockup");
            }
          } catch (error) {
            setState((prev) => ({
              ...prev,
              processingCount: Math.max(0, prev.processingCount - 1),
              products: prev.products.map((p) => {
                if (p.id !== product.id) return p;
                return {
                  ...p,
                  variants: p.variants.map((v, i) =>
                    i === colorIndex
                      ? {
                          ...v,
                          status: "rejected" as const,
                          error: error instanceof Error ? error.message : "Unknown error",
                        }
                      : v
                  ),
                };
              }),
            }));
          }
        });
      }
    }

    // Run with concurrency limit
    await runWithConcurrency(tasks, MAX_CONCURRENT_REQUESTS);

    setState((prev) => ({
      ...prev,
      isProcessing: false,
      processingCount: 0,
    }));
  }, [state.products, state.selectedColors, getToken]);

  // ===========================================================================
  // Download Utilities
  // ===========================================================================

  /**
   * Download selected product previews
   */
  const downloadSelectedPreviews = useCallback(() => {
    const selectedProducts = state.products.filter((p) => p.selected && p.preview);
    
    selectedProducts.forEach((product, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.download = `mockup-preview-${index + 1}.png`;
        link.href = product.preview!;
        link.click();
      }, index * 200);
    });
  }, [state.products]);

  /**
   * Download all variants for selected products
   */
  const downloadSelectedVariants = useCallback(() => {
    const selectedProducts = state.products.filter((p) => p.selected);
    let downloadIndex = 0;
    
    selectedProducts.forEach((product, pIndex) => {
      product.variants
        .filter((v) => v.status === "fulfilled" && v.imageDataUrl)
        .forEach((variant) => {
          setTimeout(() => {
            const link = document.createElement("a");
            link.download = `mockup-${pIndex + 1}-${variant.colorName.toLowerCase().replace(/\s+/g, "-")}.png`;
            link.href = variant.imageDataUrl!;
            link.click();
          }, downloadIndex * 200);
          downloadIndex++;
        });
    });
  }, [state.products]);

  // ===========================================================================
  // Phase Navigation
  // ===========================================================================

  const goToPhase = useCallback((phase: "compose" | "preview" | "recolor") => {
    setState((prev) => ({ ...prev, phase, error: null }));
  }, []);

  // ===========================================================================
  // Legacy Support (Single Product Mode)
  // ===========================================================================

  /**
   * Set product image (legacy - single product mode)
   */
  const setProductImage = useCallback((imageDataUrl: string, mimeType: string) => {
    // Add as a new product
    addProduct(imageDataUrl, mimeType);
    
    // Also set legacy state for backward compatibility
    setState((prev) => ({
      ...prev,
      productImage: imageDataUrl,
      productMimeType: mimeType,
      selectedTemplate: null,
      firstMockup: null,
      confirmedMockup: null,
      results: [],
      error: null,
      phase: "compose",
    }));
  }, [addProduct]);

  /**
   * Clear product image (legacy)
   */
  const clearProductImage = useCallback(() => {
    clearAllProducts();
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
  }, [clearAllProducts]);

  /**
   * Update logo position (legacy - updates active product)
   */
  const updateLogoPosition = useCallback((updates: Partial<LogoPosition>) => {
    const activeId = state.activeProductId;
    if (activeId) {
      updateProductLogoPosition(activeId, updates);
    }
    // Also update legacy state
    setState((prev) => ({
      ...prev,
      logoPosition: { ...prev.logoPosition, ...updates },
      firstMockup: null,
    }));
  }, [state.activeProductId, updateProductLogoPosition]);

  /**
   * Reset logo position (legacy)
   */
  const resetLogoPosition = useCallback(() => {
    const activeId = state.activeProductId;
    if (activeId) {
      resetProductLogoPosition(activeId);
    }
    setState((prev) => ({
      ...prev,
      logoPosition: DEFAULT_LOGO_POSITION,
      firstMockup: null,
    }));
  }, [state.activeProductId, resetProductLogoPosition]);

  /**
   * Generate first mockup (legacy - generates for active product)
   */
  const generateFirstMockup = useCallback(async (modelId?: string) => {
    const activeProduct = state.products.find((p) => p.id === state.activeProductId);
    
    if (!activeProduct && !state.productImage) {
      setState((prev) => ({ ...prev, error: "Please upload a product image" }));
      return;
    }

    if (!state.logoImage) {
      setState((prev) => ({ ...prev, error: "Please upload a logo" }));
      return;
    }

    if (activeProduct) {
      await regenerateProductPreview(activeProduct.id, modelId);
      // Sync to legacy state
      const updatedProduct = state.products.find((p) => p.id === activeProduct.id);
      if (updatedProduct?.preview) {
        setState((prev) => ({
          ...prev,
          firstMockup: updatedProduct.preview,
          firstMockupMimeType: "image/png",
        }));
      }
    }
  }, [state.products, state.activeProductId, state.productImage, state.logoImage, regenerateProductPreview]);

  /**
   * Confirm mockup (legacy)
   */
  const confirmMockup = useCallback(() => {
    const activeProduct = state.products.find((p) => p.id === state.activeProductId);
    const preview = activeProduct?.preview || state.firstMockup;
    
    if (!preview) {
      setState((prev) => ({ ...prev, error: "No mockup to confirm" }));
      return;
    }

    setState((prev) => ({
      ...prev,
      phase: "recolor",
      confirmedMockup: preview,
      confirmedMockupMimeType: "image/png",
      selectedColors: [],
      results: [],
      error: null,
    }));
  }, [state.products, state.activeProductId, state.firstMockup]);

  /**
   * Go back to compose (legacy)
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
  // Reset Utilities
  // ===========================================================================

  const resetEditor = useCallback(() => {
    setState(initialState);
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ===========================================================================
  // Legacy Download Functions
  // ===========================================================================

  const downloadMockup = useCallback((result: MockupResult) => {
    if (!result.imageDataUrl) return;
    const link = document.createElement("a");
    link.download = `mockup-${result.colorName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = result.imageDataUrl;
    link.click();
  }, []);

  const downloadAllMockups = useCallback(() => {
    const successfulResults = state.results.filter(
      (r) => r.status === "fulfilled" && r.imageDataUrl
    );
    successfulResults.forEach((result, index) => {
      setTimeout(() => downloadMockup(result), index * 200);
    });
  }, [state.results, downloadMockup]);

  const downloadConfirmedMockup = useCallback(() => {
    if (!state.confirmedMockup) return;
    const link = document.createElement("a");
    link.download = "mockup-base.png";
    link.href = state.confirmedMockup;
    link.click();
  }, [state.confirmedMockup]);

  const retryMockup = useCallback(async (colorHex: string, modelId?: string) => {
    // Legacy implementation - for single product mode
    if (!state.confirmedMockup) return;
    // ... existing retry logic
  }, [state.confirmedMockup]);

  return {
    state,
    
    // Multi-product management
    addProducts,
    addProduct,
    removeProduct,
    clearAllProducts,
    setActiveProduct,
    toggleProductSelection,
    selectAllProducts,
    deselectAllProducts,
    updateProductLogoPosition,
    resetProductLogoPosition,
    clearProductPreview,
    
    // Logo management
    setLogoImage,
    clearLogoImage,
    
    // Preview generation
    generateAllPreviews,
    regenerateProductPreview,
    
    // Color variants
    setSelectedColors,
    generateColorVariants,
    
    // Downloads
    downloadSelectedPreviews,
    downloadSelectedVariants,
    
    // Phase navigation
    goToPhase,
    
    // Legacy support (backward compatibility)
    setProductImage,
    clearProductImage,
    updateLogoPosition,
    resetLogoPosition,
    generateFirstMockup,
    confirmMockup,
    goBackToCompose,
    downloadMockup,
    downloadAllMockups,
    downloadConfirmedMockup,
    retryMockup,
    
    // Utils
    resetEditor,
    clearError,
  };
}
