"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoHistoryItem } from "@/types/logo-studio";
import { History, X, Sparkles, Pencil } from "lucide-react";

interface LogoHistoryProps {
  history: LogoHistoryItem[];
  onSelect: (item: LogoHistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function LogoHistory({
  history,
  onSelect,
  onRemove,
  onClear,
  disabled = false,
}: LogoHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-4 gap-2">
            {history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <button
                  onClick={() => !disabled && onSelect(item)}
                  disabled={disabled}
                  className={cn(
                    "w-full aspect-square rounded-lg overflow-hidden",
                    "bg-[url('/checkerboard.svg')] bg-repeat bg-[length:10px_10px]",
                    "border border-border/50 hover:border-violet-500/50",
                    "transition-all",
                    disabled && "opacity-50 pointer-events-none"
                  )}
                >
                  <img
                    src={item.imageDataUrl}
                    alt={item.description || "Generated logo"}
                    className="w-full h-full object-contain"
                  />
                </button>

                {/* Type indicator */}
                <div
                  className={cn(
                    "absolute bottom-1 left-1 p-1 rounded-md",
                    "bg-black/60 text-white"
                  )}
                >
                  {item.type === "generated" ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    <Pencil className="w-3 h-3" />
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onRemove(item.id);
                  }}
                  disabled={disabled}
                  className={cn(
                    "absolute -top-1 -right-1 p-1 rounded-full",
                    "bg-destructive text-destructive-foreground",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity",
                    disabled && "pointer-events-none"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

