"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { 
  Video, 
  Image as ImageIcon, 
  Globe2, 
  Sparkles, 
  Shirt, 
  Layers, 
  BarChart3, 
  Clapperboard, 
  ScanLine,
  ArrowRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoGenerationDemo, ImageComparisonDemo, SeoAnalysisDemo, SceneSwitchDemo, VideoAnalysisDemo } from "@/components/marketing/feature-demos";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function FeaturesSection() {
  const t = useTranslations("features");
  const tDemo = useTranslations("featureDemo");

  return (
    <section id="features" className="py-24 px-4 relative overflow-hidden bg-black/50">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[200px] bg-violet-500/10 blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-6"
          >
            {useTranslations("home")("featuresTitle")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {useTranslations("home")("featuresSubtitle")}
          </motion.p>
        </div>

        <Tabs defaultValue="video" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto p-1.5 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-full">
              <TabsTrigger 
                value="video" 
                className="rounded-full py-3.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 transition-all duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4" />
                  <span className="font-semibold">{t("tabs.video")}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="image" 
                className="rounded-full py-3.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 transition-all duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-semibold">{t("tabs.image")}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="seo" 
                className="rounded-full py-3.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 transition-all duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <Globe2 className="w-4 h-4" />
                  <span className="font-semibold">{t("tabs.seo")}</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative min-h-[500px]">
            {/* Video Tab Content */}
            <TabsContent value="video" className="mt-0 focus-visible:outline-none">
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-8"
              >
                {/* Main Feature: Video Generation */}
                <motion.div variants={item}>
                  <Card className="bg-neutral-900/50 border-white/10 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardHeader className="relative z-10 border-b border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300">
                          <Clapperboard className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-white mb-2">{t("video.generation.title")}</CardTitle>
                          <CardDescription className="text-base text-gray-400 max-w-xl">
                            {t("video.generation.description")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 relative z-10">
                       <VideoGenerationDemo />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Secondary Feature: Analysis */}
                <motion.div variants={item}>
                  <Card className="bg-neutral-900/50 border-white/10 hover:border-amber-500/30 transition-colors relative overflow-hidden group">
                    <div className="absolute top-4 right-4 z-20">
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">
                        {t("video.analysis.badge")}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2">
                      {/* Left: Text Content */}
                      <div className="p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 text-amber-300 group-hover:scale-110 transition-transform duration-300">
                          <ScanLine className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl text-white mb-4 group-hover:text-amber-500 transition-colors">
                          {t("video.analysis.title")}
                        </CardTitle>
                        <CardDescription className="text-base text-gray-400 mb-6">
                          {t("video.analysis.description")}
                        </CardDescription>
                        
                        {/* Feature highlights */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-lg mb-1">📹</div>
                            <div className="text-xs font-medium text-white">{tDemo("videoAnalysis.upload")} / YouTube</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-lg mb-1">📊</div>
                            <div className="text-xs font-medium text-white">{tDemo("videoAnalysis.screenshot")}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Demo */}
                      <div className="h-[400px] bg-black/30 p-4">
                        <VideoAnalysisDemo />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Image Tab Content */}
            <TabsContent value="image" className="mt-0 focus-visible:outline-none">
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid md:grid-cols-2 gap-8"
              >
                {/* Feature 1: AI Model (With Interactive Demo) */}
                <motion.div variants={item} className="md:col-span-2">
                   <Card className="bg-neutral-900/50 border-white/10 overflow-hidden relative">
                    <div className="grid md:grid-cols-2">
                       <div className="p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10">
                          <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-6 text-pink-300">
                            <Shirt className="w-6 h-6" />
                          </div>
                          <CardTitle className="text-3xl text-white mb-4">{t("image.model.title")}</CardTitle>
                          <CardDescription className="text-lg text-gray-400 mb-8">
                            {t("image.model.description")}
                          </CardDescription>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-2xl mb-2">🌍</div>
                                <div className="text-sm font-medium text-white">{tDemo("image.multiEthnic")}</div>
                             </div>
                             <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-2xl mb-2">👗</div>
                                <div className="text-sm font-medium text-white">{tDemo("image.virtualTryOn")}</div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="h-[400px] bg-black/50 relative">
                          <ImageComparisonDemo />
                       </div>
                    </div>
                   </Card>
                </motion.div>

                {/* Feature 2: Product Enhancement */}
                <motion.div variants={item}>
                  <Card className="h-full bg-gradient-to-br from-blue-500/5 to-transparent border-white/10 hover:border-blue-500/30 transition-all duration-300 group">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-300 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl text-white">{t("image.product.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-400 mb-6">
                        {t("image.product.description")}
                      </CardDescription>
                      <div className="grid grid-cols-3 gap-3">
                         {[
                           { src: "/images/marketing/product-1.png", label: tDemo("image.p1") },
                           { src: "/images/marketing/product-2.png", label: tDemo("image.p2") },
                           { src: "/images/marketing/product-3.png", label: tDemo("image.p3") },
                         ].map((item, i) => (
                           <div key={i} className="aspect-[3/4] min-h-[120px] rounded-lg bg-white/5 border border-white/10 overflow-hidden relative group/card">
                              <img 
                                src={item.src} 
                                alt={item.label} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to gradient if image not found
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              {/* Fallback when image not found */}
                              <div className={`hidden absolute inset-0 bg-gradient-to-br ${i===0 ? 'from-red-500/30' : i===1 ? 'from-blue-500/30' : 'from-emerald-500/30'} to-transparent flex items-center justify-center`}>
                                <span className="text-xs text-white/60">{item.label}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Feature 3: Scene Generation */}
                <motion.div variants={item}>
                  <Card className="h-full bg-gradient-to-br from-purple-500/5 to-transparent border-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-300 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl text-white">{t("image.scene.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-400 mb-6">
                        {t("image.scene.description")}
                      </CardDescription>
                      <SceneSwitchDemo />
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* SEO Tab Content */}
            <TabsContent value="seo" className="mt-0 focus-visible:outline-none">
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid lg:grid-cols-2 gap-8 items-center"
              >
                 <motion.div variants={item} className="order-2 lg:order-1">
                    <div className="relative">
                       <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-20" />
                       <SeoAnalysisDemo />
                    </div>
                 </motion.div>

                 <motion.div variants={item} className="order-1 lg:order-2 p-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 text-emerald-400">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                      {t("seo.analysis.title")}
                    </h3>
                    <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                      {t("seo.analysis.description")}
                    </p>
                    
                    <ul className="space-y-4 mb-8">
                       {[
                         tDemo("seo.viralHashtag"), 
                         tDemo("seo.competitorPov"), 
                         tDemo("seo.localizedDesc")
                       ].map((feat, i) => (
                         <li key={i} className="flex items-center gap-3 text-gray-300">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                               <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                            {feat}
                         </li>
                       ))}
                    </ul>
                 </motion.div>
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
