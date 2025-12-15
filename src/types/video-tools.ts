// Video Tools Types

// Available video tools
export type VideoToolType = 
  | "remove-watermark"
  | "text-to-video"
  | "image-to-video"
  | "video-analysis";

// Tool menu item
export interface VideoToolMenuItem {
  id: VideoToolType;
  labelKey: string; // Translation key
  icon: string;
  isAvailable: boolean;
}

// Video analysis result types
export interface ShotAnalysis {
  shot_number: number;
  timestamp?: string;
  visual_style?: string;
  subjects?: string;
  action?: string;
  camera_movement?: string;
  audio_text?: string;
}

export interface VideoAnalysisResult {
  success: boolean;
  shots?: ShotAnalysis[];
  success_factors?: string[];
  generated_prompt?: string;
  raw_analysis?: string;
  error?: string;
}

// Video tools configuration
export const VIDEO_TOOLS_CONFIG: VideoToolMenuItem[] = [
  {
    id: "video-analysis",
    labelKey: "videoTools.tools.videoAnalysis",
    icon: "Search",
    isAvailable: true, // Active - AI video analysis
  },
  {
    id: "remove-watermark",
    labelKey: "videoTools.tools.removeWatermark",
    icon: "Eraser",
    isAvailable: false, // Coming soon - URL parsing and AI removal
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

