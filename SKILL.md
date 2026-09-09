---
name: gpt-image-25
description: 使用 Nange AI GPT-Image-2.5 API 生成图片，支持 Flare（快速出图）和 Sunburst（编辑精度优先）两种模型，6 种质量档位，文生图和图生图。当用户说"生图"、"画图"、"生成图片"、"gpt-image"、"Image2.5 生图"、"帮我画"、"用 gpt 画"、"用 2.5 画"、"用 flare 画"、"用 sunburst 编辑"、"把这张图改成"、"参考这张图"等涉及 AI 图片生成或图片编辑的请求时触发此技能。首次使用会引导配置 API Key，后续直接生成。
---

# GPT-Image-2.5 图片生成

通过 Nange AI 的 GPT-Image-2.5 API 生成图片。提供 Flare（快速出图）和 Sunburst（编辑精度优先）两种模型。支持文生图和图生图。异步任务模式：提交 → 轮询 → 返回图片链接。

## 前置检查

每次触发时按顺序检查：

### 1. 检查 Node.js

运行 `node -v`，如果失败则提示用户：

> 此技能需要 Node.js 环境，请先安装：https://nodejs.org/
> 或参考文档中的 Node.js 环境安装指南。

### 2. 检查 API Key 配置

优先读取环境变量 `NANGE_API_KEY`，如果未设置则检查配置文件 `~/.nange-ai/config.json`。

如果都不存在，引导用户选择一种方式配置：

**方式 A：环境变量（推荐）**
```bash
export NANGE_API_KEY="这里粘贴你的Key"
```

**方式 B：配置文件**

**macOS / Linux：**
```bash
mkdir -p ~/.nange-ai && echo '{"api_key":"这里粘贴你的Key"}' > ~/.nange-ai/config.json
```

**Windows (PowerShell)：**
```powershell
mkdir -Force "$env:USERPROFILE\.nange-ai" | Out-Null; '{"api_key":"这里粘贴你的Key"}' | Set-Content "$env:USERPROFILE\.nange-ai\config.json"
```

告知用户 API Key 在这里创建：https://api.nange-ai.com/keys （选择 **GPT-Image** 分组）

> GPT-Image-2.5 与 GPT-Image-2 共用同一分组和 API Key，无需另行创建。

用户配置完成后才继续生成流程。已配置过的用户直接跳到生成步骤。

## 生成流程

读取配置后调用脚本：

**文生图（默认 Flare + medium 质量）：**
```bash
node "$SKILL_DIR/scripts/generate.js" \
  --prompt "用户的提示词" \
  --size "1:1" \
  --resolution "2k" \
  --out "./output.png"
```

**使用 Sunburst 精细编辑：**
```bash
node "$SKILL_DIR/scripts/generate.js" \
  --prompt "保留商品主体，将背景替换为白色摄影棚" \
  --model gpt-image-2.5-sunburst \
  --quality xhigh \
  --image-url "./product.png" \
  --out "./result.png"
```

**高质量 4K 生图：**
```bash
node "$SKILL_DIR/scripts/generate.js" \
  --prompt "星空下的古老城堡" \
  --size "16:9" \
  --resolution "4k" \
  --quality max \
  --out "./castle-4k.png"
```

**透明背景图片（PNG 抠图）：**
```bash
node "$SKILL_DIR/scripts/generate.js" \
  --prompt "一个精致的香水瓶，isolated object on transparent alpha, no background, no shadow" \
  --background transparent \
  --output-format png \
  --quality high \
  --out "./perfume.png"
```

**精确像素尺寸：**
```bash
node "$SKILL_DIR/scripts/generate.js" \
  --prompt "极简风格的产品发布会主视觉" \
  --size "1600x1200" \
  --quality medium \
  --out "./launch-visual.png"
```

可以多次传入 `--image-url` 来提供多张参考图（最多 16 张）。支持 HTTP URL、base64 data URI 和本地文件路径（脚本自动读取并转 base64）。

脚本自动完成：提交任务 → 轮询状态 → 下载图片到本地 → stdout 输出本地文件路径。

### 判断使用哪种模型

- 用户只给了文字描述，没有特别要求 → **Flare**（默认，速度快）
- 用户要求"高精度"/"精细编辑"/"投放级"/"商品图" → **Sunburst**
- 用户说"sunburst"/"精细" → 加 `--model gpt-image-2.5-sunburst`
- 用户说"flare"/"快速" → 使用默认即可

### 判断文生图还是图生图

- 用户提供了参考图片（URL、本地文件路径、粘贴的图片）→ **图生图**，通过 `--image-url` 传入
- 用户只给了文字描述 → **文生图**，不传 `--image-url`
- `--image-url` 接受 HTTP URL、base64 data URI 或本地文件路径，脚本自动识别并处理
- 用户要求"透明背景"/"去背景"/"抠图"/"PNG 素材" → 加 `--background transparent --output-format png --quality high`，并在 prompt 末尾追加 "isolated object on transparent alpha, no background, no shadow, no backdrop"

### 参数选择

根据用户需求选择参数：

- **model（模型）**：默认 `gpt-image-2.5-flare`。用户要精细/商品级 → `gpt-image-2.5-sunburst`
- **quality（质量）**：默认 `medium`。用户说"低质量"/"快速" → `low`；"高质量"/"精细" → `high`；"超高清" → `xhigh`；"最高质量" → `max`
- **size（比例）**：默认 `1:1`。横屏/宽屏 → `16:9`，竖屏/手机壁纸 → `9:16`，海报 → `2:3`。也支持像素尺寸如 `1600x1200`
- **resolution（分辨率）**：默认 `2k`。用户说高清/4K → `4k`，快速/省钱 → `1k`
- **background（背景）**：默认不传（不透明）。用户说"透明背景"/"去背景"/"PNG 透明"/"抠图" → `transparent`
- **output-format（输出格式）**：默认不传（png）。透明背景必须 `png` 或 `webp`

### 所有支持的比例

`auto`、`1:1`、`3:2`、`2:3`、`4:3`、`3:4`、`5:4`、`4:5`、`16:9`、`9:16`、`2:1`、`1:2`、`3:1`、`1:3`、`21:9`、`9:21`

也支持精确像素尺寸（如 `1600x1200`），宽高需为 16 的倍数，长短边比不超过 3:1。

所有 15 种比例均支持 1K / 2K / 4K 三种分辨率。

## 输出

脚本成功后将图片下载到 `--out` 指定的本地路径（默认 `./output.png`），stdout 输出本地文件的绝对路径。将该路径展示给用户即可。
