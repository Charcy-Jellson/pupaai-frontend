"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Shirt,
  Sparkles,
  Play,
  RotateCcw,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useModelStudio } from "@/hooks/use-model-studio";
import {
  ModelSelector,
  ModelGenerator,
  ClothingPicker,
  OptionsPanel,
  ModelStudioResults,
} from "@/components/model-studio";

export default function ModelStudioPage() {
  const {
    state,
    // Model
    setModelSource,
    setModelImage,
    clearModelImage,
    setModelGenerationOptions,
    generateModel,
    // Clothing
    addClothingItem,
    removeClothingItem,
    clearClothingItems,
    // Options
    setSelectedScene,
    togglePose,
    setSelectedPantsType,
    // Generation
    generateResults,
    retryResult,
    // Download
    downloadResult,
    downloadAllResults,
    // Reset
    resetEditor,
    clearError,
  } = useModelStudio();

  const canGenerate =
    state.modelImage &&
    state.selectedClothingItems.length > 0 &&
    state.selectedPoses.length > 0 &&
    !state.isProcessing;

  const totalGenerations =
    state.selectedClothingItems.length * state.selectedPoses.length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Model Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Virtual try-on: dress AI models with your clothing
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetEditor}
            disabled={state.isProcessing}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {state.error}
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200/80">
          Select or generate a model, choose clothing items, and configure options.
          The AI will generate realistic try-on images.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Model Selection */}
        <div className="lg:col-span-3 space-y-4">
          <ModelSelector
            selectedImage={state.modelImage}
            modelSource={state.modelSource}
            onSourceChange={setModelSource}
            onImageSelect={setModelImage}
            onClear={clearModelImage}
            disabled={state.isProcessing}
          >
            {/* Model Generator (shown in Generate tab) */}
            <ModelGenerator
              options={state.modelGenerationOptions}
              onOptionsChange={setModelGenerationOptions}
              onGenerate={() => generateModel()}
              isGenerating={state.isGeneratingModel}
              disabled={state.isProcessing}
            />
          </ModelSelector>
        </div>

        {/* Center Column - Clothing Selection */}
        <div className="lg:col-span-4 space-y-4">
          <ClothingPicker
            selectedItems={state.selectedClothingItems}
            onAddItem={addClothingItem}
            onRemoveItem={removeClothingItem}
            onClearAll={clearClothingItems}
            disabled={state.isProcessing}
          />
        </div>

        {/* Right Column - Options & Generate */}
        <div className="lg:col-span-5 space-y-4">
          <OptionsPanel
            selectedScene={state.selectedScene}
            selectedPoses={state.selectedPoses}
            selectedPantsType={state.selectedPantsType}
            onSceneChange={setSelectedScene}
            onPoseToggle={togglePose}
            onPantsTypeChange={setSelectedPantsType}
            disabled={state.isProcessing}
          />

          {/* Generate Card */}
          <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Generate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <Badge variant={state.modelImage ? "default" : "secondary"}>
                    {state.modelImage ? (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        Ready
                      </>
                    ) : (
                      "Not selected"
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Clothing:</span>
                  <Badge
                    variant={
                      state.selectedClothingItems.length > 0
                        ? "default"
                        : "secondary"
                    }
                  >
                    <Shirt className="w-3 h-3 mr-1" />
                    {state.selectedClothingItems.length} item(s)
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Poses:</span>
                  <Badge variant="default">
                    {state.selectedPoses.length} selected
                  </Badge>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Images:</span>
                    <span className="text-emerald-400">{totalGenerations}</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                size="lg"
                onClick={() => generateResults()}
                disabled={!canGenerate}
              >
                {state.isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating {state.processingCount} images...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate {totalGenerations} Image
                    {totalGenerations !== 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {!canGenerate && !state.isProcessing && (
                <p className="text-xs text-muted-foreground text-center">
                  {!state.modelImage
                    ? "Select or generate a model first"
                    : state.selectedClothingItems.length === 0
                    ? "Add at least one clothing item"
                    : "Select at least one pose"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      <ModelStudioResults
        results={state.results}
        processingCount={state.processingCount}
        onDownload={downloadResult}
        onRetry={(id) => retryResult(id)}
        onDownloadAll={downloadAllResults}
      />
    </div>
  );
}
