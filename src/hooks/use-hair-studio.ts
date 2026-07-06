"use client";

import { useState, useCallback } from "react";
import * as api from "@/lib/api";
import {
  getUserCharacters, createCharacter, deleteCharacter, renameCharacter,
  uploadCharacterAsset, getFileUrl, type CharacterRecord,
} from "@/lib/supabase";
import {
  HairStudioState, DEFAULT_CARD_BUILDER, CardBuilderState, SpriteItem, FuseResultItem,
  PlacementTransform, HairStudioStep,
} from "@/types/hair-studio";

const initialState: HairStudioState = {
  step: 1, characters: [], selectedCharacter: null, selectedCardDataUrl: null,
  cardBuilder: DEFAULT_CARD_BUILDER, isGeneratingCard: false, generatedCardDataUrl: null,
  sprites: [], backgroundDataUrl: null, imageSize: "1K", results: [], error: null,
};

let idCounter = 0;
const genId = (p: string) => `${p}-${Date.now()}-${++idCounter}`;
const stripDataUrl = (d: string) => d.split(",")[1];

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

export function useHairStudio(userId?: string, getToken?: () => Promise<string | null>) {
  const [state, setState] = useState<HairStudioState>(initialState);
  const token = useCallback(async () => (await getToken?.()) ?? undefined, [getToken]);

  const cardDescOf = (c: CharacterRecord | null) =>
    [c?.face_desc, c?.hair_desc, c?.outfit_desc].filter(Boolean).join("; ") ||
    "the woman from the character model sheet";

  // ---- Step 1: character library & card builder ----

  const loadCharacters = useCallback(async () => {
    if (!userId) return;
    const characters = await getUserCharacters(userId);
    setState((p) => ({ ...p, characters }));
  }, [userId]);

  const generateCard = useCallback(async () => {
    const b = state.cardBuilder;
    setState((p) => ({ ...p, isGeneratingCard: true, error: null }));
    const res = await api.generateCharacterCard({
      face_image_base64: b.faceImage ? stripDataUrl(b.faceImage) : undefined,
      hair_image_base64: b.hairImage ? stripDataUrl(b.hairImage) : undefined,
      outfit_image_base64: b.outfitImage ? stripDataUrl(b.outfitImage) : undefined,
      face_desc: b.faceDesc || undefined,
      hair_desc: b.hairDesc || undefined,
      outfit_desc: b.outfitDesc || undefined,
    }, undefined, await token());
    if (res.success && res.data) {
      setState((p) => ({ ...p, isGeneratingCard: false,
        generatedCardDataUrl: `data:${res.data!.mime_type};base64,${res.data!.image_base64}` }));
    } else {
      setState((p) => ({ ...p, isGeneratingCard: false, error: res.error || "Failed to generate card" }));
    }
  }, [state.cardBuilder, token]);

  const saveCharacter = useCallback(async (): Promise<boolean> => {
    if (!userId || !state.generatedCardDataUrl) return false;
    const tempId = crypto.randomUUID();
    const cardPath = await uploadCharacterAsset(userId, tempId, "card", state.generatedCardDataUrl);
    if (!cardPath) {
      setState((p) => ({ ...p, error: "Failed to upload card" }));
      return false;
    }
    const b = state.cardBuilder;
    const row = await createCharacter(userId, {
      name: b.name || `Character ${new Date().toLocaleDateString()}`,
      card_storage_path: cardPath,
      face_desc: b.faceDesc || null, hair_desc: b.hairDesc || null, outfit_desc: b.outfitDesc || null,
      face_ref_path: null, hair_ref_path: null, outfit_ref_path: null, seed: 42,
    });
    if (!row) {
      setState((p) => ({ ...p, error: "Failed to save character" }));
      return false;
    }
    setState((p) => ({
      ...p, characters: [row, ...p.characters], selectedCharacter: row,
      selectedCardDataUrl: p.generatedCardDataUrl, generatedCardDataUrl: null,
      cardBuilder: DEFAULT_CARD_BUILDER, step: 2,
    }));
    return true;
  }, [userId, state.generatedCardDataUrl, state.cardBuilder]);

  const selectCharacter = useCallback(async (c: CharacterRecord) => {
    // Load the stored card image as a data URL for later API calls
    const url = getFileUrl(c.card_storage_path);
    const blob = await (await fetch(url)).blob();
    const dataUrl = await blobToDataUrl(blob);
    setState((p) => ({ ...p, selectedCharacter: c, selectedCardDataUrl: dataUrl, step: 2 }));
  }, []);

  const removeCharacter = useCallback(async (c: CharacterRecord) => {
    if (await deleteCharacter(c.id, c.card_storage_path)) {
      setState((p) => ({ ...p, characters: p.characters.filter((x) => x.id !== c.id) }));
    }
  }, []);

  const renameCharacterInList = useCallback(async (id: string, name: string) => {
    if (await renameCharacter(id, name)) {
      setState((p) => ({ ...p, characters: p.characters.map((c) => c.id === id ? { ...c, name } : c) }));
    }
  }, []);

  // ---- Step 2: sprites ----

  const generateSprites = useCallback(async (
    angles: api.SpriteAngle[], composition: api.SpriteComposition,
    pose: api.SpritePose, action: string,
  ) => {
    const card = state.selectedCardDataUrl;
    if (!card) return;
    const items: SpriteItem[] = angles.map((angle) => ({
      id: genId("sprite"), angle, composition, pose, action,
      imageDataUrl: null, status: "processing", error: null,
    }));
    setState((p) => ({ ...p, sprites: [...p.sprites, ...items] }));
    await Promise.allSettled(items.map(async (item) => {
      const res = await api.generatePoseSprite({
        card_image_base64: stripDataUrl(card), card_desc: cardDescOf(state.selectedCharacter),
        angle: item.angle, composition: item.composition, pose: item.pose,
        action: item.action || undefined,
      }, undefined, await token());
      setState((p) => ({
        ...p,
        sprites: p.sprites.map((s) => s.id !== item.id ? s : (res.success && res.data
          ? { ...s, status: "fulfilled" as const, imageDataUrl: `data:image/png;base64,${res.data.image_base64}` }
          : { ...s, status: "rejected" as const, error: res.error || "Failed" })),
      }));
    }));
  }, [state.selectedCardDataUrl, state.selectedCharacter, token]);

  const regenerateSprite = useCallback(async (spriteId: string, newAction?: string) => {
    const s = state.sprites.find((x) => x.id === spriteId);
    const card = state.selectedCardDataUrl;
    if (!s || !card) return;
    setState((p) => ({ ...p, sprites: p.sprites.map((x) => x.id === spriteId
      ? { ...x, status: "processing" as const, error: null, action: newAction ?? x.action } : x) }));
    const res = await api.generatePoseSprite({
      card_image_base64: stripDataUrl(card), card_desc: cardDescOf(state.selectedCharacter),
      angle: s.angle, composition: s.composition, pose: s.pose,
      action: (newAction ?? s.action) || undefined,
    }, undefined, await token());
    setState((p) => ({ ...p, sprites: p.sprites.map((x) => x.id !== spriteId ? x : (res.success && res.data
      ? { ...x, status: "fulfilled" as const, imageDataUrl: `data:image/png;base64,${res.data.image_base64}` }
      : { ...x, status: "rejected" as const, error: res.error || "Failed" })) }));
  }, [state.sprites, state.selectedCardDataUrl, state.selectedCharacter, token]);

  // ---- Step 3: fuse ----

  const addFuseResult = useCallback((spriteId: string, backgroundDataUrl: string,
                                     transform: PlacementTransform,
                                     draftDataUrl: string): string => {
    const item: FuseResultItem = {
      id: genId("fuse"), spriteId, backgroundDataUrl, transform, draftDataUrl,
      resultDataUrl: null, status: "pending", error: null,
    };
    setState((p) => ({ ...p, results: [...p.results, item] }));
    return item.id;
  }, []);

  const runFuse = useCallback(async (resultId: string) => {
    const item = state.results.find((r) => r.id === resultId);
    if (!item?.draftDataUrl) return;
    setState((p) => ({ ...p, results: p.results.map((r) => r.id === resultId
      ? { ...r, status: "processing" as const, error: null } : r) }));
    const res = await api.fuseScene({
      draft_image_base64: stripDataUrl(item.draftDataUrl),
      draft_mime_type: "image/png", image_size: state.imageSize,
    }, undefined, await token());
    setState((p) => ({ ...p, results: p.results.map((r) => r.id !== resultId ? r : (res.success && res.data
      ? { ...r, status: "fulfilled" as const, resultDataUrl: `data:${res.data.mime_type};base64,${res.data.image_base64}` }
      : { ...r, status: "rejected" as const, error: res.error || "Failed" })) }));
  }, [state.results, state.imageSize, token]);

  // ---- misc ----

  const setStep = useCallback((step: HairStudioStep) => setState((p) => ({ ...p, step })), []);
  const setCardBuilder = useCallback((patch: Partial<CardBuilderState>) =>
    setState((p) => ({ ...p, cardBuilder: { ...p.cardBuilder, ...patch } })), []);
  const setBackground = useCallback((dataUrl: string | null) =>
    setState((p) => ({ ...p, backgroundDataUrl: dataUrl })), []);
  const setImageSize = useCallback((s: HairStudioState["imageSize"]) =>
    setState((p) => ({ ...p, imageSize: s })), []);
  const clearError = useCallback(() => setState((p) => ({ ...p, error: null })), []);

  return {
    state, setStep, loadCharacters, selectCharacter, removeCharacter, renameCharacterInList,
    setCardBuilder, generateCard, saveCharacter,
    generateSprites, regenerateSprite,
    setBackground, setImageSize, addFuseResult, runFuse,
    clearError,
  };
}
