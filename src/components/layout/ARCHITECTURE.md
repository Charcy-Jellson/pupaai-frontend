# Layout Components Architecture

Components that define the app's structural layout.

---

## Directory Structure

```
layout/
├── index.ts          # Barrel exports
├── top-bar.tsx       # Header navigation bar
├── sidebar.tsx       # Main navigation sidebar
└── footer.tsx        # Page footer
```

---

## Components

### TopBar

**File:** `top-bar.tsx`

The top navigation bar displayed in the dashboard.

**Features:**
- User profile menu (Clerk UserButton)
- Language switcher
- Breadcrumb navigation
- Responsive design

**Usage:**
```tsx
import { TopBar } from '@/components/layout';

<TopBar />
```

---

### Sidebar

**File:** `sidebar.tsx`

The main navigation sidebar for the dashboard.

**Features:**
- Logo and branding
- Navigation links with icons
- Active state highlighting
- Admin section (role-gated)
- Collapsible on mobile

**Navigation Structure:**
```typescript
const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/image-tools', icon: Image, label: 'Image Tools' },
  { href: '/dashboard/product-mockup', icon: Shirt, label: 'Product Mockup' },
  { href: '/dashboard/model-studio', icon: Users, label: 'Model Studio' },
  { href: '/dashboard/logo-studio', icon: Palette, label: 'Logo Studio' },
  { href: '/dashboard/video-tools', icon: Video, label: 'Video Tools' },
  { href: '/dashboard/seo', icon: Search, label: 'SEO Tools' },
];

const adminItems = [
  { href: '/dashboard/admin/users', icon: Users, label: 'User Management' },
  { href: '/dashboard/admin/settings', icon: Settings, label: 'AI Settings' },
];
```

**Usage:**
```tsx
import { Sidebar } from '@/components/layout';

<Sidebar />
```

---

### Footer

**File:** `footer.tsx`

Page footer with copyright and links.

**Features:**
- Copyright notice
- Social links
- Legal links

**Usage:**
```tsx
import { Footer } from '@/components/layout';

<Footer />
```

---

## Layout Integration

### Dashboard Layout

The dashboard layout combines these components:

```tsx
// app/[locale]/(dashboard)/layout.tsx
import { TopBar, Sidebar } from '@/components/layout';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Marketing Layout

Uses a simpler layout without sidebar:

```tsx
// app/[locale]/(marketing)/layout.tsx
import { Footer } from '@/components/layout';

export default function MarketingLayout({ children }) {
  return (
    <>
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

---

## Modifying Navigation

### Adding a New Menu Item

1. Edit `sidebar.tsx`
2. Add to `navItems` array:

```typescript
const navItems = [
  // ... existing items
  { 
    href: '/dashboard/new-feature', 
    icon: NewIcon, 
    label: 'New Feature' 
  },
];
```

3. Update i18n translations for the label

### Adding Admin Item

Add to `adminItems` array (automatically role-gated):

```typescript
const adminItems = [
  // ... existing items
  { 
    href: '/dashboard/admin/new-admin', 
    icon: AdminIcon, 
    label: 'New Admin Page' 
  },
];
```

---

## Related Documentation

- [Common Components](../common/ARCHITECTURE.md)
- [App Directory](../../app/ARCHITECTURE.md)
- [Components Overview](../ARCHITECTURE.md)
