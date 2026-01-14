# Types Directory Architecture

TypeScript type definitions for the application.

---

## Directory Structure

```
types/
├── index.ts           # Common types & barrel exports
├── mockup.ts          # Product mockup types
├── model-studio.ts    # Model studio types
├── logo-studio.ts     # Logo studio types
└── video-tools.ts     # Video tools types
```

---

## Files

### index.ts

**Purpose:** Common types used across the application.

**Image Types:**
```typescript
export interface ImageData {
  id: string;
  dataUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  name?: string;
}

export interface ImageEditorState {
  originalImage: string | null;
  currentImage: string | null;
  mimeType: string;
  operations: ImageOperation[];
  isProcessing: boolean;
}

export interface ImageOperation {
  id: string;
  type: OperationType;
  timestamp: Date;
  resultUrl: string;
  params?: Record<string, unknown>;
}

export type OperationType =
  | 'crop'
  | 'rotate'
  | 'compress'
  | 'remove_background'
  | 'extract_logo'
  | 'remove_logo';
```

**File Management Types:**
```typescript
export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  created_at: string;
}
```

**User Types:**
```typescript
export type UserRole = 'admin' | 'user';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}
```

---

### mockup.ts

**Purpose:** Types for product mockup feature.

```typescript
export interface LogoPosition {
  x: number;        // 0-100 (percentage from left)
  y: number;        // 0-100 (percentage from top)
  scale: number;    // 0.1-3.0
  rotation: number; // -180 to 180 degrees
}

export interface MockupGenerateRequest {
  product_image_base64: string;
  product_mime_type: string;
  logo_image_base64: string;
  logo_mime_type: string;
  logo_position: LogoPosition;
}

export interface MockupRecolorRequest {
  mockup_image_base64: string;
  mockup_mime_type: string;
  target_color: string; // Hex color
}

export interface ColorVariant {
  id: string;
  color: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface MockupEditorState {
  productImage: ImageData | null;
  logoImage: ImageData | null;
  logoPosition: LogoPosition;
  compositeResult: string | null;
  colorVariants: ColorVariant[];
  isGenerating: boolean;
}
```

---

### model-studio.ts

**Purpose:** Types for AI model studio feature.

```typescript
export type Ethnicity = 'caucasian' | 'black' | 'asian' | 'hispanic';
export type Gender = 'male' | 'female';
export type HairLength = 'long' | 'short';
export type AgeGroup = 'teen' | 'adult' | 'middle_aged';
export type Scene = 'original' | 'home' | 'street' | 'office';
export type Pose = 'front_standing' | 'side_standing' | 'front_sitting';
export type PantsType = 'yoga_pants' | 'jeans';

export interface ModelGenerateOptions {
  ethnicity: Ethnicity;
  gender: Gender;
  hair_length: HairLength;
  glasses: boolean;
  age_group: AgeGroup;
}

export interface DressModelRequest {
  model_image_base64: string;
  model_mime_type: string;
  clothing_image_base64: string;
  clothing_mime_type: string;
  scene: Scene;
  pose: Pose;
  pants_type: PantsType;
}

export interface ClothingItem {
  id: string;
  imageUrl: string;
  name?: string;
}

export interface GenerationOptions {
  scene: Scene;
  poses: Pose[];
  pantsType: PantsType;
}

export interface GeneratedResult {
  id: string;
  clothing: ClothingItem;
  pose: Pose;
  scene: Scene;
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ModelStudioState {
  model: ImageData | null;
  clothing: ClothingItem[];
  options: GenerationOptions;
  results: GeneratedResult[];
  isGenerating: boolean;
}
```

---

### logo-studio.ts

**Purpose:** Types for logo generation feature.

```typescript
export type LogoStyle =
  | 'modern'
  | 'vintage'
  | 'playful'
  | 'professional'
  | 'abstract'
  | 'mascot';

export interface ColorConfig {
  primary: string;
  secondary: string;
}

export interface LogoGenerateRequest {
  prompt: string;
  style: LogoStyle;
  primary_color: string;
  secondary_color: string;
}

export interface LogoHistoryItem {
  id: string;
  prompt: string;
  style: LogoStyle;
  colors: ColorConfig;
  imageUrl: string;
  createdAt: Date;
}

export interface LogoStudioState {
  prompt: string;
  style: LogoStyle;
  colors: ColorConfig;
  generatedLogo: string | null;
  history: LogoHistoryItem[];
  isGenerating: boolean;
}
```

---

### video-tools.ts

**Purpose:** Types for video processing features.

```typescript
export interface ImageToVideoConfig {
  image_base64: string;
  mime_type: string;
  animation_style: 'zoom' | 'pan' | 'rotate' | 'fade';
  duration: number; // seconds
}

export interface TextToVideoConfig {
  prompt: string;
  style: 'realistic' | 'animated' | 'cinematic';
  duration: number;
  aspect_ratio: '16:9' | '9:16' | '1:1';
}

export interface VideoAnalysisResult {
  description: string;
  scenes: SceneInfo[];
  objects: DetectedObject[];
}

export interface SceneInfo {
  timestamp: number;
  description: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  timestamp: number;
}
```

---

## Type Patterns

### Request/Response Types

Follow naming convention:
- `{Feature}Request` - API request body
- `{Feature}Response` - API response body

```typescript
export interface FeatureRequest {
  input_field: string;
}

export interface FeatureResponse {
  result: string;
  metadata?: Record<string, unknown>;
}
```

### State Types

Follow naming convention:
- `{Feature}State` - Hook state shape

```typescript
export interface FeatureState {
  data: DataType | null;
  isLoading: boolean;
  error: string | null;
}
```

### Enum-like Types

Use union types instead of enums:

```typescript
// Preferred
export type Status = 'pending' | 'processing' | 'completed' | 'error';

// Avoid
export enum Status {
  Pending = 'pending',
  Processing = 'processing',
}
```

---

## Adding New Types

1. Determine the appropriate file:
   - Common types → `index.ts`
   - Feature-specific → `feature-name.ts`

2. Add types with JSDoc comments:
```typescript
/**
 * Configuration for new feature
 */
export interface NewFeatureConfig {
  /** Option description */
  option: string;
}
```

3. Export from barrel if in separate file:
```typescript
// index.ts
export * from './new-feature';
```

4. Update this documentation

---

## Related Documentation

- [Hooks](../hooks/ARCHITECTURE.md) - Type usage in hooks
- [API Client](../lib/ARCHITECTURE.md) - API type definitions
- [Components](../components/ARCHITECTURE.md) - Component props
