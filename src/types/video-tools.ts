// Video Tools Types

// Available video tools
export type VideoToolType = 
  | "remove-watermark"
  | "text-to-video"
  | "image-to-video";

// Sub-tools for watermark removal
export type WatermarkRemovalMethod = 
  | "url-parse"    // Parse public URL to get clean video
  | "ai-remove";   // AI-based watermark removal (future)

// Supported platforms for URL parsing
export type SupportedPlatform = 
  | "sora"
  | "unknown";

// Video parsing request
export interface VideoParseRequest {
  url: string;
}

// Parsed video result
export interface ParsedVideoResult {
  success: boolean;
  platform: SupportedPlatform;
  videoUrl?: string;
  title?: string;
  thumbnail?: string;
  duration?: number; // in seconds
  width?: number;
  height?: number;
  error?: string;
}

// Video tool state
export interface VideoToolState {
  activeTool: VideoToolType;
  activeMethod: WatermarkRemovalMethod;
  
  // URL Parser state
  inputUrl: string;
  isParsing: boolean;
  parsedResult: ParsedVideoResult | null;
  parseError: string | null;
  
  // Download state
  isDownloading: boolean;
  downloadProgress: number;
}

// Tool menu item
export interface VideoToolMenuItem {
  id: VideoToolType;
  labelKey: string; // Translation key
  icon: string;
  isAvailable: boolean;
  subItems?: {
    id: string;
    labelKey: string;
    isAvailable: boolean;
  }[];
}

// Video tools configuration
export const VIDEO_TOOLS_CONFIG: VideoToolMenuItem[] = [
  {
    id: "remove-watermark",
    labelKey: "videoTools.tools.removeWatermark",
    icon: "Eraser",
    isAvailable: true,
    subItems: [
      {
        id: "url-parse",
        labelKey: "videoTools.methods.urlParse",
        isAvailable: true,
      },
      {
        id: "ai-remove",
        labelKey: "videoTools.methods.aiRemove",
        isAvailable: false, // Coming soon
      },
    ],
  },
  {
    id: "text-to-video",
    labelKey: "videoTools.tools.textToVideo",
    icon: "Type",
    isAvailable: false, // Coming soon
  },
  {
    id: "image-to-video",
    labelKey: "videoTools.tools.imageToVideo",
    icon: "Image",
    isAvailable: false, // Coming soon
  },
];

// Platform detection helper
export function detectPlatform(url: string): SupportedPlatform {
  if (url.includes("sora.com") || url.includes("openai.com/sora")) {
    return "sora";
  }
  return "unknown";
}

// Initial state
export const initialVideoToolState: VideoToolState = {
  activeTool: "remove-watermark",
  activeMethod: "url-parse",
  inputUrl: "",
  isParsing: false,
  parsedResult: null,
  parseError: null,
  isDownloading: false,
  downloadProgress: 0,
};

