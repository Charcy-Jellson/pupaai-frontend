"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Upload, 
  Video, 
  Loader2, 
  Copy, 
  Check, 
  ChevronDown,
  Sparkles,
  Film,
  Target,
  FileText,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VideoAnalysisResult, ShotAnalysis } from "@/types/video-tools";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Supported video platforms for context
const VIDEO_PLATFORMS = [
  { id: "sora", name: "Sora (OpenAI)" },
  { id: "runway", name: "Runway Gen-3" },
  { id: "pika", name: "Pika Labs" },
  { id: "kling", name: "Kling AI" },
  { id: "minimax", name: "MiniMax" },
  { id: "luma", name: "Luma Dream Machine" },
  { id: "other", name: "Other / Unknown" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function VideoAnalysis() {
  const t = useTranslations("videoTools.analysis");
  const tc = useTranslations("common");
  
  // State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("other");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [expandedShot, setExpandedShot] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setResult(null);
    
    // Validate file type
    if (!file.type.startsWith("video/")) {
      setError(t("errorNotVideo"));
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t("errorTooLarge"));
      return;
    }
    
    setVideoFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  }, [t]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Analyze video
  const handleAnalyze = async () => {
    if (!videoFile) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const videoBase64 = await fileToBase64(videoFile);
      
      const response = await fetch(`${BACKEND_URL}/api/video/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_base64: videoBase64,
          mime_type: videoFile.type,
          source_platform: selectedPlatform !== "other" ? selectedPlatform : null,
        }),
      });
      
      const data: VideoAnalysisResult = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || t("errorAnalysisFailed"));
      }
    } catch (err) {
      setError(t("errorNetwork"));
      console.error("Video analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = async () => {
    if (result?.generated_prompt) {
      await navigator.clipboard.writeText(result.generated_prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  // Reset state
  const handleReset = () => {
    setVideoFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setResult(null);
    setError(null);
    setExpandedShot(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {t("title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Upload & Settings */}
        <div className="space-y-4">
          {/* Upload Area */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t("uploadVideo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all",
                    isDragging 
                      ? "border-violet-500 bg-violet-500/10" 
                      : "border-border/50 hover:border-violet-500/50 hover:bg-violet-500/5"
                  )}
                >
                  <Video className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {t("uploadHint")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    MP4, WebM, MOV • Max 20MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mov"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    {videoPreviewUrl && (
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {videoFile.name}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleReset}
                      className="text-muted-foreground hover:text-white"
                    >
                      {t("changeVideo")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t("platform")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {t("platformHint")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm text-left transition-all",
                      selectedPlatform === platform.id
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/50"
                        : "bg-muted/20 text-muted-foreground hover:bg-muted/40 border border-transparent"
                    )}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!videoFile || isAnalyzing}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                {t("analyzeButton")}
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-4" />
                    <p className="text-muted-foreground">{t("analyzing")}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {t("analyzingHint")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Generated Prompt */}
                {result.generated_prompt && (
                  <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          {t("generatedPrompt")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyPrompt}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {copiedPrompt ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span className="ml-1">{t("copyPrompt")}</span>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {result.generated_prompt}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Success Factors */}
                {result.success_factors && result.success_factors.length > 0 && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-400" />
                        {t("successFactors")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.success_factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span className="text-gray-300">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Shot Breakdown */}
                {result.shots && result.shots.length > 0 && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Film className="w-4 h-4 text-blue-400" />
                        {t("shotBreakdown")}
                        <Badge variant="secondary" className="ml-2">
                          {result.shots.length} shots
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {result.shots.map((shot, i) => (
                        <div
                          key={i}
                          className="border border-border/50 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedShot(expandedShot === i ? null : i)}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-medium">
                                {shot.shot_number}
                              </span>
                              <span className="text-muted-foreground">
                                {shot.timestamp || `Shot ${shot.shot_number}`}
                              </span>
                            </span>
                            <ChevronDown 
                              className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform",
                                expandedShot === i && "rotate-180"
                              )} 
                            />
                          </button>
                          <AnimatePresence>
                            {expandedShot === i && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 pt-0 space-y-2 text-sm border-t border-border/50">
                                  {shot.visual_style && (
                                    <div>
                                      <span className="text-muted-foreground">{t("visualStyle")}:</span>
                                      <span className="text-gray-300 ml-2">{shot.visual_style}</span>
                                    </div>
                                  )}
                                  {shot.subjects && (
                                    <div>
                                      <span className="text-muted-foreground">{t("subjects")}:</span>
                                      <span className="text-gray-300 ml-2">{shot.subjects}</span>
                                    </div>
                                  )}
                                  {shot.action && (
                                    <div>
                                      <span className="text-muted-foreground">{t("action")}:</span>
                                      <span className="text-gray-300 ml-2">{shot.action}</span>
                                    </div>
                                  )}
                                  {shot.camera_movement && (
                                    <div>
                                      <span className="text-muted-foreground">{t("camera")}:</span>
                                      <span className="text-gray-300 ml-2">{shot.camera_movement}</span>
                                    </div>
                                  )}
                                  {shot.audio_text && (
                                    <div>
                                      <span className="text-muted-foreground">{t("audioText")}:</span>
                                      <span className="text-gray-300 ml-2">{shot.audio_text}</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Raw Analysis (fallback) */}
                {!result.shots && !result.generated_prompt && result.raw_analysis && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("rawAnalysis")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-auto max-h-96">
                        {result.raw_analysis}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="bg-card/50 border-border/50 border-dashed">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                    <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">{t("resultsPlaceholder")}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
