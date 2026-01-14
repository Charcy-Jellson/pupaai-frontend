# UI Components Architecture

Base UI components built on shadcn/ui and Radix UI primitives.

---

## Directory Structure

```
ui/
├── alert-dialog.tsx      # Confirmation dialogs
├── alert.tsx             # Alert messages
├── avatar.tsx            # User avatars
├── badge.tsx             # Status badges
├── button.tsx            # Button component
├── card.tsx              # Card container
├── dialog.tsx            # Modal dialogs
├── dropdown-menu.tsx     # Dropdown menus
├── input.tsx             # Text input
├── label.tsx             # Form labels
├── progress.tsx          # Progress bars
├── scroll-area.tsx       # Scrollable containers
├── select.tsx            # Select dropdowns
├── separator.tsx         # Visual separators
├── slider.tsx            # Range sliders
├── switch.tsx            # Toggle switches
├── table.tsx             # Data tables
├── tabs.tsx              # Tab navigation
├── textarea.tsx          # Multi-line input
├── toast.tsx             # Toast notifications
├── toaster.tsx           # Toast container
└── tooltip.tsx           # Tooltips
```

---

## Component Reference

### Form Components

| Component | Usage |
|-----------|-------|
| `Button` | Primary action buttons with variants |
| `Input` | Text input fields |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown selection |
| `Switch` | Toggle on/off |
| `Slider` | Range value selection |
| `Label` | Form field labels |

### Feedback Components

| Component | Usage |
|-----------|-------|
| `Alert` | Static alert messages |
| `AlertDialog` | Confirmation dialogs |
| `Dialog` | Modal windows |
| `Toast` | Temporary notifications |
| `Progress` | Loading progress |
| `Badge` | Status indicators |

### Layout Components

| Component | Usage |
|-----------|-------|
| `Card` | Content containers |
| `Tabs` | Tab navigation |
| `ScrollArea` | Scrollable regions |
| `Separator` | Visual dividers |
| `Table` | Data tables |

### Navigation Components

| Component | Usage |
|-----------|-------|
| `DropdownMenu` | Action menus |
| `Tooltip` | Hover information |

---

## Usage Examples

### Button

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <Icon className="mr-2 h-4 w-4" />
  With Icon
</Button>
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content here</p>
  </DialogContent>
</Dialog>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Toast

```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Operation completed",
});

toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong",
});
```

---

## Customization

### Adding New UI Components

1. Use shadcn/ui CLI:
```bash
npx shadcn-ui@latest add [component-name]
```

2. Or create manually following the pattern:
```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary';
}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'base-styles',
          variant === 'secondary' && 'secondary-styles',
          className
        )}
        {...props}
      />
    );
  }
);
Component.displayName = 'Component';

export { Component };
```

---

## Related Documentation

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Components Overview](../ARCHITECTURE.md)
