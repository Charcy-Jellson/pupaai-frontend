"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Shirt, Sparkles, Wand2 } from "lucide-react";
import { useMockupEditor } from "@/hooks/use-mockup-editor";
import {
  ImagePicker,
  LogoCanvas,
  ColorSelector,
  ResultsGallery,
} from "@/components/product-mockup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { saveFileFromDataUrl } from "@/lib/supabase";
import type { MockupResult } from "@/types/mockup";

export default function ProductMockupPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const {
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
    clearError,
  } = useMockupEditor();

  // Check if ready to generate
  const canGenerate =
    state.productImage &&
    state.logoImage &&
    state.selectedColors.length > 0 &&
    !state.isProcessing;

  // Save single result to gallery
  const handleSaveResult = useCallback(
    async (result: MockupResult) => {
      if (!user?.id || !result.imageDataUrl) return;

      try {
        const fileName = `mockup-${result.colorName.toLowerCase().replace(/\s+/g, "-")}.png`;
        const saved = await saveFileFromDataUrl(user.id, result.imageDataUrl, fileName);

        if (saved) {
          toast({
            title: "Saved!",
            description: `${result.colorName} mockup saved to gallery.`,
          });
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        toast({
          title: "Save Failed",
          description: "Could not save mockup to gallery.",
          variant: "destructive",
        });
      }
    },
    [user?.id, toast]
  );

  // Save all successful results
  const handleSaveAll = useCallback(async () => {
    if (!user?.id) return;

    const successfulResults = state.results.filter(
      (r) => r.status === "fulfilled" && r.imageDataUrl
    );

    let savedCount = 0;
    for (const result of successfulResults) {
      try {
        const fileName = `mockup-${result.colorName.toLowerCase().replace(/\s+/g, "-")}.png`;
        const saved = await saveFileFromDataUrl(user.id, result.imageDataUrl!, fileName);
        if (saved) savedCount++;
      } catch (e) {
        // Continue with others
      }
    }

    toast({
      title: "Saved!",
      description: `${savedCount} of ${successfulResults.length} mockups saved to gallery.`,
    });
  }, [user?.id, state.results, toast]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Product Mockup</h1>
            <p className="text-sm text-muted-foreground">
              Create realistic product mockups with AI-powered logo placement
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Alert className="bg-violet-500/10 border-violet-500/30">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <AlertDescription className="text-sm text-muted-foreground">
            <strong className="text-violet-300">How it works:</strong> Upload or select a product image from gallery,
            add your logo, position it, select colors, and generate multiple mockups at once.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Error Alert */}
      {state.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertDescription className="flex items-center justify-between">
              <span>{state.error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Product & Logo Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Product Image Picker */}
          <ImagePicker
            title="Product Image"
            icon={<Shirt className="w-4 h-4 text-violet-400" />}
            selectedImage={state.productImage}
            onImageSelect={setProductImage}
            onClear={clearProductImage}
            disabled={state.isProcessing}
          />

          {/* Logo Image Picker */}
          <ImagePicker
            title="Logo"
            icon={<Sparkles className="w-4 h-4 text-fuchsia-400" />}
            selectedImage={state.logoImage}
            onImageSelect={setLogoImage}
            onClear={clearLogoImage}
            disabled={state.isProcessing}
          />
        </motion.div>

        {/* Center - Canvas & Logo Positioning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5"
        >
          <LogoCanvas
            productImage={state.productImage}
            logoImage={state.logoImage}
            logoPosition={state.logoPosition}
            selectedTemplate={null}
            onPositionChange={updateLogoPosition}
            onResetPosition={resetLogoPosition}
            onUploadLogo={setLogoImage}
            generatedMockup={null}
            isProcessing={state.isProcessing}
          />
        </motion.div>

        {/* Right Column - Colors & Generate */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4 space-y-4"
        >
          {/* Color Selector */}
          <ColorSelector
            selectedColors={state.selectedColors}
            onColorsChange={setSelectedColors}
            disabled={state.isProcessing}
          />

          {/* Generate Button */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-violet-400" />
                Generate Mockups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                size="lg"
                disabled={!canGenerate}
                onClick={() => generateMockups()}
              >
                {state.isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Generating {state.processingCount} mockup{state.processingCount !== 1 ? "s" : ""}...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {state.selectedColors.length} Mockup
                    {state.selectedColors.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {/* Status indicators */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      state.productImage ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  Product Image {state.productImage ? "✓" : "(required)"}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      state.logoImage ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  Logo {state.logoImage ? "✓" : "(required)"}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      state.selectedColors.length > 0 ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  Colors: {state.selectedColors.length} selected
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Results Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ResultsGallery
          results={state.results}
          processingCount={state.processingCount}
          onDownload={downloadMockup}
          onSave={handleSaveResult}
          onRetry={retryMockup}
          onDownloadAll={downloadAllMockups}
          onSaveAll={handleSaveAll}
        />
      </motion.div>

      {/* Tips Section */}
      {state.results.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8"
        >
          <TipCard
            number="1"
            title="Choose Product"
            description="Upload or select from your gallery"
          />
          <TipCard
            number="2"
            title="Add Logo"
            description="Upload your logo and position it"
          />
          <TipCard
            number="3"
            title="Select Colors"
            description="Pick multiple colors for variants"
          />
          <TipCard
            number="4"
            title="Generate"
            description="AI creates all mockups at once"
          />
        </motion.div>
      )}
    </div>
  );
}

function TipCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card/30 border border-border/50 hover:border-violet-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-violet-400">{number}</span>
        </div>
        <div>
          <h3 className="font-medium text-white mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
