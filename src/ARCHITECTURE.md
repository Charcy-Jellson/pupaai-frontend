# Frontend Source Directory (`src/`)

This is the main source directory containing all frontend application code.

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router (pages & API routes)
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
├── types/                  # TypeScript type definitions
├── i18n/                   # Internationalization configuration
└── middleware.ts           # Next.js middleware
```

---

## Sub-directory Index

| Directory | Documentation | Description |
|-----------|---------------|-------------|
| `app/` | [app/ARCHITECTURE.md](app/ARCHITECTURE.md) | Next.js pages and API routes |
| `components/` | [components/ARCHITECTURE.md](components/ARCHITECTURE.md) | React component library |
| `hooks/` | [hooks/ARCHITECTURE.md](hooks/ARCHITECTURE.md) | Custom React hooks |
| `lib/` | [lib/ARCHITECTURE.md](lib/ARCHITECTURE.md) | Utility libraries |
| `types/` | [types/ARCHITECTURE.md](types/ARCHITECTURE.md) | TypeScript definitions |
| `i18n/` | [i18n/ARCHITECTURE.md](i18n/ARCHITECTURE.md) | Internationalization |

---

## Key Files

### middleware.ts

The Next.js middleware handles:
- **Authentication**: Clerk authentication protection
- **Internationalization**: Locale detection and routing
- **Route Protection**: Redirects unauthenticated users from dashboard

```typescript
// Middleware flow:
// 1. Check locale from URL/cookie/Accept-Language
// 2. Verify authentication for protected routes
// 3. Redirect or continue based on rules
```

**Protected Routes:**
- `/[locale]/dashboard/*` - Requires authentication
- `/[locale]/sign-in`, `/[locale]/sign-up` - Public

**Public Routes:**
- `/[locale]/` - Marketing landing page
- `/[locale]/about` - About page

---

## Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `app/` | Route definitions, page components, API handlers |
| `components/` | Reusable UI components, feature-specific components |
| `hooks/` | Business logic, state management, side effects |
| `lib/` | API client, Supabase client, utility functions |
| `types/` | TypeScript interfaces and type definitions |
| `i18n/` | Translation strings, locale configuration |

---

## Development Workflow

### Adding a New Feature

1. **Define Types** → `types/feature-name.ts`
2. **Create Hook** → `hooks/use-feature-name.ts`
3. **Build Components** → `components/feature-name/`
4. **Create Page** → `app/[locale]/(dashboard)/dashboard/feature-name/page.tsx`
5. **Add API Calls** → `lib/api.ts`
6. **Add Translations** → `i18n/locales/en.json`, `zh.json`

### Modifying Existing Features

1. Locate the feature in the relevant directory
2. Make changes following existing patterns
3. Update corresponding `ARCHITECTURE.md` if structure changes
4. Update types if API contracts change

---

## Related Documentation

- [Frontend Architecture](../ARCHITECTURE.md) - Overall frontend structure
- [Frontend README](../README.md) - Project introduction
- [Cursor Rules](../../.cursor/rules/pupa-ai-fullstack.mdc) - Coding standards
