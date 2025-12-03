"use client";

import { motion } from "framer-motion";
import { Shirt, Sparkles, Info } from "lucide-react";
import { useMockupEditor } from "@/hooks/use-mockup-editor";
import { TemplateSelector, LogoCanvas, MockupPreview } from "@/components/product-mockup";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProductMockupPage() {
  const {
    state,
    selectTemplate,
    setProductImage,
    setLogoImage,
    updateLogoPosition,
    resetLogoPosition,
    generateMockup,
    downloadMockup,
    clearError,
  } = useMockupEditor();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Product Mockup</h1>
            <p className="text-sm text-muted-foreground">
              Create realistic product mockups with AI-powered logo placement
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Alert className="bg-violet-500/10 border-violet-500/30">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <AlertDescription className="text-sm text-muted-foreground">
            <strong className="text-violet-300">How it works:</strong> Select a product template, upload your logo, position it using drag & drop,
            then click Generate to create a realistic mockup with AI.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Templates & Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 space-y-4"
        >
          <TemplateSelector
            selectedTemplate={state.selectedTemplate}
            productImage={state.productImage}
            onSelectTemplate={selectTemplate}
            onUploadProduct={setProductImage}
            isProcessing={state.isProcessing}
          />
        </motion.div>

        {/* Center - Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-6"
        >
          <LogoCanvas
            productImage={state.productImage}
            logoImage={state.logoImage}
            logoPosition={state.logoPosition}
            selectedTemplate={state.selectedTemplate}
            onPositionChange={updateLogoPosition}
            onResetPosition={resetLogoPosition}
            onUploadLogo={setLogoImage}
            generatedMockup={state.generatedMockup}
            isProcessing={state.isProcessing}
          />
        </motion.div>

        {/* Right Sidebar - Generate & Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <MockupPreview
            productImage={state.productImage}
            logoImage={state.logoImage}
            generatedMockup={state.generatedMockup}
            isProcessing={state.isProcessing}
            error={state.error}
            onGenerate={() => generateMockup()}
            onDownload={() => downloadMockup()}
            onClearError={clearError}
          />
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
      >
        <TipCard
          number="1"
          title="Choose Product"
          description="Select from preset templates or upload your own product image"
        />
        <TipCard
          number="2"
          title="Position Logo"
          description="Upload your logo and drag it to the desired position. Adjust scale and rotation."
        />
        <TipCard
          number="3"
          title="Generate"
          description="AI will create a realistic mockup with proper lighting and fabric texture"
        />
      </motion.div>
    </div>
  );
}

function TipCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-card/30 border border-border/50 hover:border-violet-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-violet-400">{number}</span>
        </div>
        <div>
          <h3 className="font-medium text-white mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

