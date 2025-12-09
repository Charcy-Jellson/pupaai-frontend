"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function VideoToolsPage() {
  const t = useTranslations();

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative p-12 text-center">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10" />
            
            {/* Content */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/25">
                <Video className="w-10 h-10 text-white" />
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                {t("features.videoTools.badge")}
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                {t("sidebar.videoTools")}
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                {t("features.videoTools.description")}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard/image-tools">
                  <Button variant="gradient">
                    {t("sidebar.imageTools")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline">
                  Notify Me
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
