# App Directory Architecture

The `app/` directory contains all Next.js 15 App Router pages and API routes.

---

## Directory Structure

```
app/
├── [locale]/                      # Internationalized routes
│   ├── (auth)/                    # Auth route group (public)
│   │   ├── layout.tsx             # Auth layout (centered card)
│   │   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk sign-in
│   │   └── sign-up/[[...sign-up]]/page.tsx   # Clerk sign-up
│   │
│   ├── (dashboard)/               # Dashboard route group (protected)
│   │   ├── layout.tsx             # Dashboard layout (sidebar + topbar)
│   │   └── dashboard/
│   │       ├── page.tsx           # Dashboard home
│   │       ├── image-tools/       # Image editing
│   │       │   ├── page.tsx
│   │       │   └── loading.tsx
│   │       ├── product-mockup/    # Product mockup
│   │       │   └── page.tsx
│   │       ├── model-studio/      # AI model studio
│   │       │   └── page.tsx
│   │       ├── logo-studio/       # Logo generation
│   │       │   └── page.tsx
│   │       ├── video-tools/       # Video tools (placeholder)
│   │       │   ├── page.tsx
│   │       │   └── loading.tsx
│   │       ├── seo/               # SEO tools (placeholder)
│   │       │   └── page.tsx
│   │       └── admin/             # Admin-only pages
│   │           ├── users/page.tsx
│   │           └── settings/page.tsx
│   │
│   ├── (marketing)/               # Marketing route group (public)
│   │   ├── layout.tsx             # Marketing layout
│   │   └── page.tsx               # Landing page
│   │
│   └── layout.tsx                 # Locale layout (providers)
│
├── api/                           # Next.js API routes
│   ├── health/route.ts            # Health check
│   ├── user-role/route.ts         # User role lookup
│   ├── colors/route.ts            # User colors
│   ├── webhooks/clerk/route.ts    # Clerk webhooks
│   └── settings/                  # Settings API
│       ├── system/route.ts
│       └── models/                # AI model management
│
├── layout.tsx                     # Root layout
├── globals.css                    # Global CSS
├── not-found.tsx                  # 404 page
└── error.tsx                      # Error boundary
```

---

## Sub-directory Documentation

| Directory | Documentation | Description |
|-----------|---------------|-------------|
| `api/` | [api/ARCHITECTURE.md](api/ARCHITECTURE.md) | API routes documentation |

---

## Route Groups Explained

### `(auth)` - Authentication Pages

- **Purpose**: Clerk authentication UI
- **Auth Required**: No
- **Layout**: Centered card design

| Route | Component | Description |
|-------|-----------|-------------|
| `/sign-in` | Clerk `<SignIn />` | Sign in page |
| `/sign-up` | Clerk `<SignUp />` | Sign up page |

### `(dashboard)` - Protected Dashboard

- **Purpose**: Main application features
- **Auth Required**: Yes (via middleware)
- **Layout**: Sidebar + TopBar navigation

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard home | Overview, quick actions |
| `/dashboard/image-tools` | Image editing | Crop, rotate, AI processing |
| `/dashboard/product-mockup` | Product mockup | Logo placement, color variants |
| `/dashboard/model-studio` | AI models | Generate/dress fashion models |
| `/dashboard/logo-studio` | Logo generation | AI logo creation |
| `/dashboard/video-tools` | Video tools | Video processing (placeholder) |
| `/dashboard/seo` | SEO tools | SEO optimization (placeholder) |
| `/dashboard/admin/users` | User management | Admin: manage users |
| `/dashboard/admin/settings` | AI settings | Admin: manage AI models |

### `(marketing)` - Public Pages

- **Purpose**: Marketing and public information
- **Auth Required**: No
- **Layout**: Marketing layout with header/footer

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing page | Product showcase |

---

## Internationalization

All user-facing pages are under `[locale]/` dynamic segment:

- `/en/dashboard` - English dashboard
- `/zh/dashboard` - Chinese dashboard

The locale is determined by:
1. URL path segment
2. Cookie preference
3. Accept-Language header
4. Default: `en`

---

## Page Component Pattern

```typescript
// app/[locale]/(dashboard)/dashboard/feature/page.tsx

import { getTranslations } from 'next-intl/server';
import { FeatureComponent } from '@/components/feature';

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'Feature' });
  return { title: t('title') };
}

export default function FeaturePage() {
  return (
    <div className="container mx-auto p-6">
      <FeatureComponent />
    </div>
  );
}
```

---

## Layout Hierarchy

```
RootLayout (app/layout.tsx)
  └── LocaleLayout (app/[locale]/layout.tsx)
        ├── AuthLayout (app/[locale]/(auth)/layout.tsx)
        │     └── Sign-in/Sign-up pages
        │
        ├── DashboardLayout (app/[locale]/(dashboard)/layout.tsx)
        │     └── TopBar + Sidebar + Content
        │           └── Dashboard pages
        │
        └── MarketingLayout (app/[locale]/(marketing)/layout.tsx)
              └── Marketing pages
```

---

## Adding New Pages

### Adding a Dashboard Page

1. Create directory: `app/[locale]/(dashboard)/dashboard/new-feature/`
2. Add `page.tsx`:

```typescript
export default function NewFeaturePage() {
  return <div>New Feature Content</div>;
}
```

3. Add `loading.tsx` (optional):

```typescript
export default function Loading() {
  return <LoadingSpinner />;
}
```

4. Update sidebar navigation in `components/layout/sidebar.tsx`
5. Add translations in `i18n/locales/`

### Adding an Admin Page

1. Create directory: `app/[locale]/(dashboard)/dashboard/admin/new-admin-page/`
2. Wrap content with `<RoleGate role="admin">` component
3. Add to admin section in sidebar

---

## Related Documentation

- [API Routes](api/ARCHITECTURE.md) - API route documentation
- [Components](../components/ARCHITECTURE.md) - Component library
- [src Overview](../ARCHITECTURE.md) - Source directory overview
