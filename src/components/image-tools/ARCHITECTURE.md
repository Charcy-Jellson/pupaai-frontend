# Image Tools Components Architecture

Components for the image editing and processing feature.

---

## Directory Structure

```
image-tools/
├── index.ts                  # Barrel exports
├── image-uploader.tsx        # Image upload component
├── image-preview.tsx         # Image display with controls
├── tool-panel.tsx            # Editing tools sidebar
├── multi-image-grid.tsx      # Multiple image display
├── operation-history.tsx     # Undo/redo history
└── saved-images-gallery.tsx  # Gallery of saved images
```

---

## Components

### ImageUploader

**File:** `image-uploader.tsx`

Drag-and-drop image upload component.

**Features:**
- Drag and drop support
- Click to browse
- File type validation
- Size limit enforcement
- Preview on upload

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onUpload` | `(file: File, dataUrl: string) => void` | Upload handler |
| `accept` | `string` | Accepted file types |
| `maxSize` | `number` | Max file size in bytes |

**Usage:**
```tsx
import { ImageUploader } from '@/components/image-tools';

<ImageUploader
  onUpload={(file, dataUrl) => {
    setImage({ file, dataUrl });
  }}
  accept="image/*"
  maxSize={10 * 1024 * 1024} // 10MB
/>
```

---

### ImagePreview

**File:** `image-preview.tsx`

Displays the current image with zoom and comparison controls.

**Features:**
- Zoom in/out
- Before/after comparison
- Checkerboard background for transparency
- Download button

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Image source (data URL or URL) |
| `originalSrc` | `string` | Original image for comparison |
| `alt` | `string` | Alt text |
| `onDownload` | `() => void` | Download handler |

**Usage:**
```tsx
import { ImagePreview } from '@/components/image-tools';

<ImagePreview
  src={processedImage}
  originalSrc={originalImage}
  alt="Processed image"
  onDownload={handleDownload}
/>
```

---

### ToolPanel

**File:** `tool-panel.tsx`

Sidebar panel with editing tools and AI operations.

**Tool Categories:**
1. **Basic Editing**
   - Crop
   - Rotate
   - Compress

2. **AI Operations**
   - Remove Background
   - Extract Logo
   - Remove Logo/Watermark

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onCrop` | `() => void` | Crop handler |
| `onRotate` | `(angle: number) => void` | Rotate handler |
| `onCompress` | `(quality: number) => void` | Compress handler |
| `onRemoveBackground` | `() => Promise<void>` | AI background removal |
| `onExtractLogo` | `() => Promise<void>` | AI logo extraction |
| `onRemoveLogo` | `() => Promise<void>` | AI logo removal |
| `isProcessing` | `boolean` | Loading state |
| `disabled` | `boolean` | Disable all tools |

---

### MultiImageGrid

**File:** `multi-image-grid.tsx`

Grid display for batch image processing.

**Features:**
- Multiple image selection
- Processing status per image
- Batch operations

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `images` | `ImageItem[]` | Array of images |
| `onSelect` | `(id: string) => void` | Selection handler |
| `selectedIds` | `string[]` | Selected image IDs |

---

### OperationHistory

**File:** `operation-history.tsx`

Undo/redo history panel.

**Features:**
- Visual history stack
- Click to restore state
- Clear history

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `history` | `HistoryItem[]` | History stack |
| `currentIndex` | `number` | Current position |
| `onRestore` | `(index: number) => void` | Restore handler |

---

### SavedImagesGallery

**File:** `saved-images-gallery.tsx`

Gallery view of user's saved images.

**Features:**
- Grid/list view toggle
- Folder filtering
- Image selection for editing
- Delete functionality

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onSelect` | `(image: SavedImage) => void` | Selection handler |
| `folderId` | `string \| null` | Filter by folder |

---

## Integration with Hook

These components work with `useImageEditor` hook:

```tsx
// Page component
import { useImageEditor } from '@/hooks/use-image-editor';
import { ImageUploader, ImagePreview, ToolPanel } from '@/components/image-tools';

function ImageToolsPage() {
  const {
    image,
    isProcessing,
    setImage,
    removeBackground,
    extractLogo,
    removeLogo,
  } = useImageEditor();

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        {image ? (
          <ImagePreview src={image.processedUrl || image.originalUrl} />
        ) : (
          <ImageUploader onUpload={setImage} />
        )}
      </div>
      <ToolPanel
        onRemoveBackground={removeBackground}
        onExtractLogo={extractLogo}
        onRemoveLogo={removeLogo}
        isProcessing={isProcessing}
        disabled={!image}
      />
    </div>
  );
}
```

---

## Related Documentation

- [useImageEditor Hook](../../hooks/ARCHITECTURE.md)
- [API Client](../../lib/ARCHITECTURE.md) - `api.image.*`
- [Components Overview](../ARCHITECTURE.md)
