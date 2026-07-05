# Lib Directory Architecture

Utility libraries and service clients.

---

## Directory Structure

```
lib/
├── api.ts            # Backend API client
├── supabase.ts       # Supabase client & helpers
├── utils.ts          # Utility functions
├── constants.ts      # App constants
└── concurrency.ts    # Parallel processing utilities
```

---

## Files

### api.ts

**Purpose:** Centralized API client for FastAPI backend and Next.js API routes.

**Configuration:**
```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
```

**API Categories:**

#### Image Processing (FastAPI)
| Function | Endpoint | Description |
|----------|----------|-------------|
| `removeBackground` | POST `/api/image/remove-background` | AI background removal |
| `extractLogo` | POST `/api/image/extract-logo` | AI logo extraction |
| `removeLogo` | POST `/api/image/remove-logo` | AI logo/watermark removal |

#### Product Mockup (FastAPI)
| Function | Endpoint | Description |
|----------|----------|-------------|
| `generateMockup` | POST `/api/mockup/generate` | Generate mockup with logo |
| `recolorMockup` | POST `/api/mockup/recolor` | Recolor existing mockup |

#### Model Studio (FastAPI)
| Function | Endpoint | Description |
|----------|----------|-------------|
| `generateModel` | POST `/api/model-studio/generate-model` | AI-generate fashion model |
| `dressModel` | POST `/api/model-studio/dress-model` | Dress model in clothing |

#### Logo Studio (FastAPI)
| Function | Endpoint | Description |
|----------|----------|-------------|
| `generateLogo` | POST `/api/logo-studio/generate` | AI logo generation |

#### Settings (Next.js API)
| Function | Endpoint | Description |
|----------|----------|-------------|
| `getModels` | GET `/api/settings/models` | List AI models |
| `createModel` | POST `/api/settings/models` | Create AI model |
| `updateModel` | PUT `/api/settings/models/[id]` | Update AI model |
| `deleteModel` | DELETE `/api/settings/models/[id]` | Delete AI model |
| `getDefaults` | GET `/api/settings/models/defaults` | Get default models |
| `setDefault` | PUT `/api/settings/models/defaults/[taskType]/[feature]` | Set default |
| `getProviders` | GET `/api/settings/providers` | Get provider status |

**Usage:**
```typescript
import * as api from '@/lib/api';

// Image processing
const result = await api.removeBackground(imageBase64, mimeType, modelId);
if (result.success) {
  const processedImage = result.data.image_base64;
}

// Settings
const modelsResponse = await api.getModels({ task_type: 'image_processing' });
```

**Response Format:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

### supabase.ts

**Purpose:** Supabase client for database and storage operations.

**Client Configuration:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Helper Functions:**

#### Storage Operations
| Function | Description |
|----------|-------------|
| `uploadFile` | Upload file to storage bucket |
| `downloadFile` | Download file from storage |
| `deleteFile` | Delete file from storage |
| `getPublicUrl` | Get public URL for file |

#### Database Operations
| Function | Description |
|----------|-------------|
| `getFolders` | Get user's folders |
| `createFolder` | Create new folder |
| `deleteFolder` | Delete folder |
| `getFiles` | Get files in folder |
| `saveFile` | Save file metadata |
| `deleteFileRecord` | Delete file record |

**Usage:**
```typescript
import { supabase, uploadFile, getFolders } from '@/lib/supabase';

// Direct query
const { data, error } = await supabase
  .from('files')
  .select('*')
  .eq('user_id', userId);

// Helper functions
const folders = await getFolders(userId);
const fileUrl = await uploadFile(file, userId, folderId);
```

---

### utils.ts

**Purpose:** General utility functions.

**Functions:**

| Function | Description | Usage |
|----------|-------------|-------|
| `cn` | Merge Tailwind classes | `cn('base', condition && 'active')` |
| `generateId` | Generate unique ID | `const id = generateId()` |
| `formatFileSize` | Format bytes to human readable | `formatFileSize(1024)` → `"1 KB"` |
| `dataUrlToBase64` | Extract base64 from data URL | `dataUrlToBase64(dataUrl)` |
| `base64ToDataUrl` | Create data URL from base64 | `base64ToDataUrl(base64, mimeType)` |
| `downloadImage` | Trigger browser download | `downloadImage(dataUrl, filename)` |
| `getMimeType` | Get MIME type from file | `getMimeType(file)` |

**Usage:**
```typescript
import { cn, formatFileSize, downloadImage } from '@/lib/utils';

// Class merging
<div className={cn('base-class', isActive && 'active-class')} />

// Format file size
const size = formatFileSize(file.size); // "1.5 MB"

// Download
downloadImage(imageDataUrl, 'processed-image.png');
```

---

### constants.ts

**Purpose:** Application constants.

**Constants:**
```typescript
// Image processing presets
export const CROP_PRESETS = {
  HD: { width: 1280, height: 720 },
  FHD: { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
  SQUARE: { width: 1080, height: 1080 },
  STORY: { width: 1080, height: 1920 },
  BANNER: { width: 1200, height: 628 },
};

export const COMPRESS_PRESETS = [
  { label: '100 KB', value: 100 * 1024 },
  { label: '200 KB', value: 200 * 1024 },
  { label: '500 KB', value: 500 * 1024 },
  { label: '1 MB', value: 1024 * 1024 },
];

// Model studio options
export const ETHNICITY_OPTIONS = ['caucasian', 'black', 'asian', 'hispanic'];
export const GENDER_OPTIONS = ['male', 'female'];
export const SCENE_OPTIONS = ['original', 'home', 'street', 'office'];
export const POSE_OPTIONS = ['front_standing', 'side_standing', 'front_sitting'];

// Color palette
export const DEFAULT_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
];
```

---

### concurrency.ts

**Purpose:** Utilities for parallel processing.

**Functions:**

| Function | Description |
|----------|-------------|
| `runParallel` | Run multiple async operations in parallel |
| `runWithConcurrencyLimit` | Run with max concurrent operations |
| `batchProcess` | Process items in batches |

**Usage:**
```typescript
import { runParallel, runWithConcurrencyLimit } from '@/lib/concurrency';

// Run all in parallel
const results = await runParallel([
  () => processImage(image1),
  () => processImage(image2),
  () => processImage(image3),
]);

// Limit concurrency to 3
const results = await runWithConcurrencyLimit(
  images.map(img => () => processImage(img)),
  3
);
```

---

## Adding New Utilities

### Adding API Endpoint

```typescript
// lib/api.ts

export async function newEndpoint(params: ParamType): Promise<ApiResponse<ResponseType>> {
  const response = await fetch(`${BACKEND_URL}/api/new-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  return handleResponse<ResponseType>(response);
}
```

### Adding Utility Function

```typescript
// lib/utils.ts

export function newUtility(input: InputType): OutputType {
  // Implementation
}
```

---

## Related Documentation

- [Hooks](../hooks/ARCHITECTURE.md) - Hook integration
- [Types](../types/ARCHITECTURE.md) - Type definitions
- [Backend API](../../../../pupaai-backend/README.md) - Backend endpoints
