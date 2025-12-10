"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { 
  Link2, 
  Search, 
  Download, 
  Copy, 
  Check, 
  AlertCircle,
  Video,
  Clock,
  Loader2,
  ExternalLink,
  Clipboard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ParsedVideoResult, detectPlatform } from "@/types/video-tools";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function UrlParser() {
  const t = useTranslations("videoTools.urlParser");
  const tc = useTranslations("common");
  const { toast } = useToast();

  const [inputUrl, setInputUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ParsedVideoResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputUrl(text);
    } catch (err) {
      toast({
        title: tc("error"),
        description: t("pasteError"),
        variant: "destructive",
      });
    }
  };

  const handleParse = async () => {
    if (!inputUrl.trim()) return;

    const platform = detectPlatform(inputUrl);
    if (platform === "unknown") {
      toast({
        title: tc("error"),
        description: t("unsupportedPlatform"),
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/video/parse-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast({
          title: tc("success"),
          description: t("parseSuccess"),
        });
      } else {
        throw new Error(data.error || "Failed to parse video");
      }
    } catch (error) {
      toast({
        title: tc("error"),
        description: error instanceof Error ? error.message : t("parseFailed"),
        variant: "destructive",
      });
      setResult({
        success: false,
        platform: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyUrl = async () => {
    if (result?.videoUrl) {
      await navigator.clipboard.writeText(result.videoUrl);
      setCopied(true);
      toast({
        title: tc("success"),
        description: t("urlCopied"),
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result?.videoUrl) {
      window.open(result.videoUrl, "_blank");
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-gradient-to-r from-rose-500/10 to-purple-500/10 border-rose-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">{t("infoTitle")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("infoDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Input */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-rose-400" />
            {t("inputTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={t("inputPlaceholder")}
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => e.key === "Enter" && handleParse()}
              />
              <button
                onClick={handlePaste}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                title={t("paste")}
              >
                <Clipboard className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <Button
              onClick={handleParse}
              disabled={!inputUrl.trim() || isParsing}
              className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("parsing")}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  {t("parse")}
                </>
              )}
            </Button>
          </div>

          {/* Supported Platforms */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("supportedPlatforms")}:</span>
            <Badge variant="outline" className="text-[10px]">Sora</Badge>
            <Badge variant="outline" className="text-[10px] opacity-50">{tc("moreComingSoon")}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={result.success 
            ? "bg-card/50 border-emerald-500/30" 
            : "bg-card/50 border-destructive/30"
          }>
            <CardContent className="p-6">
              {result.success ? (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Thumbnail */}
                    {result.thumbnail ? (
                      <div className="w-full md:w-48 aspect-video bg-muted rounded-lg overflow-hidden shrink-0">
                        <img
                          src={result.thumbnail}
                          alt={result.title || "Video thumbnail"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-48 aspect-video bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-medium text-white">
                          {result.title || t("untitledVideo")}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="capitalize">
                            {result.platform}
                          </Badge>
                          {result.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(result.duration)}
                            </span>
                          )}
                          {result.width && result.height && (
                            <span>{result.width}×{result.height}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleDownload}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t("download")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCopyUrl}
                        >
                          {copied ? (
                            <Check className="w-4 h-4 mr-2 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          {t("copyUrl")}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => window.open(result.videoUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t("openInNewTab")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Video URL */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{t("videoUrl")}:</p>
                    <p className="text-sm text-white font-mono break-all">
                      {result.videoUrl}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{t("parseFailed")}</p>
                    <p className="text-sm text-muted-foreground">{result.error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Usage Tips */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-white mb-2">{t("howToUse")}</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

