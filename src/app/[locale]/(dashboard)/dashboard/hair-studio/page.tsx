"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useUser, useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHairStudio } from "@/hooks/use-hair-studio";
import {
  CharacterLibrary,
  CharacterCardBuilder,
  SpriteGenerator,
  SceneComposer,
  HairResultsGallery,
} from "@/components/hair-studio";
import { SelectFolderDialog } from "@/components/common/select-folder-dialog";
import { saveFileFromDataUrl } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { HairStudioStep, FuseResultItem } from "@/types/hair-studio";

const STEPS: { id: HairStudioStep; labelKey: string }[] = [
  { id: 1, labelKey: "steps.character" },
  { id: 2, labelKey: "steps.sprites" },
  { id: 3, labelKey: "steps.compose" },
];

export default function HairStudioPage() {
  const t = useTranslations("hairStudio");
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const hs = useHairStudio(user?.id, getToken);

  const [buildingNew, setBuildingNew] = useState(false);
  const [savingResult, setSavingResult] = useState<FuseResultItem | null>(null);

  useEffect(() => {
    if (user?.id) {
      hs.loadCharacters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleDownload = (result: FuseResultItem) => {
    if (!result.resultDataUrl) return;
    const a = document.createElement("a");
    a.href = result.resultDataUrl;
    a.download = `hair-${result.id}.png`;
    a.click();
  };

  const handleSave = (result: FuseResultItem) => {
    setSavingResult(result);
  };

  const handleFolderSelected = async (folderId: string | null) => {
    if (!user?.id || !savingResult?.resultDataUrl) {
      setSavingResult(null);
      return;
    }
    const saved = await saveFileFromDataUrl(
      user.id,
      savingResult.resultDataUrl,
      `hair-${Date.now()}.png`,
      folderId
    );
    if (saved) {
      toast({
        title: t("saved"),
        description: t("savedDesc"),
      });
    } else {
      toast({
        title: t("saveFailed"),
        description: t("saveFailedDesc"),
        variant: "destructive",
      });
    }
    setSavingResult(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </motion.div>

      {/* Error Alert */}
      {hs.state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {hs.state.error}
            <Button variant="ghost" size="sm" onClick={hs.clearError}>
              {t("dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => {
          const isActive = hs.state.step === step.id;
          const isComplete = hs.state.step > step.id;
          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => hs.setStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors",
                  isActive
                    ? "border-pink-400 bg-pink-500/15 text-pink-300"
                    : isComplete
                    ? "border-pink-400/40 bg-pink-500/5 text-pink-200/80"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:border-pink-300 hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                    isActive
                      ? "bg-pink-400 text-white"
                      : isComplete
                      ? "bg-pink-400/60 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="w-3 h-3" /> : step.id}
                </span>
                {t(step.labelKey)}
              </button>
              {index < STEPS.length - 1 && (
                <div className="w-8 h-px bg-border/50 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Body */}
      {hs.state.step === 1 &&
        (buildingNew ? (
          <CharacterCardBuilder
            builder={hs.state.cardBuilder}
            onChange={hs.setCardBuilder}
            onGenerate={hs.generateCard}
            isGenerating={hs.state.isGeneratingCard}
            generatedCardDataUrl={hs.state.generatedCardDataUrl}
            onSave={async () => {
              const ok = await hs.saveCharacter();
              if (ok) setBuildingNew(false);
            }}
            onBack={() => setBuildingNew(false)}
          />
        ) : (
          <CharacterLibrary
            characters={hs.state.characters}
            onSelect={hs.selectCharacter}
            onDelete={hs.removeCharacter}
            onRename={hs.renameCharacterInList}
            onCreateNew={() => setBuildingNew(true)}
          />
        ))}

      {hs.state.step === 2 && (
        <SpriteGenerator
          sprites={hs.state.sprites}
          onGenerate={hs.generateSprites}
          onRegenerate={hs.regenerateSprite}
          onNext={() => hs.setStep(3)}
          onBack={() => hs.setStep(1)}
        />
      )}

      {hs.state.step === 3 && (
        <>
          <SceneComposer
            sprites={hs.state.sprites}
            backgroundDataUrl={hs.state.backgroundDataUrl}
            imageSize={hs.state.imageSize}
            onSetBackground={hs.setBackground}
            onSetImageSize={hs.setImageSize}
            onCompose={(spriteId, draft, tf) => {
              const id = hs.addFuseResult(spriteId, hs.state.backgroundDataUrl!, tf, draft);
              hs.runFuse(id);
            }}
            onBack={() => hs.setStep(2)}
          />
          <HairResultsGallery
            results={hs.state.results}
            onRun={hs.runFuse}
            onRerun={hs.runFuse}
            onSave={handleSave}
            onDownload={handleDownload}
          />
        </>
      )}

      {user?.id && (
        <SelectFolderDialog
          userId={user.id}
          open={!!savingResult}
          onOpenChange={(open) => {
            if (!open) setSavingResult(null);
          }}
          onSelectFolder={handleFolderSelected}
        />
      )}
    </div>
  );
}
