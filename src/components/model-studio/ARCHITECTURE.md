# Model Studio Components Architecture

Components for AI fashion model generation and virtual try-on.

---

## Directory Structure

```
model-studio/
├── index.ts              # Barrel exports
├── model-selector.tsx    # Model image selection/generation
├── model-generator.tsx   # AI model generation form
├── clothing-picker.tsx   # Clothing item selection
├── options-panel.tsx     # Scene, pose, pants options
└── results-gallery.tsx   # Generated results display
```

---

## Components

### ModelSelector

**File:** `model-selector.tsx`

Component for selecting or generating the fashion model.

**Input Methods:**
1. Upload image
2. Select from gallery
3. AI generate new model

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `value` | `ModelImage \| null` | Selected model |
| `onChange` | `(model: ModelImage) => void` | Selection handler |
| `onGenerateClick` | `() => void` | Open generator modal |

**Usage:**
```tsx
import { ModelSelector } from '@/components/model-studio';

<ModelSelector
  value={selectedModel}
  onChange={setSelectedModel}
  onGenerateClick={() => setGeneratorOpen(true)}
/>
```

---

### ModelGenerator

**File:** `model-generator.tsx`

Form for AI-generating fashion models with customizable attributes.

**Attributes:**
| Attribute | Options |
|-----------|---------|
| Ethnicity | Caucasian, Black, Asian, Hispanic |
| Gender | Male, Female |
| Hair Length | Long, Short |
| Glasses | Yes, No |
| Age Group | Teen (16-17), Adult (20-33), Middle-aged (35-45) |

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Modal open state |
| `onOpenChange` | `(open: boolean) => void` | Modal handler |
| `onGenerate` | `(options: ModelOptions) => Promise<void>` | Generation handler |
| `isGenerating` | `boolean` | Loading state |

**Usage:**
```tsx
import { ModelGenerator } from '@/components/model-studio';

<ModelGenerator
  open={generatorOpen}
  onOpenChange={setGeneratorOpen}
  onGenerate={async (options) => {
    const model = await generateModel(options);
    setSelectedModel(model);
    setGeneratorOpen(false);
  }}
  isGenerating={isGenerating}
/>
```

---

### ClothingPicker

**File:** `clothing-picker.tsx`

Multi-select component for choosing clothing items.

**Features:**
- Upload new clothing
- Select from gallery
- Multi-select support
- Preview selected items

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `selectedItems` | `ClothingItem[]` | Selected clothing |
| `onSelectionChange` | `(items: ClothingItem[]) => void` | Selection handler |
| `maxItems` | `number` | Max selection limit |

**Usage:**
```tsx
import { ClothingPicker } from '@/components/model-studio';

<ClothingPicker
  selectedItems={clothing}
  onSelectionChange={setClothing}
  maxItems={5}
/>
```

---

### OptionsPanel

**File:** `options-panel.tsx`

Panel for selecting generation options.

**Options:**
| Option | Values |
|--------|--------|
| Scene | Original, Home, City Street, Office |
| Pose | Front Standing, Side Standing, Front Sitting |
| Pants Type | Yoga Pants, Jeans |

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `options` | `GenerationOptions` | Current options |
| `onOptionsChange` | `(options: GenerationOptions) => void` | Options handler |

**Options Interface:**
```typescript
interface GenerationOptions {
  scene: 'original' | 'home' | 'street' | 'office';
  poses: ('front_standing' | 'side_standing' | 'front_sitting')[];
  pantsType: 'yoga_pants' | 'jeans';
}
```

---

### ResultsGallery

**File:** `results-gallery.tsx`

Gallery displaying generated model images.

**Features:**
- Grid layout
- Generation metadata display
- Download individual images
- Save to folder
- Batch operations

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `results` | `GeneratedResult[]` | Generated images |
| `onDownload` | `(result: GeneratedResult) => void` | Download handler |
| `onSave` | `(result: GeneratedResult) => void` | Save handler |
| `isLoading` | `boolean` | Generation in progress |

---

## Workflow

```
┌────────────────────────────────────────────────────────────────┐
│  Step 1: Select/Generate Model                                  │
│  ┌─────────────────┐     ┌───────────────────────┐            │
│  │  ModelSelector  │ ──▶ │  ModelGenerator       │            │
│  │  (Upload/Gallery)│    │  (AI Generation)      │            │
│  └─────────────────┘     └───────────────────────┘            │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 2: Select Clothing                                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    ClothingPicker                         │ │
│  │                    (Multi-select)                         │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 3: Configure Options                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    OptionsPanel                           │ │
│  │              (Scene, Pose, Pants)                         │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 4: Generate & View Results                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   ResultsGallery                          │ │
│  │              (Parallel generation)                        │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Integration with Hook

```tsx
import { useModelStudio } from '@/hooks/use-model-studio';
import {
  ModelSelector,
  ModelGenerator,
  ClothingPicker,
  OptionsPanel,
  ResultsGallery,
} from '@/components/model-studio';

function ModelStudioPage() {
  const {
    model,
    clothing,
    options,
    results,
    isGenerating,
    setModel,
    setClothing,
    setOptions,
    generateModel,
    dressModel,
  } = useModelStudio();

  return (
    // Component composition
  );
}
```

---

## Related Documentation

- [useModelStudio Hook](../../hooks/ARCHITECTURE.md)
- [Types](../../types/ARCHITECTURE.md) - `model-studio.ts`
- [Components Overview](../ARCHITECTURE.md)
