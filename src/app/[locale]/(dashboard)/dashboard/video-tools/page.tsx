"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Video, Eraser, Type, Image, Sparkles, ChevronRight, Lock, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  VideoToolType, 
  VIDEO_TOOLS_CONFIG 
} from "@/types/video-tools";
import { TextToVideo } from "@/components/video-tools/text-to-video";
import { ImageToVideo } from "@/components/video-tools/image-to-video";
import { VideoAnalysis } from "@/components/video-tools/video-analysis";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Eraser: Eraser,
  Type: Type,
  Image: Image,
  Search: Search,
};

export default function VideoToolsPage() {
  const t = useTranslations("videoTools");
  const tc = useTranslations("common");
  
  const [activeTool, setActiveTool] = useState<VideoToolType>("video-analysis");

  // Render the active tool content
  const renderToolContent = () => {
    switch (activeTool) {
      case "video-analysis":
        return <VideoAnalysis />;
      case "text-to-video":
        return <TextToVideo />;
      case "image-to-video":
        return <ImageToVideo />;
      case "remove-watermark":
        // Coming soon placeholder
        return (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Eraser className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t("tools.removewatermark")}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {tc("comingSoon")} - URL parsing and AI-powered watermark removal features are under development.
              </p>
              <Badge variant="outline" className="mt-4">
                {tc("comingSoon")}
              </Badge>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Video className="w-5 h-5 text-white" />
          </div>
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-5rem)]">
        {/* Tool Selector Sidebar */}
        <Card className="lg:w-72 shrink-0 bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="space-y-2">
              {VIDEO_TOOLS_CONFIG.map((tool) => {
                const Icon = iconMap[tool.icon] || Video;
                const isActive = activeTool === tool.id;
                
                return (
                  <div key={tool.id}>
                    {/* Main Tool Button */}
                    <button
                      onClick={() => {
                        if (tool.isAvailable) {
                          setActiveTool(tool.id);
                        }
                      }}
                      disabled={!tool.isAvailable}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        isActive
                          ? "bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-white border border-rose-500/30"
                          : tool.isAvailable
                            ? "hover:bg-muted/50 text-muted-foreground hover:text-white"
                            : "opacity-50 cursor-not-allowed text-muted-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        isActive
                          ? "bg-gradient-to-br from-rose-500 to-purple-500"
                          : "bg-muted/50"
                      )}>
                        {tool.isAvailable ? (
                          <Icon className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium">
                        {t(`tools.${tool.id.replace(/-/g, "")}`)}
                      </span>
                      {!tool.isAvailable && (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/30">
                          {tc("soon")}
                        </Badge>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* AI Badge */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{tc("poweredBy")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderToolContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
