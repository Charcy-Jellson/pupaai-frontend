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
                className="flex flex-col gap-12"
              >
                {/* Feature 1: Video Generation (Text Left, Demo Right) */}
                <motion.div variants={item} className="grid lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Text Content (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-300">
                      <Clapperboard className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        {t("video.generation.title")}
                      </h3>
                      <p className="text-lg text-gray-400 leading-relaxed">
                        {t("video.generation.description")}
                      </p>
                    </div>
                    
                    {/* Feature badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        AI Scripting
                      </Badge>
                      <Badge variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        Multi-Scene
                      </Badge>
                      <Badge variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        Localized
                      </Badge>
                    </div>
                  </div>

                  {/* Right: Demo (7 cols) */}
                  <div className="lg:col-span-7">
                    <div className="relative rounded-2xl border border-white/10 bg-neutral-900/50 overflow-hidden shadow-2xl shadow-violet-500/10 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="relative z-10 p-1">
                         <VideoGenerationDemo />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 2: Analysis (Demo Left, Text Right) */}
                <motion.div variants={item} className="grid lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Demo (7 cols) */}
                  <div className="lg:col-span-7 lg:order-1 order-2">
                    <div className="relative rounded-2xl border border-white/10 bg-neutral-900/50 overflow-hidden shadow-2xl shadow-amber-500/10 group">
                      {/* Window Controls Decoration */}
                      <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                      </div>
                      
                      <div className="p-1 bg-black/20">
                        <div className="h-[500px] w-full">
                          <VideoAnalysisDemo />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Text Content (5 cols) */}
                  <div className="lg:col-span-5 lg:order-2 order-1 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                      <ScanLine className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <h3 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                          {t("video.analysis.title")}
                        </h3>
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                          {t("video.analysis.badge")}
                        </Badge>
                      </div>
                      <p className="text-lg text-gray-400 leading-relaxed">
                        {t("video.analysis.description")}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                          <div className="text-sm">📹</div>
                        </div>
                        <div className="text-sm font-medium text-white">{tDemo("videoAnalysis.upload")} / YouTube</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                          <div className="text-sm">📊</div>
                        </div>
                        <div className="text-sm font-medium text-white">{tDemo("videoAnalysis.screenshot")}</div>
                      </div>
                    </div>
                  </div>
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
