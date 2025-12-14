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
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Video Generation Demo ---
export function VideoGenerationDemo() {
  const t = useTranslations("featureDemo.video");
  
  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];
  
  // Simulation of different "scenes" or "models"
  const scenes = [
    { color: "from-orange-400 to-rose-500", label: t("usMarket"), icon: "🇺🇸" },
    { color: "from-blue-400 to-cyan-500", label: t("euMarket"), icon: "🇪🇺" },
    { color: "from-emerald-400 to-teal-500", label: t("seaMarket"), icon: "🌏" },
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
        {/* Animated Background Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              scenes[currentScene].color
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Abstract "Product" or "Person" representation */}
              <div className="w-32 h-48 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
                 <span className="text-4xl">{scenes[currentScene].icon}</span>
              </div>
            </div>
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
export function SeoAnalysisDemo() {
  const t = useTranslations("featureDemo.seo");
  
  const tags = [
    { text: "#summer_vibes", score: 98, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { text: "#fashion_2025", score: 95, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
    { text: "#must_have", score: 88, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
    { text: "#ootd", score: 82, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
    { text: "#gift_ideas", score: 75, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  ];

  return (
    <div className="w-full h-full bg-neutral-900/50 border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">{t("marketAnalysis")}</div>
            <div className="text-xs text-gray-400">{t("realTimeInsights")}</div>
          </div>
        </div>
        <div className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
          <Globe2 className="w-3 h-3" /> {t("live")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Score Card */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-gray-500 mb-1">{t("viralityScore")}</div>
          <div className="text-3xl font-bold text-white flex items-end gap-2">
            9.8
            <span className="text-sm font-medium text-emerald-500 mb-1">+24%</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "98%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-500" 
            />
          </div>
        </div>

        {/* Region Card */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
           <div className="text-xs text-gray-500 mb-1">{t("topRegion")}</div>
           <div className="flex items-center gap-2 mt-2">
             <span className="text-2xl">🇺🇸</span>
             <span className="text-white font-medium">{t("unitedStates")}</span>
           </div>
           <div className="absolute right-0 bottom-0 opacity-20">
              <Globe2 className="w-16 h-16 text-white translate-x-4 translate-y-4" />
           </div>
        </div>
      </div>

      {/* Tags Cloud Animation */}
      <div className="flex-1">
        <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">{t("generatedKeywords")}</div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <motion.div
              key={tag.text}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.15, type: "spring" }}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5", tag.color)}
            >
              <Hash className="w-3 h-3 opacity-50" />
              {tag.text}
              <span className="opacity-50 ml-1 text-[10px]">{tag.score}</span>
            </motion.div>
          ))}
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
