"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RotateCw, 
  RotateCcw, 
  Maximize2, 
  Wand2,
  Eraser,
  Scissors,
  ChevronDown,
  ChevronUp,
  FileDown,
  Sparkles,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import type { AIModel, ProviderType } from "@/lib/api";

interface ToolPanelProps {
  hasImage: boolean;
  isProcessing: boolean;
  isAdmin?: boolean;
  onRotate: (degrees: number) => void;
  onResize: (width: number, height: number) => void;
  onCompress: (targetSizeKB: number) => Promise<{ originalSize: number; finalSize: number; quality: number }>;
  onExtractLogo: (modelId?: string) => void;
  onRemoveBackground: (modelId?: string) => void;
  onRemoveLogo: (modelId?: string) => void;
  onPreviewRotation?: (degrees: number) => void;
  onCancelPreview?: () => void;
}

export function ToolPanel({
  hasImage,
  isProcessing,
  isAdmin = false,
  onRotate,
  onResize,
  onCompress,
  onExtractLogo,
  onRemoveBackground,
  onRemoveLogo,
  onPreviewRotation,
  onCancelPreview,
}: ToolPanelProps) {
  const t = useTranslations("imageTools");
  const tc = useTranslations("common");
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isPreviewingRotation, setIsPreviewingRotation] = useState(false);
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [targetSizeKB, setTargetSizeKB] = useState("500");
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    finalSize: number;
    quality: number;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    transform: true,
    resize: false,
    compress: false,
    ai: true,
  });

  // AI Model selection state (for admins)
  const [selectedModelId, setSelectedModelId] = useState<string>("default");
  const [models, setModels] = useState<AIModel[]>([]);
  const [availableProviders, setAvailableProviders] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    openai: false,
  });
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load available models for image processing
  useEffect(() => {
    if (isAdmin) {
      setIsLoadingModels(true);
      
      // Fetch models and providers status in parallel
      Promise.all([
        api.getAIModels("image_processing"),
        api.getProvidersStatus(),
      ]).then(([modelsRes, providersRes]) => {
        if (modelsRes.success && modelsRes.data) {
          setModels(modelsRes.data.models);
        }
        if (providersRes.success && providersRes.data) {
          setAvailableProviders(providersRes.data);
        }
        setIsLoadingModels(false);
      });
    }
  }, [isAdmin]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleResize = () => {
    const width = parseInt(resizeWidth);
    const height = parseInt(resizeHeight);
    if (width > 0 && height > 0) {
      onResize(width, height);
    }
  };

  // Get the model ID to use (undefined for default)
  const getModelIdToUse = (): string | undefined => {
    return selectedModelId === "default" ? undefined : selectedModelId;
  };

  // Group models by provider
  const geminiModels = models.filter(
    (m) => m.provider === "gemini" && m.is_active && availableProviders.gemini
  );
  const openaiModels = models.filter(
    (m) => m.provider === "openai" && m.is_active && availableProviders.openai
  );

  return (
    <div className="space-y-4">
      {/* Transform Tools */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("transform")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-base">Transform</CardTitle>
            </div>
            {expandedSections.transform ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        {expandedSections.transform && (
          <CardContent className="space-y-4">
            {/* Quick Rotate Buttons */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Rotate</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(-90)}
                  disabled={!hasImage || isProcessing}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">90° L</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(90)}
                  disabled={!hasImage || isProcessing}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-xs">90° R</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(180)}
                  disabled={!hasImage || isProcessing}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-xs">180°</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(-180)}
                  disabled={!hasImage || isProcessing}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">Flip</span>
                </Button>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Custom Rotation with Live Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Custom Rotation</Label>
                <span className="text-sm font-medium">{rotationAngle}°</span>
              </div>
              <Slider
                value={[rotationAngle]}
                onValueChange={([value]) => {
                  setRotationAngle(value);
                  setIsPreviewingRotation(true);
                  onPreviewRotation?.(value);
                }}
                min={-180}
                max={180}
                step={1}
                disabled={!hasImage || isProcessing}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRotationAngle(0);
                    setIsPreviewingRotation(false);
                    onCancelPreview?.();
                  }}
                  disabled={!hasImage || isProcessing || !isPreviewingRotation}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onRotate(rotationAngle);
                    setRotationAngle(0);
                    setIsPreviewingRotation(false);
                  }}
                  disabled={!hasImage || isProcessing || rotationAngle === 0}
                >
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Resize Tools */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("resize")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-base">Resize</CardTitle>
            </div>
            {expandedSections.resize ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        {expandedSections.resize && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm text-muted-foreground">
                  Width (px)
                </Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="800"
                  value={resizeWidth}
                  onChange={(e) => setResizeWidth(e.target.value)}
                  disabled={!hasImage || isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm text-muted-foreground">
                  Height (px)
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="600"
                  value={resizeHeight}
                  onChange={(e) => setResizeHeight(e.target.value)}
                  disabled={!hasImage || isProcessing}
                />
              </div>
            </div>

            {/* Preset Sizes */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "HD", w: 1280, h: 720 },
                  { label: "FHD", w: 1920, h: 1080 },
                  { label: "4K", w: 3840, h: 2160 },
                  { label: "Square", w: 1080, h: 1080 },
                  { label: "Story", w: 1080, h: 1920 },
                  { label: "Banner", w: 1200, h: 628 },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResizeWidth(preset.w.toString());
                      setResizeHeight(preset.h.toString());
                    }}
                    disabled={!hasImage || isProcessing}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleResize}
              disabled={!hasImage || isProcessing || !resizeWidth || !resizeHeight}
            >
              Apply Resize
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Compress Tools */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("compress")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-base">Compress</CardTitle>
            </div>
            {expandedSections.compress ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <CardDescription className="text-xs">
            Reduce file size
          </CardDescription>
        </CardHeader>
        
        {expandedSections.compress && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetSize" className="text-sm text-muted-foreground">
                Target Size (KB)
              </Label>
              <Input
                id="targetSize"
                type="number"
                placeholder="500"
                value={targetSizeKB}
                onChange={(e) => {
                  setTargetSizeKB(e.target.value);
                  setCompressionResult(null);
                }}
                disabled={!hasImage || isProcessing}
              />
            </div>

            {/* Preset Sizes */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "100KB", size: 100 },
                  { label: "200KB", size: 200 },
                  { label: "500KB", size: 500 },
                  { label: "1MB", size: 1024 },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTargetSizeKB(preset.size.toString());
                      setCompressionResult(null);
                    }}
                    disabled={!hasImage || isProcessing}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={async () => {
                const size = parseInt(targetSizeKB);
                if (size > 0) {
                  const result = await onCompress(size);
                  setCompressionResult(result);
                }
              }}
              disabled={!hasImage || isProcessing || !targetSizeKB}
            >
              Compress Image
            </Button>

            {/* Compression Result */}
            {compressionResult && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original:</span>
                  <span className="font-medium">{compressionResult.originalSize} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compressed:</span>
                  <span className="font-medium text-green-500">{compressionResult.finalSize} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quality:</span>
                  <span className="font-medium">{compressionResult.quality}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reduction:</span>
                  <span className="font-medium text-violet-400">
                    {Math.round((1 - compressionResult.finalSize / compressionResult.originalSize) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* AI Tools */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("ai")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-base">AI Tools</CardTitle>
            </div>
            {expandedSections.ai ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <CardDescription className="text-xs">
            Powered by AI
          </CardDescription>
        </CardHeader>
        
        {expandedSections.ai && (
          <CardContent className="space-y-3">
            {/* Admin Model Selector */}
            {isAdmin && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <Label className="text-sm font-medium">Model Override</Label>
                  <Badge variant="secondary" className="text-[10px]">Admin</Badge>
                </div>
                {isLoadingModels ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Select
                    value={selectedModelId}
                    onValueChange={(value) => setSelectedModelId(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Use default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use Default</SelectItem>
                      
                      {geminiModels.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-xs text-muted-foreground">Gemini</SelectLabel>
                          {geminiModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.display_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      
                      {openaiModels.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-xs text-muted-foreground">OpenAI</SelectLabel>
                          {openaiModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.display_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      {geminiModels.length === 0 && openaiModels.length === 0 && (
                        <SelectItem value="none" disabled>
                          No models available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Override the default model for this request
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-3 h-auto py-3",
                "hover:bg-violet-500/10 hover:border-violet-500/30"
              )}
              onClick={() => onRemoveBackground(getModelIdToUse())}
              disabled={!hasImage || isProcessing}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <Eraser className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium">Remove Background</div>
                <div className="text-xs text-muted-foreground">
                  Make background transparent
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-3 h-auto py-3",
                "hover:bg-violet-500/10 hover:border-violet-500/30"
              )}
              onClick={() => onExtractLogo(getModelIdToUse())}
              disabled={!hasImage || isProcessing}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <Scissors className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium">Extract Logo</div>
                <div className="text-xs text-muted-foreground">
                  Isolate logo from image
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-3 h-auto py-3",
                "hover:bg-violet-500/10 hover:border-violet-500/30"
              )}
              onClick={() => onRemoveLogo(getModelIdToUse())}
              disabled={!hasImage || isProcessing}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium">Remove Logo</div>
                <div className="text-xs text-muted-foreground">
                  Remove logos and watermarks
                </div>
              </div>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
