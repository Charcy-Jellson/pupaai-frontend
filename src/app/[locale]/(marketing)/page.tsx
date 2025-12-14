"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useRegistrationEnabled } from "@/hooks";
import { ArrowRight } from "lucide-react";

// Import new components
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesSection } from "@/components/marketing/features-section";

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const { registrationEnabled } = useRegistrationEnabled();

  return (
    <div className="relative overflow-hidden min-h-screen bg-black text-white selection:bg-violet-500/30">
      {/* Global Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Deep space background */}
        <div className="absolute inset-0 bg-black" />
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        {/* Ambient colored spots */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/10 to-transparent" />
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection registrationEnabled={registrationEnabled} />

        {/* Features Section */}
        <FeaturesSection />

        {/* CTA Section */}
        <section className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[2rem] bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 border border-white/10 overflow-hidden backdrop-blur-xl"
            >
              {/* Internal Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/30 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/30 rounded-full blur-[80px]" />
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  {t("ctaTitle")}
                </h2>
                <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                  {t("ctaSubtitle")}
                </p>
                <Link href={registrationEnabled ? "/sign-up" : "/sign-in"}>
                  <Button 
                    size="xl" 
                    className="h-14 px-10 text-lg rounded-full bg-white text-black hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 font-semibold"
                  >
                    {registrationEnabled ? t("ctaStart") : tCommon("signIn")}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
