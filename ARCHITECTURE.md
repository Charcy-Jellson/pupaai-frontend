# Pupa AI Studio - Frontend Architecture

This document provides a comprehensive overview of the frontend architecture for developers.

---

## Directory Structure

```
pupaai-frontend/
├── src/                           # Source code
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/              # Internationalized routes (en/zh)
│   │   │   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   │   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── (marketing)/       # Public marketing pages
│   │   │   └── layout.tsx         # Locale layout with providers
│   │   ├── api/                   # Next.js API routes
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Global styles
│   │   └── not-found.tsx          # 404 page
│   │
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui base components
│   │   ├── layout/                # App layout (TopBar, Sidebar, Footer)
│   │   ├── common/                # Shared components
│   │   ├── image-tools/           # Image editing components
│   │   ├── product-mockup/        # Product mockup components
│   │   ├── model-studio/          # AI model studio components
│   │   ├── logo-studio/           # Logo generation components
│   │   ├── video-tools/           # Video tools components
│   │   └── marketing/             # Marketing page components
│   │
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utility libraries
│   ├── types/                     # TypeScript type definitions
│   ├── i18n/                      # Internationalization config
│   └── middleware.ts              # Next.js middleware (auth, i18n)
│
├── public/                        # Static assets
│   ├── images/                    # Image assets
│   └── checkerboard.svg           # Transparency pattern
│
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

---

## Sub-directory Documentation Index

| Directory | Documentation | Description |
|-----------|---------------|-------------|
| `src/` | [src/ARCHITECTURE.md](src/ARCHITECTURE.md) | Source directory overview |
| `src/app/` | [src/app/ARCHITECTURE.md](src/app/ARCHITECTURE.md) | Next.js routing & pages |
| `src/app/api/` | [src/app/api/ARCHITECTURE.md](src/app/api/ARCHITECTURE.md) | API routes |
| `src/components/` | [src/components/ARCHITECTURE.md](src/components/ARCHITECTURE.md) | Component library |
| `src/hooks/` | [src/hooks/ARCHITECTURE.md](src/hooks/ARCHITECTURE.md) | Custom hooks |
| `src/lib/` | [src/lib/ARCHITECTURE.md](src/lib/ARCHITECTURE.md) | Utilities |
| `src/types/` | [src/types/ARCHITECTURE.md](src/types/ARCHITECTURE.md) | TypeScript types |
| `src/i18n/` | [src/i18n/ARCHITECTURE.md](src/i18n/ARCHITECTURE.md) | Internationalization |

---

## Architecture Overview

### Routing Strategy

The frontend uses Next.js 15 App Router with the following route groups:

| Route Group | Path | Purpose | Auth Required |
|-------------|------|---------|---------------|
| `(marketing)` | `/`, `/about` | Public landing pages | No |
| `(auth)` | `/sign-in`, `/sign-up` | Authentication pages | No |
| `(dashboard)` | `/dashboard/*` | Protected user features | Yes |

### Internationalization

- Uses `next-intl` for i18n support
- Supported locales: `en` (English), `zh` (Chinese)
- Locale prefix strategy: Always show locale in URL (`/en/dashboard`, `/zh/dashboard`)

### State Management

- **Server State**: React Query pattern via custom hooks
- **UI State**: React useState/useReducer
- **Form State**: Controlled components
- **Global State**: React Context (minimal usage)

---

## Key Patterns

### 1. Feature-based Component Organization

Each feature has its own component directory:

```
components/
├── image-tools/          # Image editing feature
│   ├── image-preview.tsx
│   ├── image-uploader.tsx
│   ├── tool-panel.tsx
│   └── index.ts          # Barrel export
├── product-mockup/       # Mockup feature
│   └── ...
└── model-studio/         # AI model feature
    └── ...
```

### 2. Custom Hook Pattern

Business logic is encapsulated in custom hooks:

```typescript
// hooks/use-image-editor.ts
export function useImageEditor() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const removeBackground = async () => { /* ... */ };
  const extractLogo = async () => { /* ... */ };
  
  return { image, isProcessing, removeBackground, extractLogo };
}
```

### 3. API Client Pattern

Backend communication is centralized in `lib/api.ts`:

```typescript
// lib/api.ts
export const api = {
  image: {
    removeBackground: (data) => post('/api/image/remove-background', data),
    extractLogo: (data) => post('/api/image/extract-logo', data),
  },
  mockup: {
    generate: (data) => post('/api/mockup/generate', data),
  },
};
```

### 4. Component Composition

Use barrel exports for clean imports:

```typescript
// components/image-tools/index.ts
export { ImagePreview } from './image-preview';
export { ImageUploader } from './image-uploader';
export { ToolPanel } from './tool-panel';

// Usage
import { ImagePreview, ImageUploader, ToolPanel } from '@/components/image-tools';
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Component                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Custom Hook (useXxx)                      ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  ││
│  │  │    State     │  │   Actions    │  │  Side Effects    │  ││
│  │  │  (useState)  │  │ (functions)  │  │   (useEffect)    │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     lib/api.ts (API Client)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  image.removeBackground() │ mockup.generate() │ ...      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
         ┌──────────────────┐    ┌──────────────────┐
         │  Next.js API     │    │   FastAPI        │
         │  (Lightweight)   │    │   (Heavyweight)  │
         │  /api/settings/* │    │  /api/image/*    │
         └──────────────────┘    └──────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                ▼
                    ┌──────────────────────┐
                    │      Supabase        │
                    │   (DB + Storage)     │
                    └──────────────────────┘
```

---

## Development Guidelines

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `image-preview.tsx` |
| Hooks | use-kebab-case | `use-image-editor.ts` |
| Types | kebab-case | `model-studio.ts` |
| Pages | page.tsx | `app/[locale]/(dashboard)/dashboard/page.tsx` |

### Import Order

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { ImagePreview } from '@/components/image-tools';

// 4. Internal utilities
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// 5. Types
import type { ImageState } from '@/types';
```

### Adding New Features

1. Create component directory in `src/components/feature-name/`
2. Create custom hook in `src/hooks/use-feature-name.ts`
3. Add types in `src/types/feature-name.ts`
4. Create page in `src/app/[locale]/(dashboard)/dashboard/feature-name/page.tsx`
5. Add API client methods in `src/lib/api.ts`
6. Update i18n files in `src/i18n/locales/`
7. **Update relevant ARCHITECTURE.md files**

---

## Configuration Files

### next.config.ts

- Configures i18n with `next-intl`
- Sets up image domains for external sources
- Configures rewrites/redirects if needed

### tailwind.config.ts

- Extends default Tailwind theme
- Configures shadcn/ui color tokens
- Sets up custom animations

### middleware.ts

- Handles Clerk authentication
- Manages i18n locale detection and routing
- Protects dashboard routes

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project introduction |
| [Backend Architecture](../pupaai-backend/ARCHITECTURE.md) | Backend structure |
| [Supabase Architecture](../supabase/ARCHITECTURE.md) | Database schema |
| [Cursor Rules](../.cursor/rules/pupa-ai-fullstack.mdc) | Coding standards |

---

## Maintenance

When making changes to the frontend:

1. **Update this document** if directory structure changes
2. **Update sub-directory ARCHITECTURE.md** for specific module changes
3. **Update i18n files** for new user-facing text
4. **Update root README.md** if features or architecture change significantly
