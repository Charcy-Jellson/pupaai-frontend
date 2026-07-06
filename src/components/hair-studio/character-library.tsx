"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import { getFileUrl, type CharacterRecord } from "@/lib/supabase";

interface CharacterLibraryProps {
  characters: CharacterRecord[];
  onSelect: (c: CharacterRecord) => void;
  onDelete: (c: CharacterRecord) => void;
  onRename: (id: string, name: string) => void;
  onCreateNew: () => void;
}

export function CharacterLibrary({
  characters, onSelect, onDelete, onRename, onCreateNew,
}: CharacterLibraryProps) {
  const t = useTranslations("hairStudio");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
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
  );
}
