"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoStyle, LOGO_STYLES } from "@/types/logo-studio";
import { Palette, Check } from "lucide-react";

interface StyleSelectorProps {
  selectedStyle: LogoStyle | null;
  onStyleSelect: (style: LogoStyle | null) => void;
  disabled?: boolean;
}

export function StyleSelector({
  selectedStyle,
  onStyleSelect,
  disabled = false,
}: StyleSelectorProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="w-4 h-4 text-violet-400" />
          Style (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {LOGO_STYLES.map((style) => (
            <motion.button
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStyleSelect(selectedStyle === style.id ? null : style.id)}
              disabled={disabled}
              className={cn(
                "relative p-3 rounded-lg text-left transition-all",
                "border border-border/50",
                selectedStyle === style.id
                  ? "bg-violet-500/20 border-violet-500"
                  : "bg-muted/30 hover:bg-muted/50 hover:border-violet-500/50",
                disabled && "opacity-50 pointer-events-none"
              )}
            >
              <div className="font-medium text-sm">{style.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {style.description}
              </div>
              {selectedStyle === style.id && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-violet-400" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

