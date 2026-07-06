import type { SpriteAngle, SpriteComposition, SpritePose, FuseImageSize } from "@/lib/api";
import type { CharacterRecord } from "@/lib/supabase";

export type HairStudioStep = 1 | 2 | 3;
export type ItemStatus = "pending" | "processing" | "fulfilled" | "rejected";

export interface CardBuilderState {
  name: string;
  faceImage: string | null;    // data URL
  hairImage: string | null;
  outfitImage: string | null;
  faceDesc: string;
  hairDesc: string;
  outfitDesc: string;
}

export interface SpriteItem {
  id: string;
  angle: SpriteAngle;
  composition: SpriteComposition;
  pose: SpritePose;
  action: string;
  imageDataUrl: string | null;  // transparent PNG data URL
  status: ItemStatus;
  error: string | null;
}

// A single shot request in the Step 2 shot list — each shot carries its own
// angle + composition + pose + optional action (e.g. one STANDING front +
// one SITTING back in the same batch).
export interface SpriteShot {
  angle: SpriteAngle;
  composition: SpriteComposition;
  pose: SpritePose;
  action: string;
}

export interface PlacementTransform { x: number; y: number; scale: number }

export interface FuseResultItem {
  id: string;
  spriteId: string;
  backgroundDataUrl: string;
  transform: PlacementTransform;
  draftDataUrl: string | null;
  resultDataUrl: string | null;
  status: ItemStatus;
  error: string | null;
}

export interface HairStudioState {
  step: HairStudioStep;
  characters: CharacterRecord[];
  selectedCharacter: CharacterRecord | null;
  selectedCardDataUrl: string | null; // card image loaded for API calls
  cardBuilder: CardBuilderState;
  isGeneratingCard: boolean;
  generatedCardDataUrl: string | null; // preview before save
  sprites: SpriteItem[];
  backgroundDataUrl: string | null;
  imageSize: FuseImageSize;
  results: FuseResultItem[];
  error: string | null;
}

export const DEFAULT_CARD_BUILDER: CardBuilderState = {
  name: "", faceImage: null, hairImage: null, outfitImage: null,
  faceDesc: "", hairDesc: "", outfitDesc: "",
};

export const ANGLE_OPTIONS: { id: SpriteAngle; labelKey: string }[] = [
  { id: "front", labelKey: "angles.front" },
  { id: "side", labelKey: "angles.side" },
  { id: "back", labelKey: "angles.back" },
  { id: "three_quarter", labelKey: "angles.threeQuarter" },
];
