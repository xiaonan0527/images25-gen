# GPT-Image-2.5 Skill

This is a skill for AI coding agents (Claude Code, Codex, etc.) that enables GPT-Image-2.5 image generation via the Nange AI API.

Supports two models:
- **gpt-image-2.5-flare** — Fast generation, ideal for daily creative work and batch generation
- **gpt-image-2.5-sunburst** — Precision editing, ideal for production-grade product images and fine-tuned edits

## Installation

Send this to your AI agent:

```
帮我安装 https://github.com/xiaonan0527/images25-gen/blob/main/README.md 这个 skill，并生成一张图片
```

Or manually clone:

```bash
git clone https://github.com/xiaonan0527/images25-gen.git gpt-image-25
```

## Setup Instructions (for the agent)

After installation, when the user triggers this skill for the first time, you must guide them through setup:

### Step 1: Check Node.js

Run `node -v`. If it fails, tell the user to install Node.js from https://nodejs.org/ before proceeding.

### Step 2: Check API Key

The script supports two ways to provide the API Key:

**Option A: Environment variable (recommended)**
```bash
export NANGE_API_KEY="your-api-key-here"
```

**Option B: Config file** `~/.nange-ai/config.json`

**macOS / Linux:**
```bash
mkdir -p ~/.nange-ai && echo '{"api_key":"PASTE_YOUR_KEY_HERE"}' > ~/.nange-ai/config.json
```

**Windows PowerShell:**
```powershell
mkdir -Force "$env:USERPROFILE\.nange-ai" | Out-Null; '{"api_key":"PASTE_YOUR_KEY_HERE"}' | Set-Content "$env:USERPROFILE\.nange-ai\config.json"
```

API Key creation: https://api.nange-ai.com/keys (choose **GPT-Image** group)

> GPT-Image-2.5 shares the same API Key group as GPT-Image-2. No need to create a separate key.

### Step 3: Generate images

Run the generate script:

```bash
node "<skill-dir>/scripts/generate.js" --prompt "the user's prompt" --size "1:1" --resolution "2k"
```

The script submits an async task, polls until completion, downloads the image to the local path specified by `--out`, and prints the absolute file path to stdout. Progress is printed to stderr.

## Trigger phrases

Activate this skill when the user says anything related to AI image generation, such as:

- "生图" / "画图" / "生成图片" / "帮我画"
- "gpt-image" / "Image2.5 生图" / "用 gpt 画"
- "用 flare 画" / "用 sunburst 编辑"
- "generate an image" / "create a picture"
- "把这张图改成" / "参考这张图"

## Parameters

| Param | Default | Description |
|---|---|---|
| `--prompt` | (required) | Image generation prompt |
| `--model` | `gpt-image-2.5-flare` | Model: `gpt-image-2.5-flare` (fast) or `gpt-image-2.5-sunburst` (precision) |
| `--quality` | `medium` | Quality: `low`, `medium`, `high`, `xhigh`, `max`, `auto` |
| `--size` | `1:1` | Aspect ratio or pixel dimensions. Ratios: `auto`, `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `5:4`, `4:5`, `16:9`, `9:16`, `2:1`, `1:2`, `3:1`, `1:3`, `21:9`, `9:21`. Pixels: e.g. `1600x1200` |
| `--resolution` | `2k` | Output resolution: `1k`, `2k`, `4k` |
| `--background` | (none) | Set to `transparent` for transparent background PNG/WebP |
| `--output-format` | (none) | Output format: `png`, `jpeg`, `webp` |
| `--image-url` | (none) | Reference image for image-to-image. Accepts HTTP URL, base64 data URI, or local file path (auto-converted to base64). Can be passed multiple times (max 16) |
| `--out` | `./output.png` | Local file path to save the generated image |

### Model comparison

| Model | Strengths | Best for |
|---|---|---|
| `gpt-image-2.5-flare` | Fast generation (default) | Social media, quick prototypes, batch generation |
| `gpt-image-2.5-sunburst` | Editing precision | Production product images, ad creatives, fine-tuned edits |

Both models have the same pricing. Choose based on speed vs. quality trade-off.

### Quality tiers

| Quality | Description |
|---|---|
| `low` | Fastest, lowest cost |
| `medium` | Balanced (default, recommended for daily use) |
| `high` | High quality |
| `xhigh` | Extra high quality (GPT-Image-2.5 only) |
| `max` | Maximum quality (GPT-Image-2.5 only) |
| `auto` | Model decides at runtime |

### Resolution & pixel reference

| size | 1k | 2k | 4k |
|------|----|----|-----|
| 1:1 | 1024×1024 | 2048×2048 | 2880×2880 |
| 3:2 | 1536×1024 | 2048×1360 | 3520×2336 |
| 2:3 | 1024×1536 | 1360×2048 | 2336×3520 |
| 4:3 | 1024×768 | 2048×1536 | 3312×2480 |
| 3:4 | 768×1024 | 1536×2048 | 2480×3312 |
| 5:4 | 1280×1024 | 2560×2048 | 3216×2576 |
| 4:5 | 1024×1280 | 2048×2560 | 2576×3216 |
| 16:9 | 1536×864 | 2048×1152 | 3840×2160 |
| 9:16 | 864×1536 | 1152×2048 | 2160×3840 |
| 2:1 | 2048×1024 | 2688×1344 | 3840×1920 |
| 1:2 | 1024×2048 | 1344×2688 | 1920×3840 |
| 3:1 | 1536×512 | 3072×1024 | 3840×1280 |
| 1:3 | 512×1536 | 1024×3072 | 1280×3840 |
| 21:9 | 2016×864 | 2688×1152 | 3840×1648 |
| 9:21 | 864×2016 | 1152×2688 | 1648×3840 |

All 15 aspect ratios support all three resolution tiers (1K/2K/4K). You can also pass pixel dimensions like `1600x1200` (width and height must be multiples of 16).

## How to choose parameters

- User wants fast/batch generation → default Flare model
- User wants precision editing / product images → `--model gpt-image-2.5-sunburst`
- User wants widescreen/landscape → `--size 16:9`
- User wants portrait/phone wallpaper → `--size 9:16`
- User wants poster → `--size 2:3`
- User says "高清" or "4K" → `--resolution 4k`
- User says "快速" or "省钱" → `--resolution 1k`
- User says "超高质量" → `--quality xhigh` or `--quality max`
- No preference → use defaults (`gpt-image-2.5-flare`, `medium`, `1:1`, `2k`)

## Transparent background (透明背景)

Generate PNG images with transparent backgrounds, perfect for stickers, icons, product shots, and design assets:

```bash
node "<skill-dir>/scripts/generate.js" \
  --prompt "a cute cat sticker, isolated object on transparent alpha, no background, no shadow" \
  --background transparent \
  --output-format png \
  --quality high \
  --out "./cat-sticker.png"
```

Tips for best transparent results:
- Always add `--background transparent --output-format png --quality high`
- In the prompt, explicitly describe an **isolated subject** and add: "on transparent alpha, no background, no shadow, no backdrop"
- Avoid describing any scene, room, or environment in the prompt — it conflicts with transparency
- Triggers: "透明背景", "去背景", "抠图", "PNG 素材", "贴纸", "transparent background", "sticker", "icon asset"

## Image-to-image (图生图)

When the user provides a reference image (URL, local file, or pasted image) and asks to edit/transform it, use `--image-url`:

```bash
node "<skill-dir>/scripts/generate.js" \
  --prompt "保留商品主体，将背景替换为柔和的米白色摄影棚" \
  --model gpt-image-2.5-sunburst \
  --quality xhigh \
  --image-url "./product.png" \
  --out "./product-studio.png"
```

- Pass `--image-url` multiple times for multiple reference images (max 16)
- Accepts HTTP/HTTPS URLs, base64 data URIs (`data:image/png;base64,...`), or local file paths (auto-converted to base64)
- For precision editing, use `--model gpt-image-2.5-sunburst` with `--quality xhigh` or `--quality max`
- Triggers: "把这张图改成", "参考这张图", "edit this image", "transform this photo", "change the style of"

## Differences from GPT-Image-2

| Feature | GPT-Image-2 | GPT-Image-2.5 |
|---|---|---|
| Models | `gpt-image-2` | `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst` |
| Quality tiers | `high`, `auto` | `low`, `medium`, `high`, `xhigh`, `max`, `auto` |
| Size input | Aspect ratios only | Aspect ratios + pixel dimensions (e.g. `1600x1200`) |
| Default quality | (none) | `medium` |
| API endpoint | Same `/gpt-image/v1` | Same `/gpt-image/v1` |
| API Key group | GPT-Image | GPT-Image (same) |
