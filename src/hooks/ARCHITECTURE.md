# Hooks Directory Architecture

Custom React hooks for state management and business logic.

---

## Directory Structure

```
hooks/
├── index.ts                      # Barrel exports
├── use-image-editor.ts           # Image editing state & operations
├── use-mockup-editor.ts          # Product mockup state & operations
├── use-model-studio.ts           # AI model studio state
├── use-logo-studio.ts            # Logo generation state
├── use-multi-image-editor.ts     # Batch image processing
├── use-user-role.ts              # User role checking
├── use-toast.ts                  # Toast notifications
├── use-registration-enabled.ts   # Registration toggle
└── use-body-scroll-lock-fix.ts   # Body scroll lock utility
```

---

## Core Feature Hooks

### useImageEditor

**File:** `use-image-editor.ts`

Manages image editing state and operations.

**State:**
```typescript
interface ImageEditorState {
  originalImage: string | null;  // Original image data URL
  currentImage: string | null;   // Current processed image
  mimeType: string;              // Image MIME type
  operations: ImageOperation[];  // Operation history
  isProcessing: boolean;         // Loading state
}
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `state` | `ImageEditorState` | Current state |
| `setImage` | `(dataUrl, mimeType) => void` | Set image |
| `clearImage` | `() => void` | Clear image |
| `addOperation` | `(operation) => void` | Add to history |
| `undoLastOperation` | `() => void` | Undo last |
| `removeBackground` | `(modelId?) => Promise<void>` | AI background removal |
| `extractLogo` | `(modelId?) => Promise<void>` | AI logo extraction |
| `removeLogo` | `(modelId?) => Promise<void>` | AI logo removal |
| `cropImage` | `(crop) => Promise<void>` | Crop image |
| `rotateImage` | `(angle) => void` | Rotate image |
| `compressImage` | `(quality) => Promise<void>` | Compress image |

**Usage:**
```tsx
const {
  state: { currentImage, isProcessing },
  setImage,
  removeBackground,
  extractLogo,
} = useImageEditor();
```

---

### useMockupEditor

**File:** `use-mockup-editor.ts`

Manages product mockup generation workflow.

**State:**
```typescript
interface MockupEditorState {
  productImage: ImageData | null;
  logoImage: ImageData | null;
  logoPosition: LogoPosition;
  compositeResult: string | null;
  colorVariants: ColorVariant[];
  isGenerating: boolean;
}
```

**Key Methods:**
| Method | Description |
|--------|-------------|
| `setProductImage` | Set product image |
| `setLogoImage` | Set logo image |
| `setLogoPosition` | Update logo position |
| `generateComposite` | Generate logo-on-product |
| `generateColorVariants` | Generate color variants |

---

### useModelStudio

**File:** `use-model-studio.ts`

Manages AI fashion model generation and dressing.

**State:**
```typescript
interface ModelStudioState {
  model: ModelImage | null;
  clothing: ClothingItem[];
  options: GenerationOptions;
  results: GeneratedResult[];
  isGenerating: boolean;
}
```

**Key Methods:**
| Method | Description |
|--------|-------------|
| `setModel` | Set model image |
| `setClothing` | Set clothing items |
| `setOptions` | Set generation options |
| `generateModel` | AI-generate model |
| `dressModel` | Dress model in clothing |

---

### useLogoStudio

**File:** `use-logo-studio.ts`

Manages logo generation workflow.

**State:**
```typescript
interface LogoStudioState {
  prompt: string;
  style: LogoStyle;
  colors: ColorConfig;
  generatedLogo: string | null;
  history: LogoHistoryItem[];
  isGenerating: boolean;
}
```

---

## Utility Hooks

### useUserRole

**File:** `use-user-role.ts`

Fetches and caches user role.

**Returns:**
```typescript
{
  role: 'admin' | 'user';
  isLoading: boolean;
  isAdmin: boolean;
}
```

**Usage:**
```tsx
const { role, isAdmin, isLoading } = useUserRole();

if (isAdmin) {
  // Show admin content
}
```

---

### useToast

**File:** `use-toast.ts`

Toast notification management.

**Returns:**
```typescript
{
  toast: (options: ToastOptions) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}
```

**Usage:**
```tsx
const { toast } = useToast();

toast({
  title: "Success",
  description: "Image saved",
});

toast({
  variant: "destructive",
  title: "Error",
  description: "Failed to process",
});
```

---

### useMultiImageEditor

**File:** `use-multi-image-editor.ts`

Batch image processing with parallel operations.

**Features:**
- Multiple image selection
- Parallel processing
- Progress tracking
- Error handling per image

---

### useRegistrationEnabled

**File:** `use-registration-enabled.ts`

Checks if user registration is enabled.

**Usage:**
```tsx
const { isEnabled, isLoading } = useRegistrationEnabled();
```

---

### useBodyScrollLockFix

**File:** `use-body-scroll-lock-fix.ts`

Utility for preventing body scroll when modals are open.

**Usage:**
```tsx
useBodyScrollLockFix(isModalOpen);
```

---

## Hook Patterns

### State + Actions Pattern

```typescript
export function useFeature() {
  const [state, setState] = useState<FeatureState>(initialState);

  const action = useCallback(async (params) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await api.feature.action(params);
      setState(prev => ({ ...prev, data: result, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error, isLoading: false }));
    }
  }, []);

  return {
    ...state,
    action,
  };
}
```

### API Integration Pattern

```typescript
import * as api from '@/lib/api';

const removeBackground = useCallback(async (modelId?: string) => {
  setState(prev => ({ ...prev, isProcessing: true }));
  
  const response = await api.removeBackground(
    currentImage!,
    mimeType,
    modelId
  );
  
  if (response.success && response.data) {
    addOperation({
      type: 'remove_background',
      resultUrl: `data:${response.data.mime_type};base64,${response.data.image_base64}`,
    });
  }
  
  setState(prev => ({ ...prev, isProcessing: false }));
}, [currentImage, mimeType]);
```

---

## Adding New Hooks

1. Create file: `hooks/use-new-feature.ts`

2. Implement hook:
```typescript
'use client';

import { useState, useCallback } from 'react';
import * as api from '@/lib/api';

interface NewFeatureState {
  data: DataType | null;
  isLoading: boolean;
  error: string | null;
}

export function useNewFeature() {
  const [state, setState] = useState<NewFeatureState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const action = useCallback(async () => {
    // Implementation
  }, []);

  return {
    ...state,
    action,
  };
}
```

3. Add to barrel export:
```typescript
// hooks/index.ts
export { useNewFeature } from './use-new-feature';
```

4. Update this documentation

---

## Related Documentation

- [API Client](../lib/ARCHITECTURE.md) - Backend communication
- [Types](../types/ARCHITECTURE.md) - TypeScript definitions
- [Components](../components/ARCHITECTURE.md) - Component integration
