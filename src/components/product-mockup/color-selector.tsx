"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, X, Palette } from "lucide-react";
import { PRESET_COLORS, type ColorOption } from "@/types/mockup";

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
  const [customColorInput, setCustomColorInput] = useState("#");
  const [customColorName, setCustomColorName] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

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

  // Add custom color
  const handleAddCustomColor = useCallback(() => {
    if (!customColorInput || customColorInput === "#") return;

    // Validate hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(customColorInput)) {
      return;
    }

    const customColor: ColorOption = {
      id: `custom-${Date.now()}`,
      name: customColorName || `Custom (${customColorInput})`,
      hex: customColorInput.toUpperCase(),
    };

    // Don't add if already exists
    if (!selectedColors.some((c) => c.hex.toUpperCase() === customColor.hex)) {
      onColorsChange([...selectedColors, customColor]);
    }

    setCustomColorInput("#");
    setCustomColorName("");
    setIsAddingCustom(false);
  }, [customColorInput, customColorName, selectedColors, onColorsChange]);

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

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-400" />
            Select Colors
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={selectAll}
              disabled={disabled}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearAll}
              disabled={disabled || selectedColors.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Colors Grid */}
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
                        isWhite || color.hex === "#EAB308"
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
              Add Custom Color
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
                placeholder="Color name (optional)"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddCustomColor}
                  disabled={!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColorInput)}
                  className="flex-1"
                >
                  Add Color
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setCustomColorInput("#");
                    setCustomColorName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Colors Display */}
        {selectedColors.length > 0 && (
          <div className="border-t border-border/50 pt-3">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Selected ({selectedColors.length} {selectedColors.length === 1 ? "color" : "colors"})
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
            Select colors to generate mockups in different variants
          </p>
        )}
      </CardContent>
    </Card>
  );
}

