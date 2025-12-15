"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { 
  TrendingUp, 
  Globe2, 
  Hash, 
  Share2, 
  Heart,
  MessageCircle,
  Wand2,
  Youtube,
  Upload,
  Image,
  Film,
  Target,
  FileText,
  Languages,
  Eye,
  Bookmark,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Video Generation Demo ---
export function VideoGenerationDemo() {
  const t = useTranslations("featureDemo.video");
  
  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];
  
  // Different market video demos
  const scenes = [
    { image: "/images/marketing/us_video_demo.png", label: t("usMarket"), icon: "🇺🇸" },
    { image: "/images/marketing/eu_video_demo.png", label: t("euMarket"), icon: "🇪🇺" },
    { image: "/images/marketing/as_video_demo.png", label: t("seaMarket"), icon: "🌏" },
  ];
  
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [scenes.length]);

  return (
    <div className="relative w-full h-[400px] bg-neutral-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row">
      {/* Left: Configuration / Progress Panel */}
      <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-violet-400 font-mono mb-2">{t("pipeline")}</div>
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors duration-500",
                i === currentScene ? "bg-violet-500 animate-pulse" : "bg-white/20"
              )} />
              <span className={cn(
                "text-sm transition-colors duration-500",
                i === currentScene ? "text-white" : "text-white/40"
              )}>{s}</span>
            </div>
          ))}
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs text-gray-400 mb-2">{t("targetAudience")}</div>
          <div className="flex gap-2">
            {scenes.map((scene, i) => (
              <div 
                key={i} 
                className={cn(
                  "px-2 py-1 rounded text-xs transition-all duration-300",
                  currentScene === i ? "bg-violet-500/20 text-violet-300 border border-violet-500/50" : "bg-white/5 text-gray-500 border border-transparent"
                )}
              >
                {scene.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Preview Player */}
      <div className="w-full md:w-1/2 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Video Demo Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <img 
              src={scenes[currentScene].image}
              alt={scenes[currentScene].label}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to gradient if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-violet-500', 'to-purple-600');
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* UI Overlay (TikTok/Reels style) */}
        <div className="absolute right-4 bottom-20 flex flex-col gap-4 text-white/90">
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-full bg-black/20 backdrop-blur-sm">
              <Heart className="w-6 h-6 fill-white/20" />
            </div>
            <span className="text-xs font-bold">{t("likes")}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-full bg-black/20 backdrop-blur-sm">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold">{t("comments")}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-full bg-black/20 backdrop-blur-sm">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold">{t("share")}</span>
          </div>
        </div>

        {/* Caption Overlay */}
        <div className="absolute bottom-4 left-4 right-16">
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/10">
            <motion.div 
              key={currentScene}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-white"
            >
              {scenes[currentScene].label}
            </motion.div>
            <div className="text-xs text-white/70 mt-1 flex items-center gap-1">
               <Wand2 className="w-3 h-3 text-violet-400" /> {t("aiGenerated")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Image Comparison Demo (Before / After) ---
// To replace images:
// 1. Put your images in: public/images/marketing/
// 2. Update the src paths below: before.png and after.png
export function ImageComparisonDemo() {
  const t = useTranslations("featureDemo.image");
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate slider position from mouse/touch event
  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  }, [isDragging, updateSliderPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  }, [updateSliderPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    updateSliderPosition(e.touches[0].clientX);
  }, [isDragging, updateSliderPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse/touch listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Auto animate the slider from 0% to 100% when not dragging
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setSliderPosition((prev) => {
        if (prev >= 100) return 0;
        return prev + 0.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden cursor-ew-resize group select-none border border-white/10"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* "Before" Layer - Original/Raw Image */}
      <div className="absolute inset-0 bg-neutral-900">
        {/* Replace with your before image: /images/marketing/before.png */}
        <img 
          src="/images/marketing/before.png" 
          alt="Original" 
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            // Fallback to placeholder if image not found
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Fallback placeholder when image not found */}
        <div className="hidden absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="w-48 h-64 bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-2xl flex items-center justify-center">
            <span className="text-neutral-500 font-mono text-sm">{t("rawInput")}</span>
          </div>
        </div>
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur text-xs font-bold text-white rounded-full border border-white/10 pointer-events-none">
          {t("original")}
        </div>
      </div>

      {/* "After" Layer - AI Generated Image */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {/* Replace with your after image: /images/marketing/after.png */}
        <img 
          src="/images/marketing/after.png" 
          alt="AI Generated" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient if image not found
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Fallback gradient when image not found */}
        <div className="hidden absolute inset-0 bg-gradient-to-br from-violet-900 to-indigo-900 flex items-center justify-center">
          <div className="w-48 h-64 bg-gradient-to-b from-pink-500 to-violet-600 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.6)] flex items-center justify-center">
            <span className="text-white font-bold tracking-widest text-lg">AI</span>
          </div>
        </div>
        <div className="absolute top-4 left-4 px-3 py-1 bg-violet-500/80 backdrop-blur text-xs font-bold text-white rounded-full border border-white/10">
          {t("aiGenerated")}
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_20px_rgba(255,255,255,0.5)] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-violet-900">
          <div className="flex gap-[2px]">
            <div className="w-[2px] h-3 bg-violet-900/50 rounded-full" />
            <div className="w-[2px] h-3 bg-violet-900/50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}


// --- SEO Analysis Demo ---
// Content is hardcoded in English (does not change with language)
export function SeoAnalysisDemo() {
  const t = useTranslations("featureDemo.seo");
  const [activeSection, setActiveSection] = useState(0);
  
  // Hardcoded English content - same for all languages
  const sections = [
    { 
      icon: "🏷️", 
      title: "Product Name",
      content: "Power Hour Tailored Blazer Set – Effortless Executive Chic",
      color: "from-amber-500/20 to-amber-500/5 border-amber-500/30"
    },
    { 
      icon: "📝", 
      title: "Description",
      content: "Step into confidence, elegance, and quiet luxury. This tailored blazer and wide-leg trousers set is designed for modern women who want to look polished without trying too hard. Perfect for office, meetings, and work-to-dinner transitions.",
      color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30"
    },
    { 
      icon: "🎬", 
      title: "POV Hook",
      content: "POV: You walk into the meeting and everyone suddenly takes you seriously.",
      color: "from-blue-500/20 to-blue-500/5 border-blue-500/30"
    },
    { 
      icon: "#️⃣", 
      title: "Hashtags",
      content: "#workwear #officeoutfit #businesscasual #powerdressing #quietluxury #womeninbusiness #corporatefashion #elegantstyle #ceoenergy #outfitinspo",
      color: "from-purple-500/20 to-purple-500/5 border-purple-500/30"
    },
    { 
      icon: "🎥", 
      title: "Video Prompt",
      content: "Minimal boutique / clean fitting room. Soft natural light. Shot sequence: slow camera push-in → confidence pose → blazer adjustment → authority gaze. Music: calm luxury beats.",
      color: "from-pink-500/20 to-pink-500/5 border-pink-500/30"
    },
  ];

  // Auto cycle through sections
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % sections.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [sections.length]);

  return (
    <div className="w-full h-full bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden">
      <div className="grid md:grid-cols-2 h-full">
        {/* Left: Product Image */}
        <div className="p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="relative">
            {/* Product image */}
            <div className="w-36 h-48 rounded-xl bg-white/5 border-2 border-white/20 flex items-center justify-center mb-4 overflow-hidden shadow-xl">
              <img 
                src="/images/marketing/bg-1.png" 
                alt="Product" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex-col items-center text-white/40">
                <span className="text-2xl mb-1">📷</span>
                <span className="text-xs">{t("uploadProduct")}</span>
              </div>
            </div>
            
            {/* Scanning animation */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-b from-emerald-500/30 to-transparent pointer-events-none rounded-xl"
              animate={{ 
                y: ["0%", "100%", "0%"],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-white mb-1">{t("aiAnalyzing")}</div>
            <div className="text-xs text-gray-400">{t("generatingContent")}</div>
          </div>
        </div>

        {/* Right: AI Generated Results */}
        <div className="p-4 flex flex-col overflow-hidden">
          <div className="text-xs text-emerald-400 font-medium mb-3 flex items-center gap-1">
            <Wand2 className="w-3 h-3" />
            {t("aiGenerated")}
          </div>
          
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.5, scale: 0.98 }}
                animate={{ 
                  opacity: activeSection === i ? 1 : 0.5,
                  scale: activeSection === i ? 1 : 0.98,
                }}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "p-2.5 rounded-lg border cursor-pointer transition-all duration-300",
                  activeSection === i 
                    ? `bg-gradient-to-r ${section.color}` 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{section.icon}</span>
                  <span className="text-xs font-medium text-white">{section.title}</span>
                </div>
                <AnimatePresence mode="wait">
                  {activeSection === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-gray-300 leading-relaxed"
                    >
                      {section.content}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// --- Scene Switching Demo (Background Replacement) ---
export function SceneSwitchDemo() {
  const [currentScene, setCurrentScene] = useState(0);
  
  const scenes = [
    { src: "/images/marketing/bg-1.png", label: "Scene 1" },
    { src: "/images/marketing/bg-2.png", label: "Scene 2" },
    { src: "/images/marketing/bg-3.png", label: "Scene 3" },
  ];

  // Auto switch scenes every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [scenes.length]);

  return (
    <div className="relative h-full min-h-[400px] rounded-lg bg-neutral-900 border border-white/10 overflow-hidden">
      {/* Background Images with Fade Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={scenes[currentScene].src}
            alt={scenes[currentScene].label}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback gradient if image not found
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Scene Indicator Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentScene(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              currentScene === i 
                ? "bg-white w-4" 
                : "bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {/* Scene Label */}
      <motion.div
        key={`label-${currentScene}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500/80 backdrop-blur text-[10px] font-bold text-white rounded-full"
      >
        {scenes[currentScene].label}
      </motion.div>
    </div>
  );
}

// --- Video Analysis Demo ---
export function VideoAnalysisDemo() {
  const t = useTranslations("featureDemo.videoAnalysis");
  const [activeStep, setActiveStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Simulated analysis results
  const analysisResults = {
    shots: [
      { num: 1, style: "Close-up, warm lighting" },
      { num: 2, style: "Medium shot, dynamic" },
      { num: 3, style: "Wide angle, lifestyle" },
    ],
    factors: [
      t("factor1"),
      t("factor2"),
      t("factor3"),
    ],
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 p-4">
      {/* Input Section */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5">
          <div className={cn(
            "px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-all",
            activeStep === 0 ? "bg-amber-500/30 text-amber-300" : "bg-white/5 text-gray-500"
          )}>
            <Upload className="w-3 h-3" />
            {t("upload")}
          </div>
          <div className={cn(
            "px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-all",
            activeStep === 0 ? "bg-red-500/30 text-red-300" : "bg-white/5 text-gray-500"
          )}>
            <Youtube className="w-3 h-3" />
            YouTube
          </div>
        </div>
        <div className="flex-1 h-px bg-white/10" />
        <div className={cn(
          "px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-all",
          activeStep >= 1 ? "bg-emerald-500/30 text-emerald-300" : "bg-white/5 text-gray-500"
        )}>
          <Image className="w-3 h-3" />
          {t("screenshot")}
        </div>
      </div>

      {/* Screenshot Example */}
      <div className="relative mb-3">
        <motion.div
          animate={{ 
            opacity: activeStep >= 1 ? 1 : 0.3,
            scale: activeStep >= 1 ? 1 : 0.98 
          }}
          className="relative h-16 rounded overflow-hidden border border-white/10"
        >
          <img 
            src="/images/video-tools/screenshot-example.png" 
            alt="Screenshot"
            className="w-full h-full object-cover"
          />
          {activeStep >= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ animation: "shimmer 2s infinite" }}
            />
          )}
        </motion.div>
        
        {/* Social Metrics Preview */}
        {activeStep >= 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-1 left-2 flex gap-2"
          >
            <span className="px-1.5 py-0.5 bg-pink-500/30 rounded text-[8px] text-pink-300 flex items-center gap-0.5">
              <Eye className="w-2 h-2" /> 2.1M
            </span>
            <span className="px-1.5 py-0.5 bg-red-500/30 rounded text-[8px] text-red-300 flex items-center gap-0.5">
              <Heart className="w-2 h-2" /> 156K
            </span>
            <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-[8px] text-blue-300 flex items-center gap-0.5">
              <Bookmark className="w-2 h-2" /> 42K
            </span>
          </motion.div>
        )}
      </div>

      {/* Analysis Results */}
      <div className="grid grid-cols-2 gap-2">
        {/* Shot Breakdown */}
        <motion.div 
          animate={{ opacity: activeStep >= 2 ? 1 : 0.3 }}
          className="p-2 rounded bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-1 mb-1.5">
            <Film className="w-3 h-3 text-blue-400" />
            <span className="text-[9px] font-medium text-white">{t("shotBreakdown")}</span>
          </div>
          <div className="space-y-1">
            {analysisResults.shots.map((shot, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ 
                  opacity: activeStep >= 2 ? 1 : 0.3,
                  x: activeStep >= 2 ? 0 : -5 
                }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-1.5"
              >
                <span className="w-3 h-3 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[7px]">
                  {shot.num}
                </span>
                <span className="text-[8px] text-gray-400 truncate">{shot.style}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Success Factors */}
        <motion.div 
          animate={{ opacity: activeStep >= 2 ? 1 : 0.3 }}
          className="p-2 rounded bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-1 mb-1.5">
            <Target className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-medium text-white">{t("successFactors")}</span>
          </div>
          <div className="space-y-1">
            {analysisResults.factors.map((factor, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ 
                  opacity: activeStep >= 2 ? 1 : 0.3,
                  x: activeStep >= 2 ? 0 : -5 
                }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-1"
              >
                <span className="text-amber-400 text-[8px]">•</span>
                <span className="text-[8px] text-gray-400">{factor}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Generated Prompt Preview */}
      <motion.div 
        animate={{ opacity: activeStep >= 3 ? 1 : 0.3 }}
        className="mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-medium text-white">{t("generatedPrompt")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Languages className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-[8px] text-gray-400">EN/中文</span>
          </div>
        </div>
        <p className="text-[8px] text-gray-400 leading-relaxed line-clamp-2">
          {t("promptPreview")}
        </p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              activeStep === step ? "bg-amber-500 w-3" : "bg-white/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}
