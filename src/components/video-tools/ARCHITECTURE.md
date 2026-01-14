# Video Tools Components Architecture

Components for video processing and generation features.

> **Note:** Video tools is currently a placeholder feature with limited functionality.

---

## Directory Structure

```
video-tools/
├── image-to-video.tsx     # Convert image to video
├── text-to-video.tsx      # Generate video from text
├── video-analysis.tsx     # Video content analysis
└── watermark-remover/     # Video watermark removal (future)
```

---

## Components

### ImageToVideo

**File:** `image-to-video.tsx`

Converts static images to animated video content.

**Features:**
- Image upload
- Animation style selection
- Duration configuration
- Preview generation

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onGenerate` | `(config: ImageToVideoConfig) => Promise<void>` | Generation handler |
| `isGenerating` | `boolean` | Loading state |

**Status:** Placeholder - awaiting backend integration

---

### TextToVideo

**File:** `text-to-video.tsx`

Generates video content from text descriptions.

**Features:**
- Text prompt input
- Style selection
- Duration configuration
- Preview generation

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onGenerate` | `(config: TextToVideoConfig) => Promise<void>` | Generation handler |
| `isGenerating` | `boolean` | Loading state |

**Status:** Placeholder - awaiting backend integration

---

### VideoAnalysis

**File:** `video-analysis.tsx`

Analyzes video content using AI.

**Features:**
- Video upload
- Content description generation
- Scene breakdown
- Object detection

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onAnalyze` | `(video: File) => Promise<AnalysisResult>` | Analysis handler |
| `isAnalyzing` | `boolean` | Loading state |

**Status:** Placeholder - awaiting backend integration

---

## Future Development

When implementing video tools:

1. **Backend Integration**
   - Create FastAPI endpoints in `pupaai-backend/app/api/video.py`
   - Add video service in `pupaai-backend/app/services/video_service.py`
   - Integrate with OpenAI Sora or similar video AI

2. **Frontend Hook**
   - Create `hooks/use-video-tools.ts`
   - Implement state management for video processing

3. **API Client**
   - Add video methods to `lib/api.ts`:
   ```typescript
   video: {
     imageToVideo: (data) => post('/api/video/image-to-video', data),
     textToVideo: (data) => post('/api/video/text-to-video', data),
     analyze: (data) => post('/api/video/analyze', data),
   }
   ```

4. **Types**
   - Expand `types/video-tools.ts` with full type definitions

---

## Related Documentation

- [Components Overview](../ARCHITECTURE.md)
- [Backend API](../../../../pupaai-backend/README.md)
