"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, X, Palette, Save, Trash2, Loader2 } from "lucide-react";
import { PRESET_COLORS, type ColorOption } from "@/types/mockup";

interface SavedColor {
  id: string;
  user_id: string;
  name: string;
  hex: string;
  created_at: string;
}

interface ColorSelectorProps {
  selectedColors: ColorOption[];
  onColorsChange: (colors: ColorOption[]) => void;
  disabled?: boolean;
}

export function ColorSelector({
  selectedColors,
  onColorsChange,
  disabled = false,
}: ColorSelectorProps) {
  const t = useTranslations("productMockup.colors");
  const tc = useTranslations("common");
  const [customColorInput, setCustomColorInput] = useState("#");
  const [customColorName, setCustomColorName] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  
  // User saved colors state
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);
  const [isLoadingSavedColors, setIsLoadingSavedColors] = useState(true);
  const [isSavingColor, setIsSavingColor] = useState(false);
  const [isDeletingColor, setIsDeletingColor] = useState<string | null>(null);

  // Load saved colors on mount
  useEffect(() => {
    loadSavedColors();
  }, []);

  const loadSavedColors = async () => {
    try {
      setIsLoadingSavedColors(true);
      const response = await fetch("/api/colors");
      if (response.ok) {
        const data = await response.json();
        setSavedColors(data.colors || []);
      }
    } catch (error) {
      console.error("Error loading saved colors:", error);
    } finally {
      setIsLoadingSavedColors(false);
    }
  };

  // Toggle color selection
  const toggleColor = useCallback(
    (color: ColorOption) => {
      if (disabled) return;

      const isSelected = selectedColors.some((c) => c.hex === color.hex);

      if (isSelected) {
        onColorsChange(selectedColors.filter((c) => c.hex !== color.hex));
      } else {
        onColorsChange([...selectedColors, color]);
      }
    },
    [selectedColors, onColorsChange, disabled]
  );

  // Add custom color (to current selection only, not saved)
  const handleAddCustomColor = useCallback(() => {
    if (!customColorInput || customColorInput === "#") return;

    // Validate hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(customColorInput)) {
      return;
    }

    const customColor: ColorOption = {
      id: `custom-${Date.now()}`,
      name: customColorName || `${t("custom")} (${customColorInput})`,
      hex: customColorInput.toUpperCase(),
    };

    // Don't add if already exists
    if (!selectedColors.some((c) => c.hex.toUpperCase() === customColor.hex)) {
      onColorsChange([...selectedColors, customColor]);
    }

    setCustomColorInput("#");
    setCustomColorName("");
    setIsAddingCustom(false);
  }, [customColorInput, customColorName, selectedColors, onColorsChange, t]);

  // Save color to user's persistent storage
  const handleSaveColor = useCallback(async () => {
    if (!customColorInput || customColorInput === "#") return;

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(customColorInput)) {
      return;
    }

    try {
      setIsSavingColor(true);
      const response = await fetch("/api/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customColorName || `${t("custom")} (${customColorInput})`,
          hex: customColorInput.toUpperCase(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedColors((prev) => [...prev, data.color]);
        setCustomColorInput("#");
        setCustomColorName("");
        setIsAddingCustom(false);
      } else {
        const error = await response.json();
        console.error("Failed to save color:", error.error);
      }
    } catch (error) {
      console.error("Error saving color:", error);
    } finally {
      setIsSavingColor(false);
    }
  }, [customColorInput, customColorName, t]);

  // Delete saved color
  const handleDeleteSavedColor = useCallback(async (colorId: string) => {
    try {
      setIsDeletingColor(colorId);
      const response = await fetch(`/api/colors?id=${colorId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSavedColors((prev) => prev.filter((c) => c.id !== colorId));
        // Also remove from selection if it was selected
        onColorsChange(selectedColors.filter((c) => c.id !== colorId));
      }
    } catch (error) {
      console.error("Error deleting color:", error);
    } finally {
      setIsDeletingColor(null);
    }
  }, [selectedColors, onColorsChange]);

  // Remove a selected color
  const removeColor = useCallback(
    (colorHex: string) => {
      if (disabled) return;
      onColorsChange(selectedColors.filter((c) => c.hex !== colorHex));
    },
    [selectedColors, onColorsChange, disabled]
  );

  // Select all preset colors
  const selectAll = useCallback(() => {
    if (disabled) return;
    const allColors = [...PRESET_COLORS];
    // Add any custom colors that were already selected
    selectedColors.forEach((c) => {
      if (!allColors.some((p) => p.hex === c.hex)) {
        allColors.push(c);
      }
    });
    onColorsChange(PRESET_COLORS);
  }, [onColorsChange, disabled, selectedColors]);

  // Clear all selections
  const clearAll = useCallback(() => {
    if (disabled) return;
    onColorsChange([]);
  }, [onColorsChange, disabled]);

  // Convert saved color to ColorOption
  const savedColorToOption = (saved: SavedColor): ColorOption => ({
    id: saved.id,
    name: saved.name,
    hex: saved.hex,
  });

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-400" />
            {t("selectColors")}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={selectAll}
              disabled={disabled}
            >
              {t("all")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearAll}
              disabled={disabled || selectedColors.length === 0}
            >
              {t("clear")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Colors Grid */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            {t("defaultColors")}
          </Label>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => {
              const isSelected = selectedColors.some((c) => c.hex === color.hex);
              const isWhite = color.hex === "#FFFFFF";

              return (
                <motion.button
                  key={color.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleColor(color)}
                  disabled={disabled}
                  className={cn(
                    "relative w-10 h-10 rounded-full transition-all",
                    "border-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                    isSelected
                      ? "border-violet-500 shadow-lg shadow-violet-500/30"
                      : isWhite
                      ? "border-gray-300"
                      : "border-transparent",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={cn(
                          "absolute inset-0 flex items-center justify-center rounded-full",
                          isWhite || color.hex === "#E8E2CC"
                            ? "text-gray-800"
                            : "text-white"
                        )}
                      >
                        <Check className="w-5 h-5" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* User Saved Colors */}
        {(savedColors.length > 0 || isLoadingSavedColors) && (
          <div className="border-t border-border/50 pt-3">
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("mySavedColors")}
            </Label>
            {isLoadingSavedColors ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {savedColors.map((saved) => {
                  const color = savedColorToOption(saved);
                  const isSelected = selectedColors.some((c) => c.hex === color.hex);
                  const isWhite = color.hex === "#FFFFFF";
                  const isDeleting = isDeletingColor === saved.id;

                  return (
                    <div key={saved.id} className="relative group">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleColor(color)}
                        disabled={disabled || isDeleting}
                        className={cn(
                          "relative w-10 h-10 rounded-full transition-all",
                          "border-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                          isSelected
                            ? "border-violet-500 shadow-lg shadow-violet-500/30"
                            : isWhite
                            ? "border-gray-300"
                            : "border-transparent",
                          (disabled || isDeleting) && "opacity-50 cursor-not-allowed"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className={cn(
                                "absolute inset-0 flex items-center justify-center rounded-full",
                                isWhite || color.hex === "#E8E2CC"
                                  ? "text-gray-800"
                                  : "text-white"
                              )}
                            >
                              <Check className="w-5 h-5" strokeWidth={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                      {/* Delete button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedColor(saved.id);
                        }}
                        disabled={isDeleting}
                        className={cn(
                          "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground",
                          "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                          "hover:bg-destructive/80"
                        )}
                        title={tc("delete")}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <X className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Custom Color Input */}
        <div className="border-t border-border/50 pt-3">
          {!isAddingCustom ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setIsAddingCustom(true)}
              disabled={disabled}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addCustomColor")}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                {/* Color picker input */}
                <input
                  type="color"
                  value={customColorInput.length === 7 ? customColorInput : "#000000"}
                  onChange={(e) => setCustomColorInput(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
                />
                <Input
                  type="text"
                  value={customColorInput}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (!value.startsWith("#")) {
                      value = "#" + value;
                    }
                    setCustomColorInput(value.slice(0, 7).toUpperCase());
                  }}
                  placeholder="#000000"
                  className="flex-1 font-mono text-sm"
                />
              </div>
              <Input
                type="text"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                placeholder={t("colorNameOptional")}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddCustomColor}
                  disabled={!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColorInput)}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t("useOnce")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveColor}
                  disabled={!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColorInput) || isSavingColor}
                  className="flex-1"
                >
                  {isSavingColor ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  {t("saveColor")}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsAddingCustom(false);
                  setCustomColorInput("#");
                  setCustomColorName("");
                }}
              >
                {tc("cancel")}
              </Button>
            </div>
          )}
        </div>

        {/* Selected Colors Display */}
        {selectedColors.length > 0 && (
          <div className="border-t border-border/50 pt-3">
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("selected", { count: selectedColors.length })}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {selectedColors.map((color) => (
                <Badge
                  key={color.hex}
                  variant="secondary"
                  className="pl-1 pr-1.5 py-0.5 flex items-center gap-1.5 bg-card border border-border/50"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-border/50"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs">{color.name}</span>
                  <button
                    onClick={() => removeColor(color.hex)}
                    disabled={disabled}
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        {selectedColors.length === 0 && (
          <p className="text-xs text-center text-muted-foreground">
            {t("selectColorsHint")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
