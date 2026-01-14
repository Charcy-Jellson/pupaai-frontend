# Common Components Architecture

Shared utility components used across multiple features.

---

## Directory Structure

```
common/
├── index.ts                  # Barrel exports
├── loading-spinner.tsx       # Loading indicator
├── role-gate.tsx             # Role-based access control
├── select-folder-dialog.tsx  # Folder selection modal
└── language-switcher.tsx     # Locale toggle
```

---

## Components

### LoadingSpinner

**File:** `loading-spinner.tsx`

A loading indicator component with size variants.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |
| `className` | `string` | - | Additional CSS classes |

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/common';

// Default
<LoadingSpinner />

// Small size
<LoadingSpinner size="sm" />

// Large with custom class
<LoadingSpinner size="lg" className="text-primary" />
```

---

### RoleGate

**File:** `role-gate.tsx`

Component for role-based access control. Shows content only if user has required role.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `role` | `'admin' \| 'user'` | - | Required role |
| `children` | `ReactNode` | - | Content to protect |
| `fallback` | `ReactNode` | `null` | Shown if role check fails |

**Usage:**
```tsx
import { RoleGate } from '@/components/common';

// Hide from non-admins
<RoleGate role="admin">
  <AdminOnlyContent />
</RoleGate>

// With fallback
<RoleGate role="admin" fallback={<p>Admin access required</p>}>
  <AdminPanel />
</RoleGate>
```

**Implementation:**
```tsx
export function RoleGate({ role, children, fallback = null }) {
  const { role: userRole, isLoading } = useUserRole();

  if (isLoading) return <LoadingSpinner />;
  if (userRole !== role) return fallback;

  return children;
}
```

---

### SelectFolderDialog

**File:** `select-folder-dialog.tsx`

Modal dialog for selecting or creating folders when saving files.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog open state |
| `onOpenChange` | `(open: boolean) => void` | Open state handler |
| `onSelect` | `(folderId: string \| null) => void` | Folder selection handler |
| `title` | `string` | Dialog title |

**Usage:**
```tsx
import { SelectFolderDialog } from '@/components/common';

const [dialogOpen, setDialogOpen] = useState(false);

<SelectFolderDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  onSelect={(folderId) => {
    saveToFolder(folderId);
    setDialogOpen(false);
  }}
  title="Save Image To..."
/>
```

**Features:**
- Lists user's folders from Supabase
- Create new folder inline
- Supports nested folders
- Root folder option (null)

---

### LanguageSwitcher

**File:** `language-switcher.tsx`

Toggle between supported locales (EN/ZH).

**Usage:**
```tsx
import { LanguageSwitcher } from '@/components/common';

<LanguageSwitcher />
```

**Implementation:**
- Uses `next-intl` routing
- Preserves current path when switching
- Stores preference in cookie

---

## Adding New Common Components

### 1. Create Component

```typescript
// common/new-component.tsx
'use client';

import { cn } from '@/lib/utils';

interface NewComponentProps {
  prop1: string;
  className?: string;
}

export function NewComponent({ prop1, className }: NewComponentProps) {
  return (
    <div className={cn('base-styles', className)}>
      {prop1}
    </div>
  );
}
```

### 2. Add to Barrel Export

```typescript
// common/index.ts
export { LoadingSpinner } from './loading-spinner';
export { RoleGate } from './role-gate';
export { SelectFolderDialog } from './select-folder-dialog';
export { LanguageSwitcher } from './language-switcher';
export { NewComponent } from './new-component';  // Add this
```

### 3. Update Documentation

Add component section to this file.

---

## Related Documentation

- [Layout Components](../layout/ARCHITECTURE.md)
- [Hooks](../../hooks/ARCHITECTURE.md) - `useUserRole`
- [Components Overview](../ARCHITECTURE.md)
