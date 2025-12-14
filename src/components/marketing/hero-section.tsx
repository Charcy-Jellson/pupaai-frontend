"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export function HeroSection({ registrationEnabled }: { registrationEnabled: boolean }) {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            Gemini 3 Pro + OpenAI GPT-5.1 Integration
          </span>
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-white">
            {t("heroTitle")}
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">
            {t("titleHighlight")}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
          {t("heroDescription")}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href={registrationEnabled ? "/sign-up" : "/sign-in"}>
            <Button
              size="lg"
              className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:scale-105"
            >
              {t("ctaStart")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="#features">
             <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg rounded-full border-violet-500/30 hover:bg-violet-500/10 backdrop-blur-sm"
            >
              {t("ctaLearn")}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
