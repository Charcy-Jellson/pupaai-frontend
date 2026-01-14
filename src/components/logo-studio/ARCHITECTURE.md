# Logo Studio Components Architecture

Components for AI-powered logo generation.

---

## Directory Structure

```
logo-studio/
├── index.ts              # Barrel exports
├── logo-prompt-input.tsx # Text prompt input
├── style-selector.tsx    # Logo style selection
├── color-palette.tsx     # Color customization
├── logo-preview.tsx      # Generated logo display
└── logo-history.tsx      # Generation history
```

---

## Components

### LogoPromptInput

**File:** `logo-prompt-input.tsx`

Text input for describing the desired logo.

**Features:**
- Multi-line text input
- Character counter
- Example prompts
- Clear button

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Current prompt text |
| `onChange` | `(value: string) => void` | Text change handler |
| `maxLength` | `number` | Max characters (default: 500) |
| `placeholder` | `string` | Input placeholder |

**Usage:**
```tsx
import { LogoPromptInput } from '@/components/logo-studio';

<LogoPromptInput
  value={prompt}
  onChange={setPrompt}
  placeholder="Describe your logo..."
/>
```

---

### StyleSelector

**File:** `style-selector.tsx`

Selection of logo style presets.

**Available Styles:**
| Style | Description |
|-------|-------------|
| Modern | Clean, minimalist design |
| Vintage | Retro, classic feel |
| Playful | Fun, colorful, friendly |
| Professional | Corporate, business-like |
| Abstract | Artistic, non-literal |
| Mascot | Character-based |

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `value` | `LogoStyle` | Selected style |
| `onChange` | `(style: LogoStyle) => void` | Selection handler |

**Usage:**
```tsx
import { StyleSelector } from '@/components/logo-studio';

<StyleSelector
  value={selectedStyle}
  onChange={setSelectedStyle}
/>
```

---

### ColorPalette

**File:** `color-palette.tsx`

Color selection for logo generation.

**Features:**
- Preset color schemes
- Custom color picker
- Primary/secondary color selection
- Preview swatch

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `primaryColor` | `string` | Primary color hex |
| `secondaryColor` | `string` | Secondary color hex |
| `onPrimaryChange` | `(color: string) => void` | Primary handler |
| `onSecondaryChange` | `(color: string) => void` | Secondary handler |

**Usage:**
```tsx
import { ColorPalette } from '@/components/logo-studio';

<ColorPalette
  primaryColor={colors.primary}
  secondaryColor={colors.secondary}
  onPrimaryChange={(c) => setColors({ ...colors, primary: c })}
  onSecondaryChange={(c) => setColors({ ...colors, secondary: c })}
/>
```

---

### LogoPreview

**File:** `logo-preview.tsx`

Displays generated logo with actions.

**Features:**
- High-quality preview
- Transparent background display
- Download (PNG, SVG)
- Save to gallery
- Regenerate button

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Generated logo URL |
| `isGenerating` | `boolean` | Loading state |
| `onDownload` | `(format: 'png' \| 'svg') => void` | Download handler |
| `onSave` | `() => void` | Save to gallery |
| `onRegenerate` | `() => void` | Generate again |

---

### LogoHistory

**File:** `logo-history.tsx`

History of previously generated logos.

**Features:**
- Thumbnail grid
- Click to restore/preview
- Delete from history
- Export selected

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `history` | `LogoHistoryItem[]` | Generation history |
| `onSelect` | `(item: LogoHistoryItem) => void` | Selection handler |
| `onDelete` | `(id: string) => void` | Delete handler |

---

## Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                    Input Configuration                        │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ LogoPromptInput│  │StyleSelector │  │  ColorPalette  │   │
│  │                │  │              │  │                │   │
│  │ "A tech        │  │  ○ Modern    │  │  █ Primary     │   │
│  │  startup..."   │  │  ○ Vintage   │  │  █ Secondary   │   │
│  └────────────────┘  └──────────────┘  └────────────────┘   │
│                                                              │
│                    [Generate Logo]                           │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       Output                                  │
│                                                              │
│  ┌─────────────────────────────────────┐  ┌──────────────┐  │
│  │          LogoPreview                │  │ LogoHistory  │  │
│  │                                     │  │              │  │
│  │     [Generated Logo Image]          │  │  ┌──┐ ┌──┐  │  │
│  │                                     │  │  └──┘ └──┘  │  │
│  │  [Download] [Save] [Regenerate]     │  │  ┌──┐ ┌──┐  │  │
│  └─────────────────────────────────────┘  │  └──┘ └──┘  │  │
│                                           └──────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Integration with Hook

```tsx
import { useLogoStudio } from '@/hooks/use-logo-studio';
import {
  LogoPromptInput,
  StyleSelector,
  ColorPalette,
  LogoPreview,
  LogoHistory,
} from '@/components/logo-studio';

function LogoStudioPage() {
  const {
    prompt,
    style,
    colors,
    generatedLogo,
    history,
    isGenerating,
    setPrompt,
    setStyle,
    setColors,
    generateLogo,
    saveLogo,
  } = useLogoStudio();

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <LogoPromptInput value={prompt} onChange={setPrompt} />
        <StyleSelector value={style} onChange={setStyle} />
        <ColorPalette {...colors} />
        <Button onClick={generateLogo} disabled={isGenerating}>
          Generate Logo
        </Button>
      </div>
      <div>
        <LogoPreview src={generatedLogo} isGenerating={isGenerating} />
        <LogoHistory history={history} onSelect={restoreFromHistory} />
      </div>
    </div>
  );
}
```

---

## Related Documentation

- [useLogoStudio Hook](../../hooks/ARCHITECTURE.md)
- [Types](../../types/ARCHITECTURE.md) - `logo-studio.ts`
- [Components Overview](../ARCHITECTURE.md)
