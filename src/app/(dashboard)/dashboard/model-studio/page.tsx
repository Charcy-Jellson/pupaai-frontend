"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ModelStudioPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative p-12 text-center">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10" />
            
            {/* Content */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/25">
                <Palette className="w-10 h-10 text-white" />
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Coming Soon
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Model Studio
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                Create and train custom AI models for your specific use cases. 
                Generate unique images, styles, and more with your own trained models.
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
                  title: "Custom Model Training",
                  description: "Train AI models on your own datasets",
                },
                {
                  title: "Style Transfer",
                  description: "Apply custom styles to any image",
                },
                {
                  title: "Fine-tuning",
                  description: "Fine-tune models for specific outputs",
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


