# i18n Directory Architecture

Internationalization configuration and translation files.

---

## Directory Structure

```
i18n/
├── config.ts          # i18n configuration
├── request.ts         # Server-side locale handling
├── routing.ts         # Locale routing configuration
└── locales/
    ├── en.json        # English translations
    └── zh.json        # Chinese translations
```

---

## Files

### config.ts

**Purpose:** Core i18n configuration.

```typescript
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};
```

---

### routing.ts

**Purpose:** Locale routing configuration for `next-intl`.

```typescript
import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always show locale in URL
});
```

**URL Patterns:**
- `/en/dashboard` - English dashboard
- `/zh/dashboard` - Chinese dashboard
- `/` → redirects to `/en/` (default locale)

---

### request.ts

**Purpose:** Server-side locale request handling.

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    return { messages: {} };
  }

  // Load messages
  const messages = (await import(`./locales/${locale}.json`)).default;
  
  return { messages };
});
```

---

### locales/en.json

**Purpose:** English translation strings.

**Structure:**
```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "download": "Download"
  },
  "nav": {
    "dashboard": "Dashboard",
    "imageTools": "Image Tools",
    "productMockup": "Product Mockup",
    "modelStudio": "Model Studio",
    "logoStudio": "Logo Studio",
    "videoTools": "Video Tools",
    "seo": "SEO Tools",
    "admin": "Admin",
    "users": "Users",
    "settings": "Settings"
  },
  "imageTools": {
    "title": "Image Tools",
    "upload": "Upload Image",
    "crop": "Crop",
    "rotate": "Rotate",
    "compress": "Compress",
    "removeBackground": "Remove Background",
    "extractLogo": "Extract Logo",
    "removeLogo": "Remove Logo"
  },
  "productMockup": {
    "title": "Product Mockup",
    "selectProduct": "Select Product",
    "selectLogo": "Select Logo",
    "positionLogo": "Position Logo",
    "generateMockup": "Generate Mockup",
    "selectColors": "Select Colors"
  },
  "modelStudio": {
    "title": "Model Studio",
    "selectModel": "Select Model",
    "generateModel": "Generate Model",
    "selectClothing": "Select Clothing",
    "options": "Options",
    "generate": "Generate"
  },
  "errors": {
    "generic": "Something went wrong",
    "upload": "Failed to upload file",
    "process": "Failed to process image"
  }
}
```

---

### locales/zh.json

**Purpose:** Chinese translation strings.

**Structure:** Same keys as `en.json` with Chinese translations.

```json
{
  "common": {
    "loading": "加载中...",
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "download": "下载"
  },
  "nav": {
    "dashboard": "仪表盘",
    "imageTools": "图片工具",
    "productMockup": "产品样机",
    "modelStudio": "模特工作室",
    "logoStudio": "Logo工作室",
    "videoTools": "视频工具",
    "seo": "SEO工具",
    "admin": "管理",
    "users": "用户管理",
    "settings": "设置"
  }
}
```

---

## Usage

### In Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('imageTools');
  
  return (
    <h1>{t('title')}</h1>
  );
}
```

### In Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('common');
  
  return (
    <button>{t('save')}</button>
  );
}
```

### With Parameters

```json
{
  "greeting": "Hello, {name}!"
}
```

```tsx
t('greeting', { name: 'John' }) // "Hello, John!"
```

### Pluralization

```json
{
  "items": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```

```tsx
t('items', { count: 5 }) // "5 items"
```

---

## Adding New Translations

### 1. Add Keys to Both Files

```json
// en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "Feature description"
  }
}

// zh.json
{
  "newFeature": {
    "title": "新功能",
    "description": "功能描述"
  }
}
```

### 2. Use in Components

```tsx
const t = useTranslations('newFeature');
<h1>{t('title')}</h1>
```

---

## Adding New Locale

### 1. Update config.ts

```typescript
export const locales = ['en', 'zh', 'ja'] as const;

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};
```

### 2. Create Translation File

Create `locales/ja.json` with all keys translated.

### 3. Update Middleware

Ensure middleware handles the new locale.

---

## Best Practices

1. **Organize by Feature**
   ```json
   {
     "featureName": {
       "title": "...",
       "actions": { "save": "...", "delete": "..." }
     }
   }
   ```

2. **Keep Keys Consistent**
   - Same structure in all locale files
   - Use descriptive key names

3. **Handle Missing Translations**
   - Always provide fallback (English)
   - Log missing translations in dev

4. **Update Both Files**
   - When adding keys to `en.json`, also add to `zh.json`
   - Mark untranslated strings for review

---

## Related Documentation

- [App Directory](../app/ARCHITECTURE.md) - Locale routing
- [Components](../components/ARCHITECTURE.md) - Translation usage
- [Middleware](../ARCHITECTURE.md) - Locale detection
