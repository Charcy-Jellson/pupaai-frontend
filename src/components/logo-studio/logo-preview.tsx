"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import {
  Image as ImageIcon,
  Download,
  Pencil,
  Wand2,
  Save,
  X,
} from "lucide-react";

interface LogoPreviewProps {
  currentLogo: string | null;
  editInstruction: string;
  onEditInstructionChange: (value: string) => void;
  onEdit: () => void;
  onDownload: () => void;
  onSave?: () => void;
  isEditing: boolean;
  disabled?: boolean;
}

export function LogoPreview({
  currentLogo,
  editInstruction,
  onEditInstructionChange,
  onEdit,
  onDownload,
  onSave,
  isEditing,
  disabled = false,
}: LogoPreviewProps) {
  const [showEditPanel, setShowEditPanel] = useState(false);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Area */}
        <div className="aspect-square rounded-lg overflow-hidden bg-[url('/checkerboard.svg')] bg-repeat bg-[length:20px_20px] border border-border/50">
          {currentLogo ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={currentLogo}
              alt="Generated logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-3" />
              <p className="text-sm">Your logo will appear here</p>
              <p className="text-xs mt-1">Enter a description to generate</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {currentLogo && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                disabled={disabled}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={disabled}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>

            {/* Edit Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditPanel(!showEditPanel)}
              disabled={disabled}
              className="w-full"
            >
              {showEditPanel ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Edit
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Logo
                </>
              )}
            </Button>

            {/* Edit Panel */}
            {showEditPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Textarea
                  placeholder="Describe how you want to modify the logo... e.g., 'Make the colors brighter' or 'Add more detail to the edges'"
                  value={editInstruction}
                  onChange={(e) => onEditInstructionChange(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={disabled || isEditing}
                />
                <Button
                  onClick={() => {
                    onEdit();
                    setShowEditPanel(false);
                  }}
                  disabled={disabled || isEditing || !editInstruction.trim()}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                >
                  {isEditing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Editing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Apply Changes
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

