# API Routes Architecture

The `api/` directory contains Next.js API routes for **lightweight operations** that don't require backend AI processing.

---

## Directory Structure

```
api/
├── health/
│   └── route.ts               # Health check (aggregates backend)
├── user-role/
│   └── route.ts               # Get current user's role
├── colors/
│   └── route.ts               # User color preferences
├── webhooks/
│   └── clerk/
│       └── route.ts           # Clerk webhook handler
└── settings/
    ├── system/
    │   └── route.ts           # System settings
    └── models/
        ├── route.ts           # GET/POST AI models
        ├── [id]/
        │   └── route.ts       # GET/PUT/DELETE specific model
        └── defaults/
            ├── route.ts       # GET default models
            └── [taskType]/
                └── [feature]/
                    └── route.ts  # PUT default model for feature
```

---

## API Routes Reference

### Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Aggregate frontend + backend health |

**Response:**
```json
{
  "frontend": "healthy",
  "backend": "healthy" | "unreachable",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### User Role

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/user-role` | GET | Required | Get current user's role |

**Response:**
```json
{
  "role": "admin" | "user"
}
```

---

### Colors API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/colors` | GET | Get user's saved colors |
| `/api/colors` | POST | Save user colors |

---

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/clerk` | POST | Handle Clerk user events |

**Events Handled:**
- `user.created` - Create user role record
- `user.deleted` - Clean up user data

---

### AI Model Settings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/models` | GET | List all AI models |
| `/api/settings/models` | POST | Create new AI model |
| `/api/settings/models/[id]` | GET | Get specific model |
| `/api/settings/models/[id]` | PUT | Update model |
| `/api/settings/models/[id]` | DELETE | Delete model |
| `/api/settings/models/defaults` | GET | Get all default models |
| `/api/settings/models/defaults/[taskType]/[feature]` | PUT | Set default model |

#### GET /api/settings/models

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `task_type` | string | - | Filter by task type |
| `provider` | string | - | Filter by provider |
| `active_only` | boolean | true | Only return active models |

**Response:**
```json
{
  "models": [
    {
      "id": "uuid",
      "provider": "gemini",
      "model_id": "gemini-2.0-flash-exp",
      "display_name": "Gemini 2.0 Flash",
      "task_type": "image_processing",
      "description": "Fast image processing",
      "is_active": true
    }
  ]
}
```

#### POST /api/settings/models

**Request Body:**
```json
{
  "provider": "gemini" | "openai",
  "model_id": "model-name",
  "display_name": "Display Name",
  "task_type": "image_processing" | "video_processing" | "text_processing",
  "description": "Optional description",
  "is_active": true
}
```

#### PUT /api/settings/models/defaults/[taskType]/[feature]

**Request Body:**
```json
{
  "model_id": "uuid-of-ai-model"
}
```

---

## Design Principles

### Lightweight Operations Only

These API routes handle:
- Simple database CRUD operations
- User authentication checks
- Health monitoring
- Settings management

### Heavy Operations → FastAPI Backend

The following are NOT handled here (use FastAPI backend instead):
- AI image processing
- Product mockup generation
- Model studio AI operations
- Operations requiring API keys

### Authentication

Most routes use Clerk authentication:

```typescript
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... authenticated logic
}
```

### Database Access

Routes use Supabase client for database operations:

```typescript
import { supabase } from "@/lib/supabase";

const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("column", value);
```

---

## Adding New API Routes

### 1. Create Route File

```
api/
└── new-feature/
    └── route.ts
```

### 2. Implement Handlers

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("table")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    // Validate and process...

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### 3. Dynamic Routes

For routes with parameters:

```
api/
└── items/
    └── [id]/
        └── route.ts
```

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // Use id in query...
}
```

---

## Error Handling

All routes follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Server error |

---

## Related Documentation

- [App Directory](../ARCHITECTURE.md) - Page routing
- [Backend API](../../../../pupaai-backend/README.md) - FastAPI endpoints
- [Supabase Schema](../../../../supabase/ARCHITECTURE.md) - Database tables
