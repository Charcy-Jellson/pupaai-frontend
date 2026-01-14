# Product Mockup Components Architecture

Components for product mockup generation with logo placement.

---

## Directory Structure

```
product-mockup/
├── index.ts              # Barrel exports
├── image-picker.tsx      # Product/logo image selection
├── logo-canvas.tsx       # Interactive logo placement
├── mockup-preview.tsx    # Generated mockup display
├── color-selector.tsx    # Color variant selection
└── results-gallery.tsx   # Generated mockups gallery
```

---

## Components

### ImagePicker

**File:** `image-picker.tsx`

Component for selecting product images or logos from uploads or gallery.

**Features:**
- Upload new image
- Select from saved gallery
- Image preview
- Clear selection

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Picker label |
| `value` | `ImageData \| null` | Selected image |
| `onChange` | `(image: ImageData) => void` | Selection handler |
| `imageType` | `'product' \| 'logo'` | Type for filtering |

**Usage:**
```tsx
import { ImagePicker } from '@/components/product-mockup';

<ImagePicker
  label="Select Product"
  value={productImage}
  onChange={setProductImage}
  imageType="product"
/>
```

---

### LogoCanvas

**File:** `logo-canvas.tsx`

Interactive canvas for positioning logo on product.

**Features:**
- Drag to position logo
- Scale slider
- Rotation control
- Real-time preview

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `productImage` | `string` | Product image URL |
| `logoImage` | `string` | Logo image URL |
| `position` | `LogoPosition` | Current position |
| `onPositionChange` | `(pos: LogoPosition) => void` | Position update |

**Position Object:**
```typescript
interface LogoPosition {
  x: number;      // 0-100 (percentage from left)
  y: number;      // 0-100 (percentage from top)
  scale: number;  // 0.1-3.0
  rotation: number; // -180 to 180 degrees
}
```

**Usage:**
```tsx
import { LogoCanvas } from '@/components/product-mockup';

<LogoCanvas
  productImage={product.dataUrl}
  logoImage={logo.dataUrl}
  position={logoPosition}
  onPositionChange={setLogoPosition}
/>
```

---

### MockupPreview

**File:** `mockup-preview.tsx`

Displays the AI-generated mockup result.

**Features:**
- High-quality preview
- Zoom controls
- Download button
- Save to folder

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Generated mockup URL |
| `isLoading` | `boolean` | Generation in progress |
| `onDownload` | `() => void` | Download handler |
| `onSave` | `() => void` | Save to gallery |

---

### ColorSelector

**File:** `color-selector.tsx`

Multi-color selection for generating mockup variants.

**Features:**
- Preset color palette
- Custom color picker
- Multiple selection
- Color preview

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `selectedColors` | `string[]` | Selected color hex values |
| `onSelectionChange` | `(colors: string[]) => void` | Selection handler |
| `maxSelection` | `number` | Max colors (default: 10) |

**Usage:**
```tsx
import { ColorSelector } from '@/components/product-mockup';

<ColorSelector
  selectedColors={colors}
  onSelectionChange={setColors}
  maxSelection={5}
/>
```

---

### ResultsGallery

**File:** `results-gallery.tsx`

Gallery displaying all generated mockup variants.

**Features:**
- Grid layout
- Color label on each variant
- Batch download
- Individual save/download

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `results` | `MockupResult[]` | Generated mockups |
| `onDownload` | `(result: MockupResult) => void` | Download handler |
| `onSave` | `(result: MockupResult) => void` | Save handler |
| `onDownloadAll` | `() => void` | Batch download |

---

## Workflow

The mockup generation follows a two-phase flow:

```
Phase 1: Logo Composition
┌─────────────────────────────────────────────────────┐
│  ImagePicker     →    LogoCanvas    →    Generate   │
│  (Product+Logo)       (Position)         Composite  │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
Phase 2: Color Variants
┌─────────────────────────────────────────────────────┐
│  ColorSelector   →    Generate      →    Results    │
│  (Multi-select)       Variants           Gallery    │
└─────────────────────────────────────────────────────┘
```

---

## Integration with Hook

```tsx
import { useMockupEditor } from '@/hooks/use-mockup-editor';
import {
  ImagePicker,
  LogoCanvas,
  ColorSelector,
  ResultsGallery,
} from '@/components/product-mockup';

function ProductMockupPage() {
  const {
    productImage,
    logoImage,
    logoPosition,
    compositeResult,
    colorResults,
    isGenerating,
    setProductImage,
    setLogoImage,
    setLogoPosition,
    generateComposite,
    generateColorVariants,
  } = useMockupEditor();

  // Phase 1: Composition
  // Phase 2: Color variants
}
```

---

## Related Documentation

- [useMockupEditor Hook](../../hooks/ARCHITECTURE.md)
- [Types](../../types/ARCHITECTURE.md) - `mockup.ts`
- [Components Overview](../ARCHITECTURE.md)
