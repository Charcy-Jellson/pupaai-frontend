# Marketing Components Architecture

Components for public marketing and landing pages.

---

## Directory Structure

```
marketing/
├── hero-section.tsx       # Landing page hero
├── features-section.tsx   # Feature highlights
└── feature-demos.tsx      # Interactive feature demos
```

---

## Components

### HeroSection

**File:** `hero-section.tsx`

The main hero section on the landing page.

**Features:**
- Animated headline
- Product tagline
- CTA buttons
- Background animation (butterfly)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Main headline |
| `subtitle` | `string` | Supporting text |
| `ctaPrimary` | `CTAButton` | Primary CTA |
| `ctaSecondary` | `CTAButton` | Secondary CTA |

**Usage:**
```tsx
import { HeroSection } from '@/components/marketing';

<HeroSection
  title="AI-Powered Creative Suite"
  subtitle="Transform your images with cutting-edge AI"
  ctaPrimary={{ label: 'Get Started', href: '/sign-up' }}
  ctaSecondary={{ label: 'Learn More', href: '#features' }}
/>
```

**Animations:**
- Framer Motion entrance animations
- Floating butterfly animation
- Text reveal effects

---

### FeaturesSection

**File:** `features-section.tsx`

Grid showcase of product features.

**Features:**
- Feature cards with icons
- Responsive grid layout
- Hover animations

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `features` | `Feature[]` | Array of features |

**Feature Interface:**
```typescript
interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}
```

**Default Features:**
- Image Tools - AI-powered editing
- Product Mockup - Logo placement
- Model Studio - Virtual try-on
- Logo Studio - Logo generation
- Video Tools - Video creation
- SEO Tools - SEO optimization

---

### FeatureDemos

**File:** `feature-demos.tsx`

Interactive before/after demos of features.

**Features:**
- Image comparison slider
- Before/after toggle
- Auto-play demonstration
- Touch/mouse drag support

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `demos` | `Demo[]` | Array of demos |

**Demo Interface:**
```typescript
interface Demo {
  title: string;
  before: string;  // Image URL
  after: string;   // Image URL
  description: string;
}
```

---

## Page Integration

```tsx
// app/[locale]/(marketing)/page.tsx
import {
  HeroSection,
  FeaturesSection,
  FeatureDemos,
} from '@/components/marketing';

export default function LandingPage() {
  return (
    <main>
      <HeroSection {...heroProps} />
      <FeaturesSection features={features} />
      <FeatureDemos demos={demos} />
      {/* Additional sections */}
    </main>
  );
}
```

---

## Styling Guidelines

Marketing components prioritize:

1. **Visual Impact**
   - Bold typography
   - High contrast
   - Smooth animations

2. **Performance**
   - Optimized images
   - Lazy loading
   - Minimal JS

3. **Responsiveness**
   - Mobile-first design
   - Flexible layouts
   - Touch-friendly interactions

---

## Assets

Marketing images are stored in:
```
public/images/marketing/
├── before.png
├── after.png
├── product-1.png
├── product-2.png
├── product-3.png
└── ...
```

---

## Related Documentation

- [App Directory](../../app/ARCHITECTURE.md) - Marketing route
- [Components Overview](../ARCHITECTURE.md)
