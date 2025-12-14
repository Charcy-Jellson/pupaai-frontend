// Video Tools Types

// Available video tools
export type VideoToolType = 
  | "remove-watermark"
  | "text-to-video"
  | "image-to-video";

// Tool menu item
export interface VideoToolMenuItem {
  id: VideoToolType;
  labelKey: string; // Translation key
  icon: string;
  isAvailable: boolean;
}

// Video tools configuration
export const VIDEO_TOOLS_CONFIG: VideoToolMenuItem[] = [
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

