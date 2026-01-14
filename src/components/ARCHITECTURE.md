# Components Directory Architecture

The `components/` directory contains all React components organized by feature and purpose.

---

## Directory Structure

```
components/
├── ui/                    # Base UI components (shadcn/ui)
├── layout/                # App layout components
├── common/                # Shared utility components
├── image-tools/           # Image editing feature
├── product-mockup/        # Product mockup feature
├── model-studio/          # AI model studio feature
├── logo-studio/           # Logo generation feature
├── video-tools/           # Video tools feature
└── marketing/             # Marketing page components
```

---

## Sub-directory Index

| Directory | Documentation | Description |
|-----------|---------------|-------------|
| `ui/` | [ui/ARCHITECTURE.md](ui/ARCHITECTURE.md) | shadcn/ui base components |
| `layout/` | [layout/ARCHITECTURE.md](layout/ARCHITECTURE.md) | App layout (TopBar, Sidebar) |
| `common/` | [common/ARCHITECTURE.md](common/ARCHITECTURE.md) | Shared utility components |
| `image-tools/` | [image-tools/ARCHITECTURE.md](image-tools/ARCHITECTURE.md) | Image editing components |
| `product-mockup/` | [product-mockup/ARCHITECTURE.md](product-mockup/ARCHITECTURE.md) | Mockup generation |
| `model-studio/` | [model-studio/ARCHITECTURE.md](model-studio/ARCHITECTURE.md) | AI fashion models |
| `logo-studio/` | [logo-studio/ARCHITECTURE.md](logo-studio/ARCHITECTURE.md) | Logo generation |
| `video-tools/` | [video-tools/ARCHITECTURE.md](video-tools/ARCHITECTURE.md) | Video processing |
| `marketing/` | [marketing/ARCHITECTURE.md](marketing/ARCHITECTURE.md) | Marketing pages |

---

## Component Categories

### 1. UI Components (`ui/`)

Base components from shadcn/ui library:
- Buttons, Inputs, Cards, Dialogs
- Built on Radix UI primitives
- Styled with Tailwind CSS

### 2. Layout Components (`layout/`)

App structure components:
- TopBar - Header navigation
- Sidebar - Main navigation menu
- Footer - Page footer

### 3. Common Components (`common/`)

Shared across features:
- LoadingSpinner - Loading states
- RoleGate - Role-based access control
- SelectFolderDialog - File management
- LanguageSwitcher - i18n toggle

### 4. Feature Components

Each feature has dedicated components:

| Feature | Components | Hook |
|---------|------------|------|
| Image Tools | Preview, Uploader, ToolPanel | `useImageEditor` |
| Product Mockup | Canvas, ColorSelector, Gallery | `useMockupEditor` |
| Model Studio | Generator, Selector, Options | `useModelStudio` |
| Logo Studio | Preview, Prompt, Palette | `useLogoStudio` |
| Video Tools | ImageToVideo, TextToVideo | - |

---

## Component Patterns

### Barrel Exports

Each directory uses `index.ts` for clean imports:

```typescript
// components/image-tools/index.ts
export { ImagePreview } from './image-preview';
export { ImageUploader } from './image-uploader';
export { ToolPanel } from './tool-panel';

// Usage
import { ImagePreview, ToolPanel } from '@/components/image-tools';
```

### Component Structure

```typescript
// components/feature/component-name.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  onAction?: () => void;
}

export function ComponentName({ prop1, prop2 = 0, onAction }: ComponentNameProps) {
  const [state, setState] = useState(false);

  return (
    <div className={cn('base-styles', state && 'active-styles')}>
      {/* Component content */}
    </div>
  );
}
```

### Props Interface Convention

- Props interface named `{ComponentName}Props`
- Optional props with `?` and default values
- Callback props prefixed with `on` (e.g., `onSelect`, `onChange`)

---

## Styling Guidelines

### Tailwind CSS

```tsx
// Use cn() for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class'
)}>
```

### Component Variants

Use `class-variance-authority` for variants:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('base-button-styles', {
  variants: {
    variant: {
      default: 'default-styles',
      destructive: 'destructive-styles',
    },
    size: {
      sm: 'small-styles',
      lg: 'large-styles',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
  },
});
```

---

## Adding New Components

### 1. Create Component File

```
components/
└── feature/
    └── new-component.tsx
```

### 2. Implement Component

```typescript
'use client';

import { ComponentProps } from '@/types/feature';

interface NewComponentProps extends ComponentProps {
  // Additional props
}

export function NewComponent({ ...props }: NewComponentProps) {
  return (
    // JSX
  );
}
```

### 3. Add to Barrel Export

```typescript
// components/feature/index.ts
export { NewComponent } from './new-component';
```

### 4. Update Documentation

Add component to the feature's `ARCHITECTURE.md`.

---

## Component Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                    Page Components                       │
│  (app/[locale]/(dashboard)/dashboard/feature/page.tsx)  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Feature Components                      │
│      (components/feature/*.tsx + hooks/use-*.ts)        │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Common  │   │  Layout  │   │    UI    │
    │Components│   │Components│   │Components│
    └──────────┘   └──────────┘   └──────────┘
```

---

## Related Documentation

- [Hooks](../hooks/ARCHITECTURE.md) - Custom React hooks
- [Types](../types/ARCHITECTURE.md) - TypeScript definitions
- [src Overview](../ARCHITECTURE.md) - Source directory
