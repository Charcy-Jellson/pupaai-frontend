"use client";

import { useState, useCallback } from "react";
import {
  VideoToolState,
  VideoToolType,
  WatermarkRemovalMethod,
  ParsedVideoResult,
  initialVideoToolState,
  detectPlatform,
} from "@/types/video-tools";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useVideoTools() {
  const [state, setState] = useState<VideoToolState>(initialVideoToolState);

  // Set active tool
  const setActiveTool = useCallback((tool: VideoToolType) => {
    setState((prev) => ({
      ...prev,
      activeTool: tool,
      // Reset method when switching tools
      activeMethod: tool === "remove-watermark" ? "url-parse" : prev.activeMethod,
    }));
  }, []);

  // Set active method for watermark removal
  const setActiveMethod = useCallback((method: WatermarkRemovalMethod) => {
    setState((prev) => ({
      ...prev,
      activeMethod: method,
    }));
  }, []);

  // Set input URL
  const setInputUrl = useCallback((url: string) => {
    setState((prev) => ({
      ...prev,
      inputUrl: url,
      parseError: null, // Clear error when URL changes
    }));
  }, []);

  // Parse video URL
  const parseVideoUrl = useCallback(async (url: string): Promise<ParsedVideoResult> => {
    const platform = detectPlatform(url);
    
    if (platform === "unknown") {
      const error: ParsedVideoResult = {
        success: false,
        platform: "unknown",
        error: "Unsupported platform. Currently only Sora public links are supported.",
      };
      setState((prev) => ({
        ...prev,
        parsedResult: error,
        parseError: error.error ?? null,
        isParsing: false,
      }));
      return error;
    }

    setState((prev) => ({
      ...prev,
      isParsing: true,
      parseError: null,
      parsedResult: null,
    }));

    try {
      const response = await fetch(`${API_URL}/api/video/parse-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        const result: ParsedVideoResult = {
          success: true,
          platform,
          videoUrl: data.video_url,
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration,
          width: data.width,
          height: data.height,
        };
        setState((prev) => ({
          ...prev,
          parsedResult: result,
          isParsing: false,
        }));
        return result;
      } else {
        throw new Error(data.error || "Failed to parse video");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const result: ParsedVideoResult = {
        success: false,
        platform,
        error: errorMessage,
      };
      setState((prev) => ({
        ...prev,
        parsedResult: result,
        parseError: errorMessage,
        isParsing: false,
      }));
      return result;
    }
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setState((prev) => ({
      ...prev,
      parsedResult: null,
      parseError: null,
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState(initialVideoToolState);
  }, []);

  return {
    ...state,
    setActiveTool,
    setActiveMethod,
    setInputUrl,
    parseVideoUrl,
    clearResult,
    reset,
  };
}

