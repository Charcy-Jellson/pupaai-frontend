# Hair Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 理发店发型广告图功能——角色卡（一等资产/角色库）→ 白底姿势立绘（rembg 抠图）→ 拖放摆位 → AI 融合，三步向导独立页面 Hair Studio。

**Architecture:** 后端 FastAPI 加 3 个生图端点（全部走 ai_router 按 feature 配模型 + enforce_ai_quota 配额），rembg 复用现有 `background_service`；前端新增 hair-studio 三步向导页与组件，`characters` 表走"前端直连 + Clerk token + RLS"模式（与 folders/files 一致）；spec 见 `docs/superpowers/specs/2026-07-05-hair-studio-design.md`。

**Tech Stack:** Next.js 15 / FastAPI / google-genai（gemini-3.1-flash-image 默认）/ rembg / Supabase（RLS）/ Clerk。

**Repos:** 后端任务在 `pupaai-backend/`，前端任务在 `pupaai-frontend/`（两个独立 git 仓库，分别提交）。DB 迁移用 Supabase MCP `execute_sql` 应用（项目 `uewpqoulzuiexqjqzeqp`），迁移文件存 `Pupa-AI/supabase/migrations/`（不在 git 仓库内，无需 commit）。

---

## M1 — 后端

### Task 1: DB 迁移 0005（characters 表 + RLS + 三个 feature 默认模型）

**Files:**
- Create: `supabase/migrations/0005_hair_studio.sql`（仓库根 `Pupa-AI/supabase/migrations/`）

- [ ] **Step 1: 写迁移文件**

```sql
-- Migration 0005: Hair Studio — characters library + default models for 3 new features

CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,                 -- Clerk user id
    name TEXT NOT NULL,
    card_storage_path TEXT NOT NULL,       -- users/{uid}/characters/{id}/card.png
    face_desc TEXT,
    hair_desc TEXT,
    outfit_desc TEXT,
    face_ref_path TEXT,
    hair_ref_path TEXT,
    outfit_ref_path TEXT,
    seed INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);

DROP TRIGGER IF EXISTS update_characters_updated_at ON public.characters;
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON public.characters
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "characters_select_own" ON public.characters;
DROP POLICY IF EXISTS "characters_insert_own" ON public.characters;
DROP POLICY IF EXISTS "characters_update_own" ON public.characters;
DROP POLICY IF EXISTS "characters_delete_own" ON public.characters;
CREATE POLICY "characters_select_own" ON public.characters FOR SELECT
  USING (auth.jwt()->>'sub' = user_id);
CREATE POLICY "characters_insert_own" ON public.characters FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = user_id);
CREATE POLICY "characters_update_own" ON public.characters FOR UPDATE
  USING (auth.jwt()->>'sub' = user_id) WITH CHECK (auth.jwt()->>'sub' = user_id);
CREATE POLICY "characters_delete_own" ON public.characters FOR DELETE
  USING (auth.jwt()->>'sub' = user_id);

-- Default model for the three new image features
DO $$
DECLARE
  img_id UUID;
  feat TEXT;
BEGIN
  SELECT id INTO img_id FROM ai_models
    WHERE provider='gemini' AND model_id='gemini-3.1-flash-image' AND task_type='image_processing';
  IF img_id IS NOT NULL THEN
    FOREACH feat IN ARRAY ARRAY['generate_character_card','generate_pose_sprite','fuse_scene'] LOOP
      INSERT INTO ai_default_models (task_type, feature, model_id)
      VALUES ('image_processing', feat, img_id)
      ON CONFLICT (task_type, feature) DO UPDATE SET model_id = EXCLUDED.model_id;
    END LOOP;
  END IF;
END $$;
```

- [ ] **Step 2: 用 Supabase MCP `execute_sql` 对项目 `uewpqoulzuiexqjqzeqp` 执行上述 SQL**

- [ ] **Step 3: 验证**

用 MCP 执行：
```sql
SELECT policyname FROM pg_policies WHERE tablename='characters';
SELECT feature, m.model_id FROM ai_default_models d JOIN ai_models m ON m.id=d.model_id
 WHERE d.feature IN ('generate_character_card','generate_pose_sprite','fuse_scene');
```
Expected: 4 条 `characters_*_own` 策略；3 行 feature → `gemini-3.1-flash-image`。

### Task 2: 提示词构建模块（TDD）

**Files:**
- Create: `pupaai-backend/app/services/hair_prompts.py`
- Create: `pupaai-backend/tests/test_hair_prompts.py`

- [ ] **Step 1: 安装 pytest（仅本地 venv，开发用）**

Run: `cd pupaai-backend && uv pip install --python .venv/bin/python pytest`

- [ ] **Step 2: 写失败测试 `tests/test_hair_prompts.py`**

```python
from app.services.hair_prompts import build_card_prompt, build_sprite_prompt, build_fuse_prompt


def test_card_prompt_defaults():
    p = build_card_prompt(face_desc=None, hair_desc=None, outfit_desc=None,
                          has_face_ref=False, has_hair_ref=False, has_outfit_ref=False)
    assert "East Asian" in p                       # 默认脸
    assert "white t-shirt" in p.lower()            # 默认服装
    assert "photorealistic" in p.lower()           # 摄影风
    assert "anime" not in p.lower()                # 不许出现动漫风
    assert "front, side, and back" in p            # 三视图
    assert "six" in p.lower()                      # 6 表情


def test_card_prompt_with_refs_and_desc():
    p = build_card_prompt(face_desc=None, hair_desc="short black bob", outfit_desc=None,
                          has_face_ref=True, has_hair_ref=False, has_outfit_ref=True)
    assert "face reference image" in p             # 有脸参考图时引用它
    assert "short black bob" in p                  # 发型文字进占位
    assert "outfit reference image" in p           # 服装参考图


def test_sprite_prompt_maps_options():
    p = build_sprite_prompt(card_desc="a young woman, short black bob",
                            angle="back", composition="full_body", pose="standing",
                            action="running fingers through hair")
    assert "back view" in p
    assert "full body" in p.lower()
    assert "standing" in p
    assert "running fingers through hair" in p
    assert "white" in p.lower()                    # 白底
    assert "EXACT same" in p                       # 一致性强调


def test_fuse_prompt_mentions_integration():
    p = build_fuse_prompt()
    assert "composite draft" in p
    assert "lighting" in p
    assert "EXACTLY" in p                          # 人物保持不变
    assert "aspect ratio" in p                     # 画布不变
```

- [ ] **Step 3: 跑测试确认失败**

Run: `cd pupaai-backend && .venv/bin/python -m pytest tests/test_hair_prompts.py -v`
Expected: FAIL（ModuleNotFoundError: hair_prompts）

- [ ] **Step 4: 实现 `app/services/hair_prompts.py`**

```python
"""Prompt builders for Hair Studio (character card / pose sprite / scene fusion).

Pure functions — no I/O — so the exact prompt text is unit-testable.
Reference-image ordering convention (must match gemini_service call sites):
the prompt names references in the order face -> hair -> outfit, and callers
append the images to `contents` in that same order.
"""
from typing import Optional

ANGLE_TEXT = {
    "front": "front view, facing the camera",
    "side": "side profile view",
    "back": "back view, seen from behind",
    "three_quarter": "three-quarter (45-degree) view",
}
COMPOSITION_TEXT = {"full_body": "full body from head to toe", "half_body": "upper body (waist-up)"}
POSE_TEXT = {"standing": "standing", "sitting": "sitting"}

_DEFAULT_FACE = "a beautiful 20-year-old East Asian woman with delicate features"
_DEFAULT_OUTFIT = "a simple white t-shirt and blue jeans"
_STYLE = (
    "Photorealistic, professional studio photography, natural skin texture, "
    "soft even lighting, shot on an 85mm lens, masterful detail, high resolution."
)


def build_card_prompt(
    face_desc: Optional[str], hair_desc: Optional[str], outfit_desc: Optional[str],
    has_face_ref: bool, has_hair_ref: bool, has_outfit_ref: bool,
) -> str:
    if has_face_ref:
        face = "preserving the identical face of the woman shown in the face reference image"
    elif face_desc:
        face = f"a beautiful 20-year-old woman with {face_desc}"
    else:
        face = _DEFAULT_FACE

    if has_hair_ref:
        hair = ("with exactly the same hairstyle and hair color as the person in the hair "
                "reference image (copy ONLY the hairstyle from that image, ignore the person)")
    elif hair_desc:
        hair = f"with {hair_desc}"
    else:
        hair = "with an elegant modern hairstyle"

    if has_outfit_ref:
        outfit = "dressed in exactly the clothing shown in the outfit reference image"
    elif outfit_desc:
        outfit = f"dressed in {outfit_desc}"
    else:
        outfit = f"dressed in {_DEFAULT_OUTFIT}"

    return (
        f"A detailed character model sheet and design concept card of {face}, {hair}. "
        "Pure white background, clean negative space, minimalist magazine-style layout, "
        "absolutely no text, no border. "
        "On the left: a large, highly detailed close-up portrait of her face. "
        f"On the right: three full-body views showing her from the front, side, and back, {outfit}. "
        "Below the full-body views: six smaller round headshot portraits showing six distinct "
        "facial expressions: calm, smiling, shy, confident, surprised, and angry. "
        f"{_STYLE}"
    )


def build_sprite_prompt(card_desc: str, angle: str, composition: str, pose: str,
                        action: Optional[str]) -> str:
    angle_t = ANGLE_TEXT.get(angle, ANGLE_TEXT["front"])
    comp_t = COMPOSITION_TEXT.get(composition, COMPOSITION_TEXT["full_body"])
    pose_t = POSE_TEXT.get(pose, POSE_TEXT["standing"])
    action_t = f", {action.strip()}" if action and action.strip() else ""
    return (
        "Using the character model sheet reference image, generate a single photorealistic photo "
        "of the EXACT same woman — identical face, identical hairstyle and hair color, identical "
        f"outfit. Character summary: {card_desc}. "
        f"Shot: {comp_t}, {angle_t}, {pose_t}{action_t}. "
        "Pure white seamless studio background, soft even lighting, no shadows on the background, "
        "absolutely no text, single person only. "
        f"{_STYLE}"
    )


def build_fuse_prompt() -> str:
    return (
        "This image is a rough composite draft: a person has been pasted onto a background photo "
        "and the blend looks artificial. Refine it into ONE natural photorealistic photograph: "
        "integrate the person into the scene, match the scene's lighting direction and color "
        "grading, add realistic contact shadows and reflections, correct the perspective, and "
        "blend the edges cleanly. "
        "CRITICAL: keep the person's face, hairstyle, outfit, pose, position and size EXACTLY as "
        "in the draft. Keep the background content unchanged. Keep the canvas size and aspect "
        "ratio identical to the draft. Output a single high-quality realistic photo."
    )
```

- [ ] **Step 5: 跑测试确认通过**

Run: `.venv/bin/python -m pytest tests/test_hair_prompts.py -v`
Expected: 4 passed

- [ ] **Step 6: Commit（backend 仓库）**

```bash
cd pupaai-backend && git add app/services/hair_prompts.py tests/test_hair_prompts.py
git commit -m "feat(hair-studio): prompt builders with unit tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 3: gemini_service 三个生成方法 + `_generate_image` 支持按次 image_size

**Files:**
- Modify: `pupaai-backend/app/services/gemini_service.py`（`_generate_image` 约 :86-119；新方法加在 `apply_nail_to_hand` 之后、单例声明之前 :1357）

- [ ] **Step 1: 扩展 `_generate_image` 签名（向后兼容）**

把 `use_image_config: bool = False` 之后加参数 `image_size: Optional[str] = None`，并把
`config["image_config"] = {"image_size": self.DEFAULT_IMAGE_SIZE}` 改为：

```python
        if use_image_config or image_size:
            config["image_config"] = {"image_size": image_size or self.DEFAULT_IMAGE_SIZE}
```

（原 `if use_image_config:` 分支整体替换为上面两行。）

- [ ] **Step 2: 新增三个方法（模式与 `apply_nail_to_hand` 一致，`@offloaded()` 装饰）**

```python
    @offloaded()
    def generate_character_card(
        self,
        face_image_base64: Optional[str] = None,
        hair_image_base64: Optional[str] = None,
        outfit_image_base64: Optional[str] = None,
        face_desc: Optional[str] = None,
        hair_desc: Optional[str] = None,
        outfit_desc: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> Dict[str, str]:
        """Generate a photorealistic character model sheet (Hair Studio step 1)."""
        if not self.is_configured():
            raise Exception("Gemini API is not configured. Please add GOOGLE_GEMINI_API_KEY to your environment.")
        try:
            from app.services.hair_prompts import build_card_prompt

            # Reference order MUST be face -> hair -> outfit (matches prompt wording)
            ref_images = []
            for b64 in (face_image_base64, hair_image_base64, outfit_image_base64):
                if b64:
                    ref_images.append(self._decode_image(b64))

            prompt = build_card_prompt(
                face_desc=face_desc, hair_desc=hair_desc, outfit_desc=outfit_desc,
                has_face_ref=bool(face_image_base64),
                has_hair_ref=bool(hair_image_base64),
                has_outfit_ref=bool(outfit_image_base64),
            )
            generated = self._generate_image(
                prompt=prompt, contents=ref_images,
                model=model_id or self.DEFAULT_IMAGE_MODEL,
                use_seed=True, use_image_config=True,
            )
            if not generated:
                raise Exception("Image generation did not return any image data")
            return {"image_base64": self._encode_image(generated, "image/png"),
                    "mime_type": "image/png"}
        except Exception as e:
            raise Exception(f"Failed to generate character card with Gemini: {str(e)}")

    @offloaded()
    def generate_pose_sprite(
        self,
        card_image_base64: str,
        card_desc: str,
        angle: str,
        composition: str,
        pose: str,
        action: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> Dict[str, str]:
        """Generate a single white-background pose shot of the card's character (step 2).
        Caller strips the background with background_service afterwards."""
        if not self.is_configured():
            raise Exception("Gemini API is not configured. Please add GOOGLE_GEMINI_API_KEY to your environment.")
        try:
            from app.services.hair_prompts import build_sprite_prompt

            card_image = self._decode_image(card_image_base64)
            prompt = build_sprite_prompt(card_desc=card_desc, angle=angle,
                                         composition=composition, pose=pose, action=action)
            generated = self._generate_image(
                prompt=prompt, contents=[card_image],
                model=model_id or self.DEFAULT_IMAGE_MODEL,
                use_seed=True, use_image_config=True,
            )
            if not generated:
                raise Exception("Image generation did not return any image data")
            return {"image_base64": self._encode_image(generated, "image/png"),
                    "mime_type": "image/png"}
        except Exception as e:
            raise Exception(f"Failed to generate pose sprite with Gemini: {str(e)}")

    @offloaded()
    def fuse_scene(
        self,
        draft_image_base64: str,
        draft_mime_type: str,
        image_size: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> Dict[str, str]:
        """Refine a user-arranged composite draft into a natural photo (step 3)."""
        if not self.is_configured():
            raise Exception("Gemini API is not configured. Please add GOOGLE_GEMINI_API_KEY to your environment.")
        try:
            from app.services.hair_prompts import build_fuse_prompt

            draft = self._decode_image(draft_image_base64)
            w, h = draft.size
            prompt = build_fuse_prompt() + f" Output dimensions must match the draft: {w}x{h} pixels."
            generated = self._generate_image(
                prompt=prompt, contents=[draft],
                model=model_id or self.DEFAULT_IMAGE_MODEL,
                use_seed=False, image_size=image_size,
            )
            if not generated:
                raise Exception("Image generation did not return any image data")
            out_mime = draft_mime_type if draft_mime_type in ["image/png", "image/jpeg", "image/jpg", "image/webp"] else "image/png"
            return {"image_base64": self._encode_image(generated, out_mime),
                    "mime_type": out_mime}
        except Exception as e:
            raise Exception(f"Failed to fuse scene with Gemini: {str(e)}")
```

- [ ] **Step 3: 编译检查**

Run: `.venv/bin/python -m py_compile app/services/gemini_service.py && echo OK`
Expected: OK

- [ ] **Step 4: Commit**

```bash
git add app/services/gemini_service.py
git commit -m "feat(hair-studio): card/sprite/fuse generation methods in gemini_service

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: ai_router 三个 feature + 三个路由方法

**Files:**
- Modify: `pupaai-backend/app/services/ai_router.py`（FeatureType :12-20；方法加在 "Video / Text Processing Methods" 段之前）

- [ ] **Step 1: FeatureType 增加三项**

在 `"change_nail_background", "apply_nail_to_hand",` 之后加：

```python
    # hair studio
    "generate_character_card", "generate_pose_sprite", "fuse_scene",
```

- [ ] **Step 2: 新增三个方法（Gemini-only，模式同 analyze_video 的非 Gemini 回退）**

```python
    # =========================================================================
    # Hair Studio Methods (Gemini-only)
    # =========================================================================

    async def generate_character_card(self, model_uuid_override: Optional[str] = None,
                                      **kwargs: Any) -> Dict[str, str]:
        service, model_id = await self._resolve_model(
            "image_processing", "generate_character_card", model_uuid_override)
        if service is not self.gemini_service:
            model_id = GeminiService.DEFAULT_IMAGE_MODEL
        return await self.gemini_service.generate_character_card(model_id=model_id, **kwargs)

    async def generate_pose_sprite(self, model_uuid_override: Optional[str] = None,
                                   **kwargs: Any) -> Dict[str, str]:
        service, model_id = await self._resolve_model(
            "image_processing", "generate_pose_sprite", model_uuid_override)
        if service is not self.gemini_service:
            model_id = GeminiService.DEFAULT_IMAGE_MODEL
        return await self.gemini_service.generate_pose_sprite(model_id=model_id, **kwargs)

    async def fuse_scene(self, model_uuid_override: Optional[str] = None,
                         **kwargs: Any) -> Dict[str, str]:
        service, model_id = await self._resolve_model(
            "image_processing", "fuse_scene", model_uuid_override)
        if service is not self.gemini_service:
            model_id = GeminiService.DEFAULT_IMAGE_MODEL
        return await self.gemini_service.fuse_scene(model_id=model_id, **kwargs)
```

- [ ] **Step 3: 编译 + import 冒烟**

Run: `.venv/bin/python -c "import app.services.ai_router as r; print(hasattr(r.ai_router,'fuse_scene'))"`
Expected: True

- [ ] **Step 4: Commit**

```bash
git add app/services/ai_router.py
git commit -m "feat(hair-studio): route card/sprite/fuse features through ai_router

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 5: `/api/hair-studio` 三端点 + 注册

**Files:**
- Create: `pupaai-backend/app/api/hair_studio.py`
- Modify: `pupaai-backend/main.py`（import :6 与 include_router 段 :70 附近）

- [ ] **Step 1: 写路由文件（结构完全对照 `app/api/nail_studio.py`）**

```python
import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional
from app.services.ai_router import ai_router
from app.services.background_service import background_service
from app.core.quota import enforce_ai_quota

router = APIRouter()

logger = logging.getLogger(__name__)


class GenerateCardRequest(BaseModel):
    """Character model-sheet generation. Every dimension is optional: image, text or neither."""
    face_image_base64: Optional[str] = None
    hair_image_base64: Optional[str] = None
    outfit_image_base64: Optional[str] = None
    face_desc: Optional[str] = Field(None, max_length=1000)
    hair_desc: Optional[str] = Field(None, max_length=1000)
    outfit_desc: Optional[str] = Field(None, max_length=1000)


class GenerateSpriteRequest(BaseModel):
    """White-background pose shot of the card's character; returns transparent PNG."""
    card_image_base64: str
    card_desc: str = Field(..., max_length=3000)
    angle: str = Field("front", pattern="^(front|side|back|three_quarter)$")
    composition: str = Field("full_body", pattern="^(full_body|half_body)$")
    pose: str = Field("standing", pattern="^(standing|sitting)$")
    action: Optional[str] = Field(None, max_length=500)


class FuseSceneRequest(BaseModel):
    """Refine a user-arranged composite draft (background + pasted sprite)."""
    draft_image_base64: str
    draft_mime_type: str = Field("image/png", max_length=100)
    image_size: Optional[str] = Field(None, pattern="^(1K|2K|4K)$")


class HairStudioResponse(BaseModel):
    image_base64: str
    mime_type: str
    model_used: Optional[str] = None


@router.post("/generate-card", response_model=HairStudioResponse)
async def generate_card(
    request: GenerateCardRequest,
    user: dict = Depends(enforce_ai_quota),
    model_id: Optional[str] = Query(None, description="AI model UUID to use"),
):
    """Generate a photorealistic character model sheet from optional face/hair/outfit refs."""
    try:
        result = await ai_router.generate_character_card(
            face_image_base64=request.face_image_base64,
            hair_image_base64=request.hair_image_base64,
            outfit_image_base64=request.outfit_image_base64,
            face_desc=request.face_desc,
            hair_desc=request.hair_desc,
            outfit_desc=request.outfit_desc,
            model_uuid_override=model_id,
        )
        return HairStudioResponse(**result, model_used=model_id or "default")
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="The AI service timed out. Please try again.")
    except Exception:
        logger.exception("Unhandled error in %s", __name__)
        raise HTTPException(status_code=500, detail="Processing failed")


@router.post("/generate-sprite", response_model=HairStudioResponse)
async def generate_sprite(
    request: GenerateSpriteRequest,
    user: dict = Depends(enforce_ai_quota),
    model_id: Optional[str] = Query(None, description="AI model UUID to use"),
):
    """Generate a pose shot of the character, then strip the background (rembg)."""
    try:
        shot = await ai_router.generate_pose_sprite(
            card_image_base64=request.card_image_base64,
            card_desc=request.card_desc,
            angle=request.angle,
            composition=request.composition,
            pose=request.pose,
            action=request.action,
            model_uuid_override=model_id,
        )
        # background_service.remove_background is @offloaded -> awaitable; returns transparent PNG
        cutout = await background_service.remove_background(shot["image_base64"], shot["mime_type"])
        return HairStudioResponse(
            image_base64=cutout["image_base64"],
            mime_type="image/png",
            model_used=model_id or "default",
        )
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="The AI service timed out. Please try again.")
    except Exception:
        logger.exception("Unhandled error in %s", __name__)
        raise HTTPException(status_code=500, detail="Processing failed")


@router.post("/fuse", response_model=HairStudioResponse)
async def fuse(
    request: FuseSceneRequest,
    user: dict = Depends(enforce_ai_quota),
    model_id: Optional[str] = Query(None, description="AI model UUID to use"),
):
    """Fuse the user's composite draft into a natural photorealistic image."""
    try:
        result = await ai_router.fuse_scene(
            draft_image_base64=request.draft_image_base64,
            draft_mime_type=request.draft_mime_type,
            image_size=request.image_size,
            model_uuid_override=model_id,
        )
        return HairStudioResponse(**result, model_used=model_id or "default")
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="The AI service timed out. Please try again.")
    except Exception:
        logger.exception("Unhandled error in %s", __name__)
        raise HTTPException(status_code=500, detail="Processing failed")
```

- [ ] **Step 2: 注册路由（main.py）**

import 行加 `hair_studio`：
```python
from app.api import image, health, users, mockup, model_studio, logo_studio, video, nail_studio, hair_studio
```
include 段加：
```python
app.include_router(hair_studio.router, prefix="/api/hair-studio", tags=["Hair Studio"])
```

- [ ] **Step 3: 冒烟验证**

Run: `.venv/bin/python -c "import main; print('OK')"` → OK
重启本地后端（preview backend :8001），然后：
Run: `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8001/api/hair-studio/generate-card -H "Content-Type: application/json" -d '{}'`
Expected: `401`（无 token 被鉴权拦下 = 路由已挂且受保护）

- [ ] **Step 4: Commit**

```bash
git add app/api/hair_studio.py main.py
git commit -m "feat(hair-studio): /generate-card /generate-sprite /fuse endpoints

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 6: 后端真机冒烟（一次真实生成链）

- [ ] **Step 1: 直调服务层跑通 卡→立绘→抠图**

```bash
cd pupaai-backend && .venv/bin/python - <<'PY'
import asyncio, base64
from app.services.ai_router import ai_router
from app.services.background_service import background_service

async def main():
    card = await ai_router.generate_character_card(hair_desc="short black bob haircut")
    print("card bytes:", len(card["image_base64"]))
    shot = await ai_router.generate_pose_sprite(
        card_image_base64=card["image_base64"], card_desc="20-year-old East Asian woman, short black bob",
        angle="three_quarter", composition="full_body", pose="standing", action="smiling at camera")
    cut = await background_service.remove_background(shot["image_base64"], shot["mime_type"])
    open('/tmp/hair_card.png','wb').write(base64.b64decode(card["image_base64"]))
    open('/tmp/hair_sprite.png','wb').write(base64.b64decode(cut["image_base64"]))
    print("sprite ok")
asyncio.run(main())
PY
```
Expected: 打印 card bytes / sprite ok；`/tmp/hair_card.png` 是模特卡、`/tmp/hair_sprite.png` 是透明立绘（人工打开目检）。

---

## M2 — 角色库与角色卡 UI

### Task 7: `lib/supabase.ts` characters CRUD + 资产上传

**Files:**
- Modify: `pupaai-frontend/src/lib/supabase.ts`（类型加在 `FileRecord` 后 :59；函数加在文件末尾 helpers 前）

- [ ] **Step 1: 加类型与 CRUD（完全对照 folders/files 模式；RLS 兜底归属）**

```typescript
export interface CharacterRecord {
  id: string;
  user_id: string;
  name: string;
  card_storage_path: string;
  face_desc: string | null;
  hair_desc: string | null;
  outfit_desc: string | null;
  face_ref_path: string | null;
  hair_ref_path: string | null;
  outfit_ref_path: string | null;
  seed: number | null;
  created_at: string;
  updated_at: string;
}

// ==================== Character (Hair Studio) Functions ====================

/** Upload a character asset (card image or a reference image) from a data URL.
 *  Path: users/{userId}/characters/{characterId}/{label}.png  */
export async function uploadCharacterAsset(
  userId: string,
  characterId: string,
  label: "card" | "face_ref" | "hair_ref" | "outfit_ref",
  dataUrl: string
): Promise<string | null> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `users/${userId}/characters/${characterId}/${label}.png`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { cacheControl: "3600", upsert: true });
  if (error) {
    console.error("uploadCharacterAsset error:", error.message);
    return null;
  }
  return path;
}

export async function createCharacter(
  userId: string,
  data: Omit<CharacterRecord, "id" | "user_id" | "created_at" | "updated_at">
): Promise<CharacterRecord | null> {
  const { data: row, error } = await supabase
    .from("characters")
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) {
    console.error("createCharacter error:", error.message);
    return null;
  }
  return row as CharacterRecord;
}

export async function getUserCharacters(userId: string): Promise<CharacterRecord[]> {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getUserCharacters error:", error);
    return [];
  }
  return data as CharacterRecord[];
}

export async function renameCharacter(characterId: string, newName: string): Promise<boolean> {
  const { error } = await supabase
    .from("characters")
    .update({ name: newName })
    .eq("id", characterId);
  if (error) console.error("renameCharacter error:", error.message);
  return !error;
}

export async function deleteCharacter(characterId: string, cardStoragePath: string): Promise<boolean> {
  // Best-effort storage cleanup (folder prefix), then the row (RLS scopes to owner)
  const prefix = cardStoragePath.replace(/\/card\.png$/, "");
  const { data: assets } = await supabase.storage.from(STORAGE_BUCKET).list(prefix);
  if (assets && assets.length > 0) {
    await supabase.storage.from(STORAGE_BUCKET).remove(assets.map((a) => `${prefix}/${a.name}`));
  }
  const { error } = await supabase.from("characters").delete().eq("id", characterId);
  if (error) console.error("deleteCharacter error:", error.message);
  return !error;
}
```

- [ ] **Step 2: `npx tsc --noEmit`** → exit 0
- [ ] **Step 3: Commit（frontend 仓库）**

```bash
cd pupaai-frontend && git add src/lib/supabase.ts
git commit -m "feat(hair-studio): characters CRUD + asset upload in supabase lib

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 8: `lib/api.ts` 三个后端调用

**Files:**
- Modify: `pupaai-frontend/src/lib/api.ts`（加在 Nail Studio 段之后，模式对照 `buildNailStudioUrl` :383-389）

- [ ] **Step 1: 加 URL builder + 3 个函数（全部带 authToken）**

```typescript
// =============================================================================
// Hair Studio API (calls FastAPI backend)
// =============================================================================

function buildHairStudioUrl(endpoint: string, modelId?: string): string {
  const url = `${BACKEND_URL}/api/hair-studio/${endpoint}`;
  return modelId ? `${url}?model_id=${modelId}` : url;
}

export type SpriteAngle = "front" | "side" | "back" | "three_quarter";
export type SpriteComposition = "full_body" | "half_body";
export type SpritePose = "standing" | "sitting";
export type FuseImageSize = "1K" | "2K" | "4K";

export interface GenerateCardRequest {
  face_image_base64?: string;
  hair_image_base64?: string;
  outfit_image_base64?: string;
  face_desc?: string;
  hair_desc?: string;
  outfit_desc?: string;
}

export async function generateCharacterCard(
  request: GenerateCardRequest,
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildHairStudioUrl("generate-card", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify(request),
  });
  return handleResponse<ProcessedImageResponse>(response);
}

export async function generatePoseSprite(
  request: {
    card_image_base64: string;
    card_desc: string;
    angle: SpriteAngle;
    composition: SpriteComposition;
    pose: SpritePose;
    action?: string;
  },
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildHairStudioUrl("generate-sprite", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify(request),
  });
  return handleResponse<ProcessedImageResponse>(response);
}

export async function fuseScene(
  request: { draft_image_base64: string; draft_mime_type?: string; image_size?: FuseImageSize },
  modelId?: string,
  authToken?: string
): Promise<ApiResponse<ProcessedImageResponse>> {
  const response = await fetch(buildHairStudioUrl("fuse", modelId), {
    method: "POST",
    headers: buildAuthHeaders(authToken),
    body: JSON.stringify(request),
  });
  return handleResponse<ProcessedImageResponse>(response);
}
```

- [ ] **Step 2: `npx tsc --noEmit`** → exit 0
- [ ] **Step 3: Commit** `git add src/lib/api.ts && git commit -m "feat(hair-studio): api client for card/sprite/fuse ..."`（附 Co-Authored-By 尾行，下同）

### Task 9: `use-hair-studio.ts` hook（状态机）

**Files:**
- Create: `pupaai-frontend/src/types/hair-studio.ts`
- Create: `pupaai-frontend/src/hooks/use-hair-studio.ts`

- [ ] **Step 1: 类型文件**

```typescript
import type { SpriteAngle, SpriteComposition, SpritePose, FuseImageSize } from "@/lib/api";
import type { CharacterRecord } from "@/lib/supabase";

export type HairStudioStep = 1 | 2 | 3;
export type ItemStatus = "pending" | "processing" | "fulfilled" | "rejected";

export interface CardBuilderState {
  name: string;
  faceImage: string | null;    // data URL
  hairImage: string | null;
  outfitImage: string | null;
  faceDesc: string;
  hairDesc: string;
  outfitDesc: string;
}

export interface SpriteItem {
  id: string;
  angle: SpriteAngle;
  composition: SpriteComposition;
  pose: SpritePose;
  action: string;
  imageDataUrl: string | null;  // transparent PNG data URL
  status: ItemStatus;
  error: string | null;
}

export interface PlacementTransform { x: number; y: number; scale: number }

export interface FuseResultItem {
  id: string;
  spriteId: string;
  backgroundDataUrl: string;
  transform: PlacementTransform;
  draftDataUrl: string | null;
  resultDataUrl: string | null;
  status: ItemStatus;
  error: string | null;
}

export interface HairStudioState {
  step: HairStudioStep;
  characters: CharacterRecord[];
  selectedCharacter: CharacterRecord | null;
  selectedCardDataUrl: string | null; // card image loaded for API calls
  cardBuilder: CardBuilderState;
  isGeneratingCard: boolean;
  generatedCardDataUrl: string | null; // preview before save
  sprites: SpriteItem[];
  backgroundDataUrl: string | null;
  imageSize: FuseImageSize;
  results: FuseResultItem[];
  error: string | null;
}

export const DEFAULT_CARD_BUILDER: CardBuilderState = {
  name: "", faceImage: null, hairImage: null, outfitImage: null,
  faceDesc: "", hairDesc: "", outfitDesc: "",
};

export const ANGLE_OPTIONS: { id: SpriteAngle; labelKey: string }[] = [
  { id: "front", labelKey: "angles.front" },
  { id: "side", labelKey: "angles.side" },
  { id: "back", labelKey: "angles.back" },
  { id: "three_quarter", labelKey: "angles.threeQuarter" },
];
```

- [ ] **Step 2: hook（接收 `getToken`，模式同 `use-nail-studio`；核心操作如下，完整落地时保持同名）**

```typescript
"use client";

import { useState, useCallback } from "react";
import * as api from "@/lib/api";
import {
  getUserCharacters, createCharacter, deleteCharacter, renameCharacter,
  uploadCharacterAsset, getFileUrl, type CharacterRecord,
} from "@/lib/supabase";
import {
  HairStudioState, DEFAULT_CARD_BUILDER, SpriteItem, FuseResultItem,
} from "@/types/hair-studio";

const initialState: HairStudioState = {
  step: 1, characters: [], selectedCharacter: null, selectedCardDataUrl: null,
  cardBuilder: DEFAULT_CARD_BUILDER, isGeneratingCard: false, generatedCardDataUrl: null,
  sprites: [], backgroundDataUrl: null, imageSize: "1K", results: [], error: null,
};

let idCounter = 0;
const genId = (p: string) => `${p}-${Date.now()}-${++idCounter}`;
const stripDataUrl = (d: string) => d.split(",")[1];

export function useHairStudio(userId?: string, getToken?: () => Promise<string | null>) {
  const [state, setState] = useState<HairStudioState>(initialState);
  const token = async () => (await getToken?.()) ?? undefined;

  // ---- Step 1: character library & card builder ----
  const loadCharacters = useCallback(async () => {
    if (!userId) return;
    const characters = await getUserCharacters(userId);
    setState((p) => ({ ...p, characters }));
  }, [userId]);

  const generateCard = useCallback(async () => {
    const b = state.cardBuilder;
    setState((p) => ({ ...p, isGeneratingCard: true, error: null }));
    const res = await api.generateCharacterCard({
      face_image_base64: b.faceImage ? stripDataUrl(b.faceImage) : undefined,
      hair_image_base64: b.hairImage ? stripDataUrl(b.hairImage) : undefined,
      outfit_image_base64: b.outfitImage ? stripDataUrl(b.outfitImage) : undefined,
      face_desc: b.faceDesc || undefined,
      hair_desc: b.hairDesc || undefined,
      outfit_desc: b.outfitDesc || undefined,
    }, undefined, await token());
    if (res.success && res.data) {
      setState((p) => ({ ...p, isGeneratingCard: false,
        generatedCardDataUrl: `data:${res.data!.mime_type};base64,${res.data!.image_base64}` }));
    } else {
      setState((p) => ({ ...p, isGeneratingCard: false, error: res.error || "Failed to generate card" }));
    }
  }, [state.cardBuilder, getToken]);

  const saveCharacter = useCallback(async (): Promise<boolean> => {
    if (!userId || !state.generatedCardDataUrl) return false;
    const tempId = crypto.randomUUID();
    const cardPath = await uploadCharacterAsset(userId, tempId, "card", state.generatedCardDataUrl);
    if (!cardPath) { setState((p) => ({ ...p, error: "Failed to upload card" })); return false; }
    const b = state.cardBuilder;
    const row = await createCharacter(userId, {
      name: b.name || `Character ${new Date().toLocaleDateString()}`,
      card_storage_path: cardPath,
      face_desc: b.faceDesc || null, hair_desc: b.hairDesc || null, outfit_desc: b.outfitDesc || null,
      face_ref_path: null, hair_ref_path: null, outfit_ref_path: null, seed: 42,
    });
    if (!row) { setState((p) => ({ ...p, error: "Failed to save character" })); return false; }
    setState((p) => ({
      ...p, characters: [row, ...p.characters], selectedCharacter: row,
      selectedCardDataUrl: p.generatedCardDataUrl, generatedCardDataUrl: null,
      cardBuilder: DEFAULT_CARD_BUILDER, step: 2,
    }));
    return true;
  }, [userId, state.generatedCardDataUrl, state.cardBuilder]);

  const selectCharacter = useCallback(async (c: CharacterRecord) => {
    // Load the stored card image as a data URL for later API calls
    const url = getFileUrl(c.card_storage_path);
    const blob = await (await fetch(url)).blob();
    const dataUrl: string = await new Promise((resolve) => {
      const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.readAsDataURL(blob);
    });
    setState((p) => ({ ...p, selectedCharacter: c, selectedCardDataUrl: dataUrl, step: 2 }));
  }, []);

  // ---- Step 2: sprites ----
  const cardDescOf = (c: CharacterRecord | null) =>
    [c?.face_desc, c?.hair_desc, c?.outfit_desc].filter(Boolean).join("; ") ||
    "the woman from the character model sheet";

  const generateSprites = useCallback(async (
    angles: api.SpriteAngle[], composition: api.SpriteComposition,
    pose: api.SpritePose, action: string,
  ) => {
    const card = state.selectedCardDataUrl;
    if (!card) return;
    const items: SpriteItem[] = angles.map((angle) => ({
      id: genId("sprite"), angle, composition, pose, action,
      imageDataUrl: null, status: "processing", error: null,
    }));
    setState((p) => ({ ...p, sprites: [...p.sprites, ...items] }));
    await Promise.allSettled(items.map(async (item) => {
      const res = await api.generatePoseSprite({
        card_image_base64: stripDataUrl(card), card_desc: cardDescOf(state.selectedCharacter),
        angle: item.angle, composition: item.composition, pose: item.pose,
        action: item.action || undefined,
      }, undefined, await token());
      setState((p) => ({
        ...p,
        sprites: p.sprites.map((s) => s.id !== item.id ? s : (res.success && res.data
          ? { ...s, status: "fulfilled", imageDataUrl: `data:image/png;base64,${res.data.image_base64}` }
          : { ...s, status: "rejected", error: res.error || "Failed" })),
      }));
    }));
  }, [state.selectedCardDataUrl, state.selectedCharacter, getToken]);

  const regenerateSprite = useCallback(async (spriteId: string, newAction?: string) => {
    const s = state.sprites.find((x) => x.id === spriteId);
    const card = state.selectedCardDataUrl;
    if (!s || !card) return;
    setState((p) => ({ ...p, sprites: p.sprites.map((x) => x.id === spriteId
      ? { ...x, status: "processing", error: null, action: newAction ?? x.action } : x) }));
    const res = await api.generatePoseSprite({
      card_image_base64: stripDataUrl(card), card_desc: cardDescOf(state.selectedCharacter),
      angle: s.angle, composition: s.composition, pose: s.pose,
      action: (newAction ?? s.action) || undefined,
    }, undefined, await token());
    setState((p) => ({ ...p, sprites: p.sprites.map((x) => x.id !== spriteId ? x : (res.success && res.data
      ? { ...x, status: "fulfilled", imageDataUrl: `data:image/png;base64,${res.data.image_base64}` }
      : { ...x, status: "rejected", error: res.error || "Failed" })) }));
  }, [state.sprites, state.selectedCardDataUrl, state.selectedCharacter, getToken]);

  // ---- Step 3: fuse ----
  const addFuseResult = useCallback((spriteId: string, backgroundDataUrl: string,
                                     transform: { x: number; y: number; scale: number },
                                     draftDataUrl: string) => {
    const item: FuseResultItem = {
      id: genId("fuse"), spriteId, backgroundDataUrl, transform, draftDataUrl,
      resultDataUrl: null, status: "pending", error: null,
    };
    setState((p) => ({ ...p, results: [...p.results, item] }));
    return item.id;
  }, []);

  const runFuse = useCallback(async (resultId: string) => {
    const item = state.results.find((r) => r.id === resultId);
    if (!item?.draftDataUrl) return;
    setState((p) => ({ ...p, results: p.results.map((r) => r.id === resultId
      ? { ...r, status: "processing", error: null } : r) }));
    const res = await api.fuseScene({
      draft_image_base64: stripDataUrl(item.draftDataUrl),
      draft_mime_type: "image/png", image_size: state.imageSize,
    }, undefined, await token());
    setState((p) => ({ ...p, results: p.results.map((r) => r.id !== resultId ? r : (res.success && res.data
      ? { ...r, status: "fulfilled", resultDataUrl: `data:${res.data.mime_type};base64,${res.data.image_base64}` }
      : { ...r, status: "rejected", error: res.error || "Failed" })) }));
  }, [state.results, state.imageSize, getToken]);

  // ---- misc ----
  const setStep = useCallback((step: 1 | 2 | 3) => setState((p) => ({ ...p, step })), []);
  const setCardBuilder = useCallback((patch: Partial<typeof DEFAULT_CARD_BUILDER>) =>
    setState((p) => ({ ...p, cardBuilder: { ...p.cardBuilder, ...patch } })), []);
  const setBackground = useCallback((dataUrl: string | null) =>
    setState((p) => ({ ...p, backgroundDataUrl: dataUrl })), []);
  const setImageSize = useCallback((s: HairStudioState["imageSize"]) =>
    setState((p) => ({ ...p, imageSize: s })), []);
  const clearError = useCallback(() => setState((p) => ({ ...p, error: null })), []);
  const removeCharacter = useCallback(async (c: CharacterRecord) => {
    if (await deleteCharacter(c.id, c.card_storage_path))
      setState((p) => ({ ...p, characters: p.characters.filter((x) => x.id !== c.id) }));
  }, []);
  const renameCharacterInList = useCallback(async (id: string, name: string) => {
    if (await renameCharacter(id, name))
      setState((p) => ({ ...p, characters: p.characters.map((c) => c.id === id ? { ...c, name } : c) }));
  }, []);

  return {
    state, setStep, loadCharacters, selectCharacter, removeCharacter, renameCharacterInList,
    setCardBuilder, generateCard, saveCharacter,
    generateSprites, regenerateSprite,
    setBackground, setImageSize, addFuseResult, runFuse,
    clearError,
  };
}
```

- [ ] **Step 3: `npx tsc --noEmit`** → exit 0；**Step 4: Commit**（`src/types/hair-studio.ts` + `src/hooks/use-hair-studio.ts`）

### Task 10: 角色库 + 角色卡构建器组件

**Files:**
- Create: `pupaai-frontend/src/components/hair-studio/character-library.tsx`
- Create: `pupaai-frontend/src/components/hair-studio/character-card-builder.tsx`
- Create: `pupaai-frontend/src/components/hair-studio/index.ts`

组件约定：`"use client"`；UI 元素用现有 shadcn（`Card/Button/Input/Textarea/Badge`）+ `lucide-react` 图标 + `useTranslations("hairStudio")`，视觉风格对照 `components/nail-studio/*`。

- [ ] **Step 1: `character-library.tsx`** —— props：`characters, onSelect, onDelete, onRename, onCreateNew`。网格卡片（卡图用 `getFileUrl(card_storage_path)` + `next/image` 或 `<img>`，右上 DropdownMenu：改名/删除），首位是"➕ 新建角色"卡片调 `onCreateNew`。

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import { getFileUrl, type CharacterRecord } from "@/lib/supabase";

export function CharacterLibrary({ characters, onSelect, onDelete, onRename, onCreateNew }: {
  characters: CharacterRecord[];
  onSelect: (c: CharacterRecord) => void;
  onDelete: (c: CharacterRecord) => void;
  onRename: (id: string, name: string) => void;
  onCreateNew: () => void;
}) {
  const t = useTranslations("hairStudio");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="cursor-pointer border-dashed hover:border-primary/60" onClick={onCreateNew}>
        <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
          <Plus className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("newCharacter")}</p>
        </CardContent>
      </Card>
      {characters.map((c) => (
        <Card key={c.id} className="overflow-hidden group">
          <div className="h-36 bg-muted cursor-pointer" onClick={() => onSelect(c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getFileUrl(c.card_storage_path)} alt={c.name} className="w-full h-full object-cover" />
          </div>
          <CardContent className="p-2 flex items-center justify-between gap-1">
            {editing === c.id ? (
              <>
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-7 text-xs" />
                <Button size="icon" variant="ghost" className="h-7 w-7"
                  onClick={() => { onRename(c.id, draft); setEditing(null); }}><Check className="w-3 h-3" /></Button>
              </>
            ) : (
              <>
                <p className="text-xs truncate">{c.name}</p>
                <div className="flex opacity-0 group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => { setEditing(c.id); setDraft(c.name); }}><Pencil className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => onDelete(c)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `character-card-builder.tsx`** —— props：`builder, onChange, onGenerate, isGenerating, generatedCardDataUrl, onSave, onBack`。三个维度（脸/发型/服装）各一行：图片上传位（`<input type="file">` 读成 data URL）+ `Textarea` 描述；底部 名称 `Input` + `生成角色卡` 按钮；右侧预览 `generatedCardDataUrl`，下方 `保存到角色库`。上传读取用：

```tsx
const readFile = (f: File): Promise<string> =>
  new Promise((res) => { const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(f); });
```

（结构同上组件风格；三行输入用 `map` 渲染 `[{key:'face'},{key:'hair'},{key:'outfit'}]`，label 走 `t(`dims.${key}`)`。完整 JSX 由执行者按本文件 props 契约实现，禁止改 props 名。）

- [ ] **Step 3: `index.ts`** 导出两组件；`npx tsc --noEmit` → 0；**Step 4: Commit**

---

## M3 — 立绘生成 UI

### Task 11: `sprite-generator.tsx`

**Files:**
- Create: `pupaai-frontend/src/components/hair-studio/sprite-generator.tsx`（并入 `index.ts` 导出）

- [ ] **Step 1: 组件** —— props：`sprites, onGenerate(angles, composition, pose, action), onRegenerate(id, action?), onNext, onBack`。
  - 角度多选：`ANGLE_OPTIONS` 渲染成可多选 chips（`Badge` + selected 态样式，state 内 `Set<SpriteAngle>`）；
  - 构图/姿势：两组 `Select`（full_body/half_body；standing/sitting）；
  - 动作/表情：`Textarea`（placeholder 例句 "running fingers through her hair, smiling"）；
  - `生成立绘` 按钮 → `onGenerate([...selected], composition, pose, action)`；
  - 立绘网格：透明 PNG 放在棋盘格底（`bg-[conic-gradient(...)]` 或灰白格 CSS）上展示；每张卡：状态 spinner / 失败重试按钮 / `重新生成`（可先改动作文本，弹 `Input` 或行内编辑后调 `onRegenerate`）；
  - 底部 `下一步（去合成）` 需至少 1 张 fulfilled。
- [ ] **Step 2: `npx tsc --noEmit`** → 0；**Step 3: Commit**

---

## M4 — 摆位画布 + 融合 + 结果

### Task 12: `placement-canvas.tsx`（拖放/缩放 + 草稿导出）

**Files:**
- Create: `pupaai-frontend/src/components/hair-studio/placement-canvas.tsx`

- [ ] **Step 1: 组件**（自研 pointer events，无第三方库）—— props：`backgroundDataUrl, spriteDataUrl, onConfirm(draftDataUrl, transform)`。

核心逻辑（完整实现要点，执行者保持函数名）：

```tsx
"use client";
import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface Transform { x: number; y: number; scale: number } // x,y = sprite 左上角相对背景显示区的比例坐标(0-1)

export function PlacementCanvas({ backgroundDataUrl, spriteDataUrl, onConfirm }: {
  backgroundDataUrl: string;
  spriteDataUrl: string;
  onConfirm: (draftDataUrl: string, transform: Transform) => void;
}) {
  const t = useTranslations("hairStudio");
  const containerRef = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState<Transform>({ x: 0.35, y: 0.2, scale: 0.5 });
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origX: tf.x, origY: tf.y };
  }, [tf]);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTf((p) => ({ ...p,
      x: drag.current!.origX + (e.clientX - drag.current!.startX) / rect.width,
      y: drag.current!.origY + (e.clientY - drag.current!.startY) / rect.height }));
  }, []);
  const onPointerUp = useCallback(() => { drag.current = null; }, []);

  // Confirm: draw background at natural size + sprite at same relative transform onto an offscreen canvas
  const confirm = useCallback(async () => {
    const bg = new Image(); bg.src = backgroundDataUrl; await bg.decode();
    const sp = new Image(); sp.src = spriteDataUrl; await sp.decode();
    const canvas = document.createElement("canvas");
    canvas.width = bg.naturalWidth; canvas.height = bg.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bg, 0, 0);
    const spriteW = canvas.width * tf.scale;                 // scale = sprite 宽 / 背景宽
    const spriteH = spriteW * (sp.naturalHeight / sp.naturalWidth);
    ctx.drawImage(sp, tf.x * canvas.width, tf.y * canvas.height, spriteW, spriteH);
    onConfirm(canvas.toDataURL("image/png"), tf);
  }, [backgroundDataUrl, spriteDataUrl, tf, onConfirm]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backgroundDataUrl} alt="background" className="w-full block" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={spriteDataUrl} alt="sprite" draggable={false}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          className="absolute cursor-move touch-none"
          style={{ left: `${tf.x * 100}%`, top: `${tf.y * 100}%`, width: `${tf.scale * 100}%` }} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{t("placement.size")}</span>
        <input type="range" min={0.1} max={1} step={0.01} value={tf.scale}
          onChange={(e) => setTf((p) => ({ ...p, scale: Number(e.target.value) }))} className="flex-1" />
        <Button onClick={confirm}>{t("placement.confirm")}</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `npx tsc --noEmit`** → 0；**Step 3: Commit**

### Task 13: 背景选择/裁剪 + 结果网格 + 融合接线

**Files:**
- Create: `pupaai-frontend/src/components/hair-studio/scene-composer.tsx`（背景上传 + 比例裁剪 + 内嵌 PlacementCanvas + 清晰度选择）
- Create: `pupaai-frontend/src/components/hair-studio/hair-results-gallery.tsx`

- [ ] **Step 1: `scene-composer.tsx`** —— props：`sprites(fulfilled), backgroundDataUrl, imageSize, onSetBackground, onSetImageSize, onCompose(spriteId, draftDataUrl, transform)`。
  - 背景：`<input type="file">` 读 data URL；**比例裁剪**：选择 `1:1/3:4/4:3/9:16/16:9` 后用 canvas 居中裁切背景（`drawImage` 裁源矩形），结果替换 backgroundDataUrl；
  - 立绘选择：横向缩略图列表选中其一；
  - 内嵌 `<PlacementCanvas>`；`onConfirm` → `onCompose(选中立绘id, draft, tf)`；
  - 清晰度：三个 `Badge` 选 `1K/2K/4K` → `onSetImageSize`。

裁剪函数（放本文件）：

```tsx
async function cropToAspect(dataUrl: string, ratioW: number, ratioH: number): Promise<string> {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const target = ratioW / ratioH;
  const cur = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if (cur > target) { sw = img.naturalHeight * target; sx = (img.naturalWidth - sw) / 2; }
  else { sh = img.naturalWidth / target; sy = (img.naturalHeight - sh) / 2; }
  const c = document.createElement("canvas"); c.width = sw; c.height = sh;
  c.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return c.toDataURL("image/png");
}
```

- [ ] **Step 2: `hair-results-gallery.tsx`** —— props：`results, sprites, onRun(id), onRerun(id), onSave(result), onDownload(result)`。网格每格：草稿/成品图、状态、按钮【生成】（pending 时）/【重新生成】/【保存】/【下载】。下载用现有模式（`<a download>`）；保存回调由页面层接 `saveFileFromDataUrl` + 现有 `SelectFolderDialog`（`components/common/select-folder-dialog.tsx` 复用）。
- [ ] **Step 3: `index.ts` 全量导出**；`npx tsc --noEmit` → 0；**Step 4: Commit**

---

## M5 — 页面组装 / 入口 / i18n / Settings

### Task 14: 向导页 + 侧边栏入口

**Files:**
- Create: `pupaai-frontend/src/app/[locale]/(dashboard)/dashboard/hair-studio/page.tsx`
- Modify: `pupaai-frontend/src/components/layout/sidebar.tsx`（creationSuite 段 :67 nailStudio 之后）

- [ ] **Step 1: page.tsx** —— `"use client"`；`useUser()+useAuth()`，`useHairStudio(user?.id, getToken)`；`useEffect` 里 `loadCharacters()`；顶部三步指示条（当前 step 高亮，可点击回退）；按 `state.step` 渲染：
  - 1 → `CharacterLibrary`（onCreateNew 切换出 `CharacterCardBuilder`，二者用局部 state 切换）
  - 2 → `SpriteGenerator`
  - 3 → `SceneComposer` + `HairResultsGallery`（保存按钮接 `SelectFolderDialog` + `saveFileFromDataUrl(user.id, dataUrl, name, folderId)`，模式照抄 `nail-results-gallery` 的保存实现）
  - 错误条：`state.error` 显示 `Alert` + 关闭调 `clearError`。
- [ ] **Step 2: sidebar 加入口**（`Scissors` icon，lucide 导入加到现有 import）：

```tsx
      { 
        nameKey: "sidebar.hairStudio", 
        href: "/dashboard/hair-studio", 
        icon: Scissors,
      },
```

- [ ] **Step 3: `npx tsc --noEmit`** → 0；**Step 4: Commit**

### Task 15: i18n（en/zh）+ Settings 三个 feature

**Files:**
- Modify: `pupaai-frontend/src/i18n/locales/en.json`、`zh.json`
- Modify: `pupaai-frontend/src/app/[locale]/(dashboard)/dashboard/admin/settings/page.tsx`（image features 数组 + FEATURE_LABELS）

- [ ] **Step 1: en.json 增加**（zh.json 同结构中文，`sidebar` 段加 `"hairStudio": "Hair Studio"` / `"发型工作室"`）：

```json
"hairStudio": {
  "title": "Hair Studio",
  "subtitle": "Create salon-ready hairstyle ads with a consistent AI model",
  "steps": { "character": "Character", "sprites": "Poses", "compose": "Compose" },
  "newCharacter": "New Character",
  "dims": { "face": "Face", "hair": "Hairstyle", "outfit": "Outfit" },
  "dimHint": "Upload an image or describe in text (both optional)",
  "characterName": "Character name",
  "generateCard": "Generate Character Card",
  "saveToLibrary": "Save to Library",
  "angles": { "front": "Front", "side": "Side", "back": "Back", "threeQuarter": "45°" },
  "composition": { "full_body": "Full body", "half_body": "Half body" },
  "pose": { "standing": "Standing", "sitting": "Sitting" },
  "actionPlaceholder": "e.g. running fingers through her hair, smiling at camera",
  "generateSprites": "Generate Poses",
  "regenerate": "Regenerate",
  "nextCompose": "Next: Compose Scene",
  "uploadBackground": "Upload background",
  "aspect": "Aspect ratio",
  "resolution": "Resolution",
  "placement": { "size": "Size", "confirm": "Confirm placement" },
  "fuse": "Generate",
  "refuse": "Regenerate",
  "save": "Save",
  "download": "Download",
  "back": "Back"
}
```

- [ ] **Step 2: Settings**：image `features` 数组追加 `"generate_character_card", "generate_pose_sprite", "fuse_scene"`；`FEATURE_LABELS` 追加：

```typescript
  generate_character_card: "Character Card (Hair Studio)",
  generate_pose_sprite: "Pose Sprite (Hair Studio)",
  fuse_scene: "Scene Fusion (Hair Studio)",
```

- [ ] **Step 3: `npx tsc --noEmit` + `npm run build`** → 均通过；**Step 4: Commit**

### Task 16: 端到端验证（手动，浏览器）

- [ ] 后端重启（:8001）+ 前端热更；侧边栏出现 Hair Studio。
- [ ] Step1：新建角色 → 只填发型描述 "short black bob" → 生成卡（照片风、白底、三视图+6表情、无文字）→ 保存 → 角色库出现，改名/删除可用。
- [ ] Step2：选 3 个角度生成 → 3 张透明立绘（棋盘底可见透明）；对其中 1 张改动作文本重生成。
- [ ] Step3：上传理发店背景 → 裁 3:4 → 拖放立绘定位/缩放 → 确认 → 生成：成品光影融合、人物与立绘一致；重生成 1 次；保存到文件夹（files 出现）+ 下载。
- [ ] RLS：`curl "$SUPABASE_URL/rest/v1/characters?select=*" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"` → `[]`。
- [ ] 配额：`SELECT count FROM ai_usage_daily WHERE user_id='<你的uid>'` 随生成递增；Settings → Image 出现 3 个新 feature 下拉且换模型后生效（后端日志可见模型名变化）。

---

## Self-Review 结论

- **Spec 覆盖**：§1 向导（T14）；§2 卡+库+V1排除项（T2/3/7/10，服装按次覆盖未实现=符合排除）；§3 立绘/裁剪/拖放/融合/清晰度/结果网格（T11/12/13）；§4 迁移+storage 路径+前后端结构+seed+Settings+i18n（T1/5/7/8/15）；§5 验证（T6/16）。无缺口。
- **占位符**：Task 10 Step2 与 Task 11/13 的 JSX 细节按"props 契约 + 参照组件"给出（契约与关键代码均已列出，非 TBD）。
- **类型一致性**：`SpriteAngle/Composition/Pose/FuseImageSize` 由 api.ts 单一定义、types 复用；后端 `angle` 枚举与 `ANGLE_TEXT` 键一致（front/side/back/three_quarter）；hook 方法名与 page 使用一致。
