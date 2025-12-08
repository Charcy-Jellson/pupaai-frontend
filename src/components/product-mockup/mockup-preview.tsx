"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Save,
  Wand2,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";

interface MockupPreviewProps {
  productImage: string | null;
  logoImage: string | null;
  generatedMockup: string | null;
  isProcessing: boolean;
  error: string | null;
  onGenerate: () => void;
  onDownload: () => void;
  onSave?: () => void;
  onClearError: () => void;
}

export function MockupPreview({
  productImage,
  logoImage,
  generatedMockup,
  isProcessing,
  error,
  onGenerate,
  onDownload,
  onSave,
  onClearError,
}: MockupPreviewProps) {
  const canGenerate = productImage && logoImage && !isProcessing;
  const hasResult = generatedMockup !== null;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-400" />
            Generate Mockup
          </CardTitle>
          {hasResult && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Check className="w-3 h-3 mr-1" />
              Generated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-400">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-red-400 hover:text-red-300"
                onClick={onClearError}
              >
                Dismiss
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${productImage ? "bg-green-500" : "bg-gray-500"}`} />
            <span className={productImage ? "text-foreground" : "text-muted-foreground"}>
              Product Image {productImage ? "✓" : "(required)"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${logoImage ? "bg-green-500" : "bg-gray-500"}`} />
            <span className={logoImage ? "text-foreground" : "text-muted-foreground"}>
              Logo {logoImage ? "✓" : "(required)"}
            </span>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
          size="lg"
          disabled={!canGenerate}
          onClick={onGenerate}
        >
          {isProcessing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-2"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
              Generating...
            </>
          ) : hasResult ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Mockup
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Mockup
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-center text-muted-foreground">
          AI will apply the logo to the product with realistic print effects
        </p>

        {/* Action Buttons (show when result is available) */}
        <AnimatePresence>
          {hasResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2 border-t border-border/50"
            >
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={onDownload}
                  disabled={isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {onSave && (
                  <Button
                    variant="outline"
                    onClick={onSave}
                    disabled={isProcessing}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}





