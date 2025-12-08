"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOGO_PRESET_COLORS } from "@/types/logo-studio";
import { Pipette, Check } from "lucide-react";

interface ColorPaletteProps {
  selectedColors: string[];
  onToggleColor: (color: string) => void;
  disabled?: boolean;
}

export function ColorPalette({
  selectedColors,
  onToggleColor,
  disabled = false,
}: ColorPaletteProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Pipette className="w-4 h-4 text-cyan-400" />
          Colors (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {LOGO_PRESET_COLORS.map((color) => {
            const isSelected = selectedColors.includes(color);
            const isLight = color === "#FFFFFF" || color === "#FFD700";
            
            return (
              <motion.button
                key={color}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleColor(color)}
                disabled={disabled}
                className={cn(
                  "relative w-8 h-8 rounded-lg transition-all",
                  "border-2",
                  isSelected
                    ? "border-violet-500 ring-2 ring-violet-500/30"
                    : "border-border/50 hover:border-violet-500/50",
                  disabled && "opacity-50 pointer-events-none"
                )}
                style={{ backgroundColor: color }}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      "w-4 h-4 absolute inset-0 m-auto",
                      isLight ? "text-gray-800" : "text-white"
                    )}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        {selectedColors.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {selectedColors.length} color(s) selected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

