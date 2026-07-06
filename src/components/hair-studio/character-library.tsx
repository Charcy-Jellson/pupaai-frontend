"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Pencil, Check, Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileUrl, type CharacterRecord } from "@/lib/supabase";

interface CharacterLibraryProps {
  characters: CharacterRecord[];
  onSelect: (c: CharacterRecord) => void;
  onDelete: (c: CharacterRecord) => void;
  onRename: (id: string, name: string) => void;
  onCreateNew: () => void;
  onImportCard: (cardDataUrl: string, name: string) => Promise<boolean>;
}

// Browsers (Chrome in particular) cannot decode HEIC/HEIF, which is the
// default photo format on iPhone/macOS. Accept only formats every major
// browser can actually decode, matching the app's other image uploaders.
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const readFile = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });

// Verify the browser can actually decode the image data (not just that the
// file extension/MIME type looked right). Unsupported formats throw a
// DOMException here ("The source image cannot be decoded.") — callers
// should catch this and surface a translated, actionable message instead.
const assertDecodable = (dataUrl: string): Promise<void> => {
  const img = new Image();
  img.src = dataUrl;
  return img.decode();
};

export function CharacterLibrary({
  characters, onSelect, onDelete, onRename, onCreateNew, onImportCard,
}: CharacterLibraryProps) {
  const t = useTranslations("hairStudio");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingCardDataUrl, setPendingCardDataUrl] = useState<string | null>(null);
  const [importName, setImportName] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Shared handler for both the click-to-upload input and drag-and-drop.
  // Dropped files bypass the <input accept> filter, so the MIME type is
  // validated here, and the image is decode-checked so unsupported formats
  // surface a clear, translated error instead of a raw DOMException.
  const processFile = async (file: File) => {
    setImportError(null);
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setImportError(t("invalidImage"));
      return;
    }
    const dataUrl = await readFile(file);
    try {
      await assertDecodable(dataUrl);
    } catch {
      setImportError(t("invalidImage"));
      return;
    }
    setPendingCardDataUrl(dataUrl);
    setImportName("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    await processFile(file);
  };

  const closeImportDialog = () => {
    setPendingCardDataUrl(null);
    setImportName("");
  };

  const confirmImport = async () => {
    if (!pendingCardDataUrl) return;
    setIsImporting(true);
    const ok = await onImportCard(pendingCardDataUrl, importName.trim());
    setIsImporting(false);
    if (ok) closeImportDialog();
  };

  return (
    <div className="space-y-4">
      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer border-dashed hover:border-primary/60 transition-colors"
          onClick={onCreateNew}
        >
          <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
            <Plus className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("newCharacter")}</p>
          </CardContent>
        </Card>

        <label
          className={cn(
            "cursor-pointer border-2 border-dashed rounded-lg transition-colors block",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/60"
          )}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
            <Upload className={cn("w-8 h-8", isDragging ? "text-primary" : "text-muted-foreground")} />
            <p className={cn("text-sm text-center px-2", isDragging ? "text-primary" : "text-muted-foreground")}>
              {isDragging ? t("dropHere") : t("importCard")}
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </label>

        {characters.map((c) => (
          <Card key={c.id} className="overflow-hidden group">
            <div className="h-36 bg-muted cursor-pointer" onClick={() => onSelect(c)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFileUrl(c.card_storage_path)}
                alt={c.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-2 flex items-center justify-between gap-1">
              {editing === c.id ? (
                <>
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onRename(c.id, draft.trim() || c.name); setEditing(null); }
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => {
                      onRename(c.id, draft.trim() || c.name);
                      setEditing(null);
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs truncate">{c.name}</p>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => { setEditing(c.id); setDraft(c.name); }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!pendingCardDataUrl} onOpenChange={(open) => { if (!open) closeImportDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("importCardName")}</DialogTitle>
          </DialogHeader>
          {pendingCardDataUrl && (
            <div className="w-full h-48 rounded-lg overflow-hidden border border-border/50 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingCardDataUrl} alt="card preview" className="w-full h-full object-contain" />
            </div>
          )}
          <Input
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            placeholder={t("characterName")}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") confirmImport(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeImportDialog} disabled={isImporting}>
              {t("back")}
            </Button>
            <Button onClick={confirmImport} disabled={isImporting}>
              {t("importCard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
