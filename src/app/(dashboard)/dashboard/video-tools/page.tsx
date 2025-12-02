"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function VideoToolsPage() {
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
                Coming Soon
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Video Tools
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                AI-powered video editing, generation, and enhancement. 
                Create stunning videos with the power of OpenAI Sora and more.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard/image-tools">
                  <Button variant="gradient">
                    Try Image Tools
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline">
                  Notify Me
                </Button>
              </div>
            </div>
          </div>
          
          {/* Features Preview */}
          <div className="border-t border-border/50 p-8 bg-muted/20">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
              PLANNED FEATURES
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: "AI Video Generation",
                  description: "Generate videos from text prompts using Sora",
                },
                {
                  title: "Video Enhancement",
                  description: "Upscale and enhance video quality",
                },
                {
                  title: "Smart Editing",
                  description: "AI-assisted video editing tools",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-lg bg-card/50 border border-border/50"
                >
                  <h4 className="font-medium text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




