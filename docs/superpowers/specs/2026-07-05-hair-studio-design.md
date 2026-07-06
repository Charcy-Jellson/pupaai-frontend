# Hair Studio（发型广告图）功能设计 Spec

日期：2026-07-05 ｜ 状态：已通过 brainstorming 逐节确认并批准

## Context

理发店需要发型广告图：指定发型（可从人物照提取）+ 指定服装 + 指定背景与姿势，生成照片级模特图；支持同一角色多角度/多背景批量出图且**角色一致**。核心难点（角色一致性、位置控制）通过"角色卡 → 立绘 → 融合"三段管线解决。

## 已确认的关键决策

1. **产出物**：纯照片级图片（无文字排版；海报排版明确不在本期范围）。
2. **角色卡 = 一等资产**：新"角色库"（`characters` 表 + 元数据），跨会话复用。
3. **归属**：独立新页面 **Hair Studio**（侧边栏新入口），不塞进 Model Studio。
4. **摆位交互**：透明立绘拖放到背景 → 拼贴草稿 → AI 融合（光影/透视/边缘）。
5. **管线**：角色卡 → 白底姿势立绘（rembg 抠图）→ 拖放拼贴 → AI 融合；每段独立可重试。
6. **画风**：默认真实摄影风（photorealistic）；参考提示词中 anime 段替换为摄影风描述。

## §1 页面结构：三步向导

Step1 角色（从角色库选/新建卡）→ Step2 立绘（多选角度批量生成白底立绘，各自可重生成）→ Step3 场景合成（背景 + 裁剪定比例 + 拖放摆位 + 清晰度 → 融合，结果网格每格独立生成/重做/保存）。步骤可回退。

```
Step 1 角色          Step 2 立绘           Step 3 场景合成
┌────────────┐     ┌────────────┐      ┌────────────────┐
│ 从角色库选   │ →  │ 选角度/姿势   │  →   │ 上传/选背景图     │
│ 或 新建角色卡 │     │ 生成白底立绘  │      │ 拖放立绘定位置大小 │
└────────────┘     │ (可多张,各自  │      │ 选比例/清晰度     │
                   │  重生成)     │      │ → AI 融合出成品   │
                   └────────────┘      │ (每张可单独重做)   │
                                       └────────────────┘
```

## §2 角色卡

- 输入三维度（脸/发型/服装），每个维度：传图 或 文字 或 留空；脸留空 → 随机 20 岁左右东亚女性；发型图可以是完整人物照（prompt 写明只取发型）；服装留空 → 白 T 牛仔裤。
- 提示词模板：以用户提供的 model-sheet 提示词为骨架（左大特写 + 右正/侧/背三视图 + 下 6 表情、纯白底、无字无框），anime 段替换为 photorealistic 摄影描述，三个占位由输入动态填充；参考图经 `_generate_image(contents=[prompt, img...])` 多图传入（nail-studio 已有先例）；`seed` 固定。
- 产出：卡图 + 元数据（三维度最终描述文本、参考图 storage 路径、seed）入角色库；Step2 生成立绘时**卡图 + 描述一起**喂模型。
- 角色库：列表/改名/删除/选用。
- **V1 明确不做**：服装在立绘/合成阶段的按次覆盖（服装属于卡；换装 = 改卡或建新卡）；男性/非东亚默认模板（可通过文字描述实现，不做专门 UI）。

## §3 立绘与摆位

- **Step2 控件**：角度多选 chips（正/侧/背/斜45°）；构图（全身/半身）；姿势（站/坐）；动作/表情自由文本（如"撩头发、微笑看镜头"）。每个角度一张：卡图 + 卡描述 + "pure white background, [构图/角度/姿势/动作]" → 白底图 → 后端内部调 rembg（复用现有函数，非 HTTP）→ 透明 PNG。网格展示、每张独立重生成（可改动作文本）。
- **Step3**：背景图上传或从 files 选；裁剪定比例（1:1/3:4/4:3/9:16/16:9，成品比例 = 草稿比例）；画布拖动/角柄缩放立绘（自研轻量组件 pointer events + transform，不引大库）；确认后前端 canvas 合成草稿 → 后端 `/fuse`：photorealistic integration，匹配光影/阴影/透视/色调，人物外观/发型/服装保持一致，处理边缘；清晰度 1K/2K/4K → `image_size`。
- **结果网格** = 立绘 × 背景组合，每格独立生成/重生成/保存/下载（复用 results-gallery 模式）。

## §4 数据与后端

- **DB 迁移 0005**：`characters(id, user_id, name, card_storage_path, face_desc, hair_desc, outfit_desc, face_ref_path, hair_ref_path, outfit_ref_path, seed, created_at, updated_at)`；RLS per-user（`auth.jwt()->>'sub' = user_id`，同 folders/files 模式）。
- **Storage**：卡图/参考图 `users/{uid}/characters/{charId}/…`；立绘与成品走现有 files + 文件夹（`saveFileFromDataUrl` 复用）。
- **前端**：`src/app/[locale]/(dashboard)/dashboard/hair-studio/page.tsx` 三步向导；`src/components/hair-studio/*`（character-library, character-card-builder, sprite-generator, placement-canvas, hair-results-gallery）；`src/hooks/use-hair-studio.ts`（接收 getToken，模式同 use-nail-studio）；`src/lib/supabase.ts` 加 characters CRUD（前端直连 + RLS，与 folders/files 一致）；`src/lib/api.ts` 加三个后端调用。
- **后端**：`app/api/hair_studio.py` 三端点 `/generate-card` `/generate-sprite` `/fuse`，全挂 `enforce_ai_quota`；`gemini_service.py` 加三个生成方法（@offloaded）；`ai_router.py` 新 features：`generate_character_card`/`generate_pose_sprite`/`fuse_scene`（image_processing）→ 自动进 admin Settings（三步可分别配模型）；rembg 复用现有抠图函数。
- **DB seed**：ai_default_models 为三个新 feature 设默认 `gemini-3.1-flash-image`；Settings 页 features 列表 + 标签补三项。
- **i18n**：en.json/zh.json 全部新文案。

## §5 错误处理与验证

- 每步独立重试，失败不影响已完成资产；输入沿用 25MB 限制；配额 429 文案明确；抠图失败提示重试。
- 验证：前端 tsc + build；后端 py_compile + import 冒烟；手动 E2E：建卡 → 3 角度立绘 → 2 背景融合 → 保存到文件夹；anon 直查 characters 被拒（RLS）；配额计数随生成递增；Settings 出现三个新 feature 且换模型生效。

## 实施顺序（供 writing-plans 细化）

M1 后端三端点 + gemini 方法 + ai_router features + 迁移 0005 + seed → M2 角色库(CRUD+UI) + 角色卡构建器 → M3 立绘生成 UI → M4 摆位画布 + 融合 + 结果网格 → M5 保存/i18n/Settings 收尾。每阶段独立可验证。
