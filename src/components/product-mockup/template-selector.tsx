"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Shirt, 
  HardHat, 
  ShoppingBag,
  Plus,
  Check,
  ImageIcon,
} from "lucide-react";
import type { ProductTemplate } from "@/types/mockup";
import { PRESET_TEMPLATES } from "@/types/mockup";

interface TemplateSelectorProps {
  selectedTemplate: ProductTemplate | null;
  productImage: string | null;
  onSelectTemplate: (template: ProductTemplate) => void;
  onUploadProduct: (imageDataUrl: string, mimeType: string) => void;
  isProcessing: boolean;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  apparel: Shirt,
  accessories: HardHat,
  bags: ShoppingBag,
  custom: ImageIcon,
};

export function TemplateSelector({
  selectedTemplate,
  productImage,
  onSelectTemplate,
  onUploadProduct,
  isProcessing,
}: TemplateSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onUploadProduct(result, file.type);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onUploadProduct]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Group templates by category
  const groupedTemplates = PRESET_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ProductTemplate[]>);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shirt className="w-4 h-4 text-violet-400" />
          Product Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Custom Image */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full h-20 border-dashed border-2 hover:border-violet-500/50 hover:bg-violet-500/5"
            onClick={handleUploadClick}
            disabled={isProcessing}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Upload Custom Product
              </span>
            </div>
          </Button>
        </div>

        {/* Template Grid */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-4 pr-4">
            {Object.entries(groupedTemplates).map(([category, templates]) => {
              const Icon = categoryIcons[category] || ImageIcon;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => {
                      const isSelected = selectedTemplate?.id === template.id;
                      return (
                        <motion.button
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectTemplate(template)}
                          disabled={isProcessing}
                          className={cn(
                            "relative p-2 rounded-lg border-2 transition-all duration-200",
                            isSelected
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-border/50 hover:border-border bg-background/50 hover:bg-background"
                          )}
                        >
                          {/* Placeholder for template image */}
                          <div className="aspect-square rounded-md bg-muted/30 flex items-center justify-center mb-2 overflow-hidden">
                            <TemplatePlaceholder template={template} />
                          </div>
                          <p className="text-xs font-medium truncate text-center">
                            {template.name}
                          </p>
                          {isSelected && (
                            <div className="absolute top-1 right-1">
                              <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-violet-500 text-white">
                                <Check className="w-3 h-3" />
                              </Badge>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Current Selection Info */}
        {(selectedTemplate || productImage) && (
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-muted-foreground mb-1">Selected:</p>
            <p className="text-sm font-medium text-violet-300">
              {selectedTemplate?.name || "Custom Upload"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Placeholder component for templates (until real images are added)
function TemplatePlaceholder({ template }: { template: ProductTemplate }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "white-tshirt-front": Shirt,
    "black-tshirt-front": Shirt,
    "white-hoodie": Shirt,
    "baseball-cap": HardHat,
    "tote-bag": ShoppingBag,
  };

  const bgColorMap: Record<string, string> = {
    "white-tshirt-front": "bg-gray-100",
    "black-tshirt-front": "bg-gray-800",
    "white-hoodie": "bg-gray-200",
    "baseball-cap": "bg-blue-900",
    "tote-bag": "bg-amber-100",
  };

  const iconColorMap: Record<string, string> = {
    "white-tshirt-front": "text-gray-400",
    "black-tshirt-front": "text-gray-600",
    "white-hoodie": "text-gray-400",
    "baseball-cap": "text-blue-300",
    "tote-bag": "text-amber-600",
  };

  const Icon = iconMap[template.id] || Shirt;
  const bgColor = bgColorMap[template.id] || "bg-gray-100";
  const iconColor = iconColorMap[template.id] || "text-gray-400";

  return (
    <div className={cn("w-full h-full flex items-center justify-center rounded-md", bgColor)}>
      <Icon className={cn("w-8 h-8", iconColor)} />
    </div>
  );
}

