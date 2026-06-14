"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gem,
  Hand,
  Video,
  Sparkles,
  Play,
  RotateCcw,
  AlertCircle,
  Loader2,
  Info,
  Lock,
  ImageIcon,
  Package,
  Box,
  BoxSelect,
} from "lucide-react";
import { useNailStudio } from "@/hooks/use-nail-studio";
import {
  NailImagePicker,
  PresetSelector,
  NailResultsGallery,
} from "@/components/nail-studio";
import {
  PRESET_BACKGROUNDS,
  PRESET_HANDS,
  NailStudioTab,
  BoxOption,
} from "@/types/nail-studio";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function NailStudioPage() {
  const t = useTranslations("nailStudio");
  const tc = useTranslations("common");
  const { getToken } = useAuth();

  const {
    state,
    setActiveTab,
    addNailImages,
    removeNailImage,
    selectNail,
    clearNailImages,
    setBackgroundImage,
    clearBackgroundImage,
    setBoxOption,
    setHandImage,
    clearHandImage,
    generateBackgroundChange,
    generateHandApply,
    retryResult,
    downloadResult,
    downloadAllResults,
    resetEditor,
    clearError,
  } = useNailStudio(getToken);

  const [selectedBgPresetId, setSelectedBgPresetId] = useState<string | null>(null);
  const [selectedHandPresetId, setSelectedHandPresetId] = useState<string | null>(null);

  const canGenerateBackground =
    state.nailImages.length > 0 &&
    state.backgroundImage !== null &&
    !state.isProcessing;

  const canGenerateHand =
    state.nailImages.length > 0 &&
    state.handImage !== null &&
    !state.isProcessing;

  const currentGenerationCount = state.nailImages.length;

  const handleTabChange = (value: string) => {
    setActiveTab(value as NailStudioTab);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetEditor}
            disabled={state.isProcessing}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("reset")}
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
              {t("dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="bg-pink-500/10 border-pink-500/20">
        <Info className="h-4 w-4 text-pink-400" />
        <AlertDescription className="text-pink-200/80">
          {t("infoAlert")}
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs value={state.activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="background" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabBackground")}</span>
          </TabsTrigger>
          <TabsTrigger value="hand" className="gap-2">
            <Hand className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabHand")}</span>
          </TabsTrigger>
          <TabsTrigger value="video" disabled className="gap-2">
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabVideo")}</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 ml-1"
            >
              {t("comingSoon")}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* Tab 1: Change Background                                     */}
        {/* ============================================================ */}
        <TabsContent value="background" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Nail Art Images */}
            <div className="lg:col-span-3">
              <NailImagePicker
                nailImages={state.nailImages}
                selectedNailId={state.selectedNailId}
                onAddImages={addNailImages}
                onRemoveImage={removeNailImage}
                onSelectNail={selectNail}
                onClearAll={clearNailImages}
                disabled={state.isProcessing}
              />
            </div>

            {/* Center Column - Background Selection */}
            <div className="lg:col-span-5">
              <PresetSelector
                presets={PRESET_BACKGROUNDS}
                selectedImage={state.backgroundImage}
                selectedPresetId={selectedBgPresetId}
                onPresetSelect={(dataUrl, mime, name, presetId) => {
                  setBackgroundImage(dataUrl, mime, name);
                  setSelectedBgPresetId(presetId);
                }}
                onUpload={(dataUrl, mime, name) => {
                  setBackgroundImage(dataUrl, mime, name);
                  setSelectedBgPresetId(null);
                }}
                onClear={() => {
                  clearBackgroundImage();
                  setSelectedBgPresetId(null);
                }}
                title={t("backgroundSection.title")}
                icon={<ImageIcon className="w-4 h-4 text-pink-400" />}
                uploadLabel={t("backgroundSection.uploadLabel")}
                emptyLabel={t("backgroundSection.presetsLabel")}
                disabled={state.isProcessing}
              />
            </div>

            {/* Right Column - Generate */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    {t("generate")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("nailArt")}:
                      </span>
                      <Badge
                        variant={
                          state.nailImages.length > 0 ? "default" : "secondary"
                        }
                      >
                        <Gem className="w-3 h-3 mr-1" />
                        {t("itemCount", { count: state.nailImages.length })}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("target")}:
                      </span>
                      <Badge
                        variant={
                          state.backgroundImage ? "default" : "secondary"
                        }
                      >
                        {state.backgroundImage
                          ? t("backgroundSection.ready")
                          : t("backgroundSection.notSelected")}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between font-medium">
                        <span>{t("totalImages")}:</span>
                        <span className="text-pink-400">
                          {currentGenerationCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Box Option Selector */}
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      {t("boxOption.label")}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { value: "keep_original" as BoxOption, labelKey: "boxOption.keepOriginal", Icon: Package },
                        { value: "with_box" as BoxOption, labelKey: "boxOption.withBox", Icon: Box },
                        { value: "without_box" as BoxOption, labelKey: "boxOption.withoutBox", Icon: BoxSelect },
                      ]).map(({ value, labelKey, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-all",
                            state.boxOption === value
                              ? "border-pink-400 bg-pink-500/15 text-pink-300"
                              : "border-border/50 bg-muted/20 text-muted-foreground hover:border-pink-300 hover:bg-muted/40"
                          )}
                          onClick={() => setBoxOption(value)}
                          disabled={state.isProcessing}
                        >
                          <Icon className="w-4 h-4" />
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    size="lg"
                    onClick={() => generateBackgroundChange()}
                    disabled={!canGenerateBackground}
                  >
                    {state.isProcessing &&
                    state.activeTab === "background" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("generatingImages", {
                          count: state.processingCount,
                        })}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {t("generateImages", {
                          count: currentGenerationCount,
                        })}
                      </>
                    )}
                  </Button>

                  {!canGenerateBackground && !state.isProcessing && (
                    <p className="text-xs text-muted-foreground text-center">
                      {state.nailImages.length === 0
                        ? t("selectNailFirst")
                        : t("selectBackgroundFirst")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* Tab 2: Apply to Hand                                         */}
        {/* ============================================================ */}
        <TabsContent value="hand" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Nail Art Images */}
            <div className="lg:col-span-3">
              <NailImagePicker
                nailImages={state.nailImages}
                selectedNailId={state.selectedNailId}
                onAddImages={addNailImages}
                onRemoveImage={removeNailImage}
                onSelectNail={selectNail}
                onClearAll={clearNailImages}
                disabled={state.isProcessing}
              />
            </div>

            {/* Center Column - Hand Selection */}
            <div className="lg:col-span-5">
              <PresetSelector
                presets={PRESET_HANDS}
                selectedImage={state.handImage}
                selectedPresetId={selectedHandPresetId}
                onPresetSelect={(dataUrl, mime, name, presetId) => {
                  setHandImage(dataUrl, mime, name);
                  setSelectedHandPresetId(presetId);
                }}
                onUpload={(dataUrl, mime, name) => {
                  setHandImage(dataUrl, mime, name);
                  setSelectedHandPresetId(null);
                }}
                onClear={() => {
                  clearHandImage();
                  setSelectedHandPresetId(null);
                }}
                title={t("handSection.title")}
                icon={<Hand className="w-4 h-4 text-pink-400" />}
                uploadLabel={t("handSection.uploadLabel")}
                emptyLabel={t("handSection.presetsLabel")}
                disabled={state.isProcessing}
              />
            </div>

            {/* Right Column - Generate */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 border-pink-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    {t("generate")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("nailArt")}:
                      </span>
                      <Badge
                        variant={
                          state.nailImages.length > 0 ? "default" : "secondary"
                        }
                      >
                        <Gem className="w-3 h-3 mr-1" />
                        {t("itemCount", { count: state.nailImages.length })}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("target")}:
                      </span>
                      <Badge
                        variant={state.handImage ? "default" : "secondary"}
                      >
                        {state.handImage
                          ? t("handSection.ready")
                          : t("handSection.notSelected")}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between font-medium">
                        <span>{t("totalImages")}:</span>
                        <span className="text-pink-400">
                          {currentGenerationCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600"
                    size="lg"
                    onClick={() => generateHandApply()}
                    disabled={!canGenerateHand}
                  >
                    {state.isProcessing && state.activeTab === "hand" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("generatingImages", {
                          count: state.processingCount,
                        })}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {t("generateImages", {
                          count: currentGenerationCount,
                        })}
                      </>
                    )}
                  </Button>

                  {!canGenerateHand && !state.isProcessing && (
                    <p className="text-xs text-muted-foreground text-center">
                      {state.nailImages.length === 0
                        ? t("selectNailFirst")
                        : t("selectHandFirst")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* Tab 3: Video (Coming Soon)                                   */}
        {/* ============================================================ */}
        <TabsContent value="video" className="mt-0">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t("videoComingSoonTitle")}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {t("videoComingSoonDesc")}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Results */}
      <NailResultsGallery
        results={state.results}
        processingCount={state.processingCount}
        onDownload={downloadResult}
        onRetry={(id) => retryResult(id)}
        onDownloadAll={downloadAllResults}
      />
    </div>
  );
}
