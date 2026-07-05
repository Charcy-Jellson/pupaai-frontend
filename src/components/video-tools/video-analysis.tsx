"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useAuth } from "@clerk/nextjs";
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
  AlertCircle,
  Youtube,
  Image,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Hash,
  Languages,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { VideoAnalysisResult, SocialMetrics, VideoInputMode } from "@/types/video-tools";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// Supported video platforms for context
const VIDEO_PLATFORMS = [
  { id: "sora", name: "Sora (OpenAI)" },
  { id: "runway", name: "Runway Gen-3" },
  { id: "pika", name: "Pika Labs" },
  { id: "kling", name: "Kling AI" },
  { id: "minimax", name: "MiniMax" },
  { id: "luma", name: "Luma Dream Machine" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "other", name: "Other / Unknown" },
];

const LANGUAGE_OPTIONS = [
  { id: "en", name: "English" },
  { id: "zh", name: "中文" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function VideoAnalysis() {
  const t = useTranslations("videoTools.analysis");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { getToken } = useAuth();
  
  // State
  const [inputMode, setInputMode] = useState<VideoInputMode>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("sora");
  const [outputLanguage, setOutputLanguage] = useState<string>(locale);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [expandedShot, setExpandedShot] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScreenshotDragging, setIsScreenshotDragging] = useState(false);
  const [showExampleImage, setShowExampleImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Handle video file selection
  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setResult(null);
    
    if (!file.type.startsWith("video/")) {
      setError(t("errorNotVideo"));
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError(t("errorTooLarge"));
      return;
    }
    
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  }, [t]);

  // Handle screenshot file selection
  const handleScreenshotSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }
    
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreviewUrl(url);
  }, []);

  // Handle drag and drop for video
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

  // Handle drag and drop for screenshot
  const handleScreenshotDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsScreenshotDragging(true);
  }, []);

  const handleScreenshotDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsScreenshotDragging(false);
  }, []);

  const handleScreenshotDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsScreenshotDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleScreenshotSelect(file);
    }
  }, [handleScreenshotSelect]);

  // Handle file input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleScreenshotInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScreenshotSelect(file);
    }
  }, [handleScreenshotSelect]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Validate YouTube URL
  const isValidYoutubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  // Analyze video
  const handleAnalyze = async () => {
    // Validate input
    if (inputMode === "upload" && !videoFile) {
      setError(t("errorNoVideo"));
      return;
    }
    if (inputMode === "youtube" && !youtubeUrl) {
      setError(t("errorNoYoutube"));
      return;
    }
    if (inputMode === "youtube" && !isValidYoutubeUrl(youtubeUrl)) {
      setError(t("errorInvalidYoutube"));
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const requestBody: Record<string, unknown> = {
        source_platform: selectedPlatform !== "other" ? selectedPlatform : null,
        output_language: outputLanguage,
      };

      // Add video input based on mode
      if (inputMode === "upload" && videoFile) {
        requestBody.video_base64 = await fileToBase64(videoFile);
        requestBody.mime_type = videoFile.type;
      } else if (inputMode === "youtube") {
        requestBody.youtube_url = youtubeUrl;
      }

      // Add screenshot if provided
      if (screenshotFile) {
        requestBody.screenshot_base64 = await fileToBase64(screenshotFile);
        requestBody.screenshot_mime_type = screenshotFile.type;
      }
      
      // Get auth token for API request
      const authToken = await getToken();
      
      const response = await fetch(`${BACKEND_URL}/api/video/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(requestBody),
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
    setYoutubeUrl("");
    setResult(null);
    setError(null);
    setExpandedShot(null);
  };

  // Reset screenshot
  const handleResetScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreviewUrl) {
      URL.revokeObjectURL(screenshotPreviewUrl);
    }
    setScreenshotPreviewUrl(null);
  };

  // Check if can analyze
  const canAnalyze = 
    (inputMode === "upload" && videoFile) || 
    (inputMode === "youtube" && youtubeUrl && isValidYoutubeUrl(youtubeUrl));

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
        {/* Left: Input & Settings */}
        <div className="space-y-4">
          {/* Input Mode Selection */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t("inputMode")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode("upload")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    inputMode === "upload"
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/50"
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/40 border border-transparent"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  {t("uploadMode")}
                </button>
                <button
                  onClick={() => setInputMode("youtube")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    inputMode === "youtube"
                      ? "bg-red-500/20 text-red-300 border border-red-500/50"
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/40 border border-transparent"
                  )}
                >
                  <Youtube className="w-4 h-4" />
                  {t("youtubeMode")}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Video Input Area */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {inputMode === "upload" ? <Upload className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
                {inputMode === "upload" ? t("uploadVideo") : t("youtubeUrl")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inputMode === "upload" ? (
                // File Upload Mode
                !videoFile ? (
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
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                      {videoPreviewUrl && (
                        <video
                          src={videoPreviewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
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
                )
              ) : (
                // YouTube URL Mode
                <div className="space-y-3">
                  <Input
                    type="url"
                    placeholder={t("youtubeUrlPlaceholder")}
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="bg-muted/20 border-border/50"
                  />
                  {youtubeUrl && isValidYoutubeUrl(youtubeUrl) && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <Check className="w-4 h-4" />
                      {t("validUrl")}
                    </div>
                  )}
                  {youtubeUrl && !isValidYoutubeUrl(youtubeUrl) && (
                    <div className="flex items-center gap-2 text-sm text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      {t("invalidUrl")}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Screenshot Upload (Optional) */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Image className="w-4 h-4" />
                {t("screenshot")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {t("screenshotHint")}
              </p>
              {!screenshotFile ? (
                <div
                  onClick={() => screenshotInputRef.current?.click()}
                  onDragOver={handleScreenshotDragOver}
                  onDragLeave={handleScreenshotDragLeave}
                  onDrop={handleScreenshotDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
                    isScreenshotDragging 
                      ? "border-emerald-500 bg-emerald-500/10" 
                      : "border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  )}
                >
                  <Image className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {t("uploadScreenshot")}
                  </p>
                  <input
                    ref={screenshotInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden bg-black/50 h-24">
                    {screenshotPreviewUrl && (
                      <img
                        src={screenshotPreviewUrl}
                        alt="Screenshot"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResetScreenshot}
                    className="w-full text-muted-foreground hover:text-white text-xs"
                  >
                    {t("removeScreenshot")}
                  </Button>
                </div>
              )}
              
              {/* Example Screenshot Link */}
              <button
                onClick={() => setShowExampleImage(!showExampleImage)}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3 h-3" />
                {t("screenshotExample")}
                <ChevronDown className={cn("w-3 h-3 transition-transform", showExampleImage && "rotate-180")} />
              </button>
              
              {/* Example Image Preview */}
              <AnimatePresence>
                {showExampleImage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-lg overflow-hidden border border-emerald-500/30">
                      <img
                        src="/images/video-tools/screenshot-example.png"
                        alt="Screenshot Example"
                        className="w-full h-auto"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Settings Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Platform Selection */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {t("platform")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/50 text-sm text-white"
                >
                  {VIDEO_PLATFORMS.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Language Selection */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  {t("outputLanguage")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <select
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/50 text-sm text-white"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
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
                {/* Social Metrics (if extracted from screenshot) */}
                {result.social_metrics && (
                  <Card className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-400" />
                        {t("socialMetrics")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {result.social_metrics.views && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                            <Eye className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t("views")}</p>
                              <p className="text-sm font-medium text-white">{result.social_metrics.views}</p>
                            </div>
                          </div>
                        )}
                        {result.social_metrics.likes && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                            <Heart className="w-4 h-4 text-red-400" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t("likes")}</p>
                              <p className="text-sm font-medium text-white">{result.social_metrics.likes}</p>
                            </div>
                          </div>
                        )}
                        {result.social_metrics.comments && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                            <MessageCircle className="w-4 h-4 text-green-400" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t("comments")}</p>
                              <p className="text-sm font-medium text-white">{result.social_metrics.comments}</p>
                            </div>
                          </div>
                        )}
                        {result.social_metrics.favorites && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                            <Bookmark className="w-4 h-4 text-yellow-400" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t("favorites")}</p>
                              <p className="text-sm font-medium text-white">{result.social_metrics.favorites}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {result.social_metrics.description && (
                        <div className="mt-3 p-2 rounded-lg bg-white/5">
                          <p className="text-xs text-muted-foreground mb-1">{t("description")}</p>
                          <p className="text-sm text-gray-300">{result.social_metrics.description}</p>
                        </div>
                      )}
                      {result.social_metrics.hashtags && result.social_metrics.hashtags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {result.social_metrics.hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              <Hash className="w-3 h-3 mr-0.5" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

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
