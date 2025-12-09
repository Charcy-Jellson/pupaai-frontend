"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { 
  Sparkles, 
  Wand2, 
  ImageIcon, 
  Video, 
  ArrowRight,
  Shirt,
  User,
  TrendingUp,
} from "lucide-react";

// SVG Butterfly Animation Component
function ButterflyAnimation({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"cocoon" | "breaking" | "butterfly">("cocoon");

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("breaking"), 1500);
    const timer2 = setTimeout(() => setStage("butterfly"), 2500);
    const timer3 = setTimeout(() => onComplete(), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Cocoon Stage */}
      <AnimatePresence>
        {stage === "cocoon" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute"
          >
            <svg width="120" height="160" viewBox="0 0 120 160" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="cocoonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <ellipse 
                cx="60" 
                cy="80" 
                rx="35" 
                ry="60" 
                fill="url(#cocoonGradient)"
                filter="url(#glow)"
              />
              <ellipse cx="60" cy="80" rx="25" ry="50" fill="#1e1b4b" opacity="0.3" />
              {/* Silk thread details */}
              {[...Array(8)].map((_, i) => (
                <motion.path
                  key={i}
                  d={`M ${30 + i * 8} ${40 + i * 5} Q ${60} ${80} ${90 - i * 8} ${120 - i * 5}`}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
              ))}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breaking Stage */}
      <AnimatePresence>
        {stage === "breaking" && (
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute"
          >
            <svg width="140" height="180" viewBox="0 0 140 180" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              {/* Cracked cocoon pieces */}
              <motion.path
                d="M 40 30 Q 70 90 50 150"
                stroke="url(#breakGradient)"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              <motion.path
                d="M 100 30 Q 70 90 90 150"
                stroke="url(#breakGradient)"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              {/* Light rays bursting out */}
              {[...Array(12)].map((_, i) => (
                <motion.line
                  key={i}
                  x1="70"
                  y1="90"
                  x2={70 + Math.cos((i * 30 * Math.PI) / 180) * 60}
                  y2={90 + Math.sin((i * 30 * Math.PI) / 180) * 60}
                  stroke="rgba(168, 85, 247, 0.6)"
                  strokeWidth="2"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: [0, 1, 0], pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                />
              ))}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Butterfly Stage */}
      <AnimatePresence>
        {stage === "butterfly" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="absolute"
          >
            <motion.svg 
              width="200" 
              height="160" 
              viewBox="0 0 200 160" 
              className="drop-shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <defs>
                <linearGradient id="wingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
                <linearGradient id="wingGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
                <filter id="butterflyGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Left Wing */}
              <motion.path
                d="M 100 80 Q 40 40 30 80 Q 20 120 60 140 Q 80 120 100 80"
                fill="url(#wingGradient1)"
                filter="url(#butterflyGlow)"
                initial={{ rotate: 30, originX: "100px", originY: "80px" }}
                animate={{ rotate: [30, 0, 30] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d="M 100 80 Q 60 60 50 80 Q 55 100 70 110 Q 85 100 100 80"
                fill="url(#wingGradient2)"
                opacity="0.8"
                initial={{ rotate: 20, originX: "100px", originY: "80px" }}
                animate={{ rotate: [20, -5, 20] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.05 }}
              />
              
              {/* Right Wing */}
              <motion.path
                d="M 100 80 Q 160 40 170 80 Q 180 120 140 140 Q 120 120 100 80"
                fill="url(#wingGradient1)"
                filter="url(#butterflyGlow)"
                initial={{ rotate: -30, originX: "100px", originY: "80px" }}
                animate={{ rotate: [-30, 0, -30] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d="M 100 80 Q 140 60 150 80 Q 145 100 130 110 Q 115 100 100 80"
                fill="url(#wingGradient2)"
                opacity="0.8"
                initial={{ rotate: -20, originX: "100px", originY: "80px" }}
                animate={{ rotate: [-20, 5, -20] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.05 }}
              />
              
              {/* Body */}
              <ellipse cx="100" cy="80" rx="6" ry="35" fill="#1e1b4b" />
              <circle cx="100" cy="50" r="8" fill="#1e1b4b" />
              
              {/* Antennae */}
              <path d="M 96 45 Q 85 30 80 25" stroke="#1e1b4b" strokeWidth="2" fill="none" />
              <path d="M 104 45 Q 115 30 120 25" stroke="#1e1b4b" strokeWidth="2" fill="none" />
              <circle cx="80" cy="25" r="3" fill="#8b5cf6" />
              <circle cx="120" cy="25" r="3" fill="#8b5cf6" />
              
              {/* Wing patterns */}
              <circle cx="60" cy="90" r="8" fill="rgba(255,255,255,0.3)" />
              <circle cx="50" cy="110" r="5" fill="rgba(255,255,255,0.2)" />
              <circle cx="140" cy="90" r="8" fill="rgba(255,255,255,0.3)" />
              <circle cx="150" cy="110" r="5" fill="rgba(255,255,255,0.2)" />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkles around animation */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-violet-400 rounded-full"
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0 
          }}
          animate={{ 
            x: Math.cos((i * 45 * Math.PI) / 180) * 100,
            y: Math.sin((i * 45 * Math.PI) / 180) * 100,
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 2, 
            delay: 2.5 + i * 0.1,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      ))}
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay,
  badge,
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
  badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="group relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {badge && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const t = useTranslations();
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);

  const features = [
    {
      icon: ImageIcon,
      titleKey: "features.imageTools.title",
      descriptionKey: "features.imageTools.description",
    },
    {
      icon: Shirt,
      titleKey: "features.productMockup.title",
      descriptionKey: "features.productMockup.description",
    },
    {
      icon: User,
      titleKey: "features.modelStudio.title",
      descriptionKey: "features.modelStudio.description",
    },
    {
      icon: Wand2,
      titleKey: "features.logoStudio.title",
      descriptionKey: "features.logoStudio.description",
    },
    {
      icon: Video,
      titleKey: "features.videoTools.title",
      descriptionKey: "features.videoTools.description",
      badgeKey: "features.videoTools.badge",
    },
    {
      icon: TrendingUp,
      titleKey: "features.seo.title",
      descriptionKey: "features.seo.description",
      badgeKey: "features.seo.badge",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Intro Animation */}
          <AnimatePresence>
            {showIntro && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <ButterflyAnimation onComplete={() => {
                  setIntroComplete(true);
                  setTimeout(() => setShowIntro(false), 500);
                }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: introComplete ? 1 : 0, 
              y: introComplete ? 0 : 30 
            }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={showIntro ? "absolute inset-0 flex flex-col items-center justify-center" : ""}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                {t("common.poweredBy")}
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
              <span className="text-gradient">{t("home.title")}</span>
              <span className="text-white"> {t("home.titleHighlight")}</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {t("home.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button variant="gradient" size="xl" className="group">
                  {t("common.getStarted")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="xl">
                  {t("common.signIn")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: introComplete ? 1 : 0 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-violet-500/50 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-violet-500"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t("home.featuresTitle")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.featuresSubtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.titleKey}
                icon={feature.icon}
                title={t(feature.titleKey)}
                description={t(feature.descriptionKey)}
                badge={feature.badgeKey ? t(feature.badgeKey) : undefined}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t("home.ctaTitle")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                {t("home.ctaSubtitle")}
              </p>
              <Link href="/sign-up">
                <Button variant="gradient" size="xl" className="group">
                  {t("home.ctaStart")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

