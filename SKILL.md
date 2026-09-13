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

---

## 🎯 提示词撰写核心原则（基于 OpenAI 官方指南）

**在为用户编写提示词之前，你必须严格遵循以下 8 条官方原则。这是生成高质量图片的关键。**

### 原则 1：定义结果

先明确需要什么图——命名主题和用途（产品照片、广告、图解、海报等），再指定构图、比例和关键位置约束。对于复杂请求，按 **场景 → 主体 → 细节 → 约束** 分段组织提示词。

### 原则 2：选择可维护的格式

短句、描述段落、JSON 结构、指令列表、标签格式都可以。**选择最容易阅读和修改的格式，不要依赖特殊语法。**

### 原则 3：描述可见细节

明确命名材质、光线、颜色和视觉媒介。要照片级真实感时必须明确说 "photorealistic" 或 "real photograph"，并描述取景和纹理。相机参数视为外观线索而非物理精确模拟。宽阔/电影感/低光/雨天/霓虹场景时，要明确描述尺度、氛围和色彩，不要只用情绪词。

### 原则 4：指定人物和动作

描述身体取景、相对比例、视线方向、与物体的交互。使用如 "全身可见，包括脚"、"低头看着打开的书"、"双手自然握住车把" 等具体指令，让姿势和动作更清晰。

### 原则 5：精确指定文字

- 把需要的文案用**引号**括起来
- 描述文字的位置和排版
- 异常拼写或品牌名称需逐字母拼写
- 要求"不要额外文字"
- 检查输出中的拼写和清晰度
- 小字、密集信息或多字体时，比较 medium 或 high 质量

### 原则 6：分离变更与约束（编辑关键）

编辑时说 "只改变 X"，并列出需要保留的细节（身份、几何形状、布局、光线、标签）。明确排除不需要的元素（多余文字、logo、水印）。精确局部编辑时，还需指明饱和度、对比度、箭头、相机角度和周围物体必须保持不变。

### 原则 7：为参考图分配角色

为每张输入图编号并说明用途：主体、风格、服装、背景。解释各输入如何组合，哪些元素应该移到哪里。

### 原则 8：渐进式迭代

将上一次输出作为下一次编辑的输入，每次只请求一个变更，重复需要保留的细节。"same style as before" 等引用可以传递上下文，但如果结果偏移，必须重新陈述关键约束。

---

## 🖼️ 提示词模板库（按场景分类）

在帮用户写 prompt 时，**必须参考以下官方模板和技巧**，根据用户需求选用对应场景的写法。

### 场景 A：控制风格和光线（照片级真实感）

通过主体、取景、光线和纹理描述照片。明确排除过度修饰。

**模板结构：**
```
Create a photorealistic [场景类型] of [主体描述].
[主体的外观细节：皮肤纹理、纹身、衣物磨损等].
[动作和环境互动描述]. Shot like a [胶片类型] photograph, [取景方式] at [角度], using a [镜头焦距].
[光线描述], [景深], [颗粒感], [色彩平衡].
The image should feel [氛围形容词]. No [排除项].
```

**示例：**
```
Create a photorealistic candid photograph of an elderly sailor standing on a small fishing boat.
He has weathered skin with visible wrinkles, pores, and sun texture, and a few faded traditional sailor tattoos on his arms.
He is calmly adjusting a net while his dog sits nearby on the deck. Shot like a 35mm film photograph, medium close-up at eye level, using a 50mm lens.
Soft coastal daylight, shallow depth of field, subtle film grain, natural color balance.
The image should feel honest and unposed, with real skin texture, worn materials, and everyday detail. No glamorization, no heavy retouching.
```

### 场景 B：可视化解释流程（信息图/图解）

命名流程、受众和需要传达的信息。图解和信息图需验证标签和事实关系。

**模板结构：**
```
Create a detailed [图表类型] of [主题/流程].
[流程步骤描述].
I'd like to understand [目标] technically and visually.
```

**示例：**
```
Create a detailed Infographic of the functioning and flow of an automatic coffee machine like a Jura.
From bean basket, to grinding, to scale, water tank, boiler, etc.
I'd like to understand technically and visually the flow.
```

### 场景 C：精确渲染文字

引用需要的文案，告知模型文字应出现多少次。指定受众和视觉处理。

**模板结构：**
```
Give me a [风格类型] for a brand called [品牌名].
[品牌定位和受众]. The ad shows [场景描述] with the tagline "[精确文案]".
[视觉要求：构图、色彩、拍摄风格].
Render the tagline exactly once, clearly and legibly, integrated into the [布局类型].
No extra text, no watermarks, no unrelated logos.
```

**示例：**
```
Give me a cool in culture ad / fashion shot for a brand called Thread.
It's a hip young street brand. The ad shows a group of friends hanging out together with the tagline "Yours to Create."
Make it feel like a polished campaign image for a youth streetwear audience: stylish, contemporary, energetic, and tasteful.
Use clean composition, strong color direction, natural poses, and premium fashion photography cues.
Render the tagline exactly once, clearly and legibly, integrated into the ad layout.
No extra text, no watermarks, no unrelated logos.
```

### 场景 D：设计可复用 Logo

描述品牌和定义标识的形状。指定在不同尺寸下保持清晰度的构图。

**模板结构：**
```
Create an original, non-infringing logo for a company called [公司名], a [公司描述].
The logo should feel [品牌调性形容词]. Use clean, vector-like shapes, a strong silhouette, and balanced negative space.
Favor simplicity over detail so it reads clearly at small and large sizes. Flat design, minimal strokes, no gradients unless essential.
Fully transparent background. Deliver a single centered logo with generous padding, clean alpha edges, and no solid backdrop, scenery, checkerboard, or watermark.
```

> **Logo 场景必须使用**: `--background transparent --output-format png`，并配合 `n=4`（如脚本支持）生成多个变体供选择。

### 场景 E：利用历史与现实世界知识

命名地点和日期以建立历史背景。模型可以推断上下文细节，但需检查服饰、布景和环境的历史准确性。

**示例：**
```
Create a realistic outdoor crowd scene in Bethel, New York on August 16, 1969.
Photorealistic, period-accurate clothing, staging, and environment.
```

### 场景 F：故事转漫画条

将叙事定义为一系列清晰的视觉节拍，每个面板一个。描述要具体、以动作为核心。

**模板结构：**
```
Create a short vertical comic-style reel with [N] panels.
Panel 1: [具体的场景、角色位置、表情、环境细节]
Panel 2: [动作和转变]
Panel 3: [高潮或变化]
Panel 4: [结尾或反转]
```

### 场景 G：界面预览/App 原型

将产品描述成已经存在的样子。聚焦布局、层级、间距和真实界面元素。避免概念艺术用语，让结果看起来像可用的、已上线的界面。

**模板结构：**
```
Create a realistic mobile app UI mockup for [产品/场景].
Show [核心功能描述：header、列表、分区等].
Design it to be practical, and easy to use. [颜色方案], [排版风格], and minimal decoration.
It should look like a real, well-designed, beautiful app for [目标用户].
Place the UI mockup in an [设备框架].
```

### 场景 H：科学/教育可视化

像教学设计说明书一样写 prompt：定义受众、教学目标、视觉格式、必需标签和科学约束。要求干净、扁平的视觉系统。

**模板结构：**
```
Create a [图表类型] titled "[标题]" for [目标受众].

Show [流程/概念描述]. Include [具体步骤/组件].
Use [视觉元素：arrows/labels/icons] to connect the steps, and label the main [术语列表].
Make it look like a clean [用途：classroom handout/slide], with [视觉风格].

Avoid [排除项：tiny text, extra decoration, etc.].
```

> **科学/教育场景建议使用** `--quality high`，因为包含密集标签和图解。

### 场景 I：演示文稿、图表和数据可视化

像 artifact spec 一样写 prompt 而非插画请求。命名精确交付物（幻灯片、流程图、图表），定义画布和层级，提供真实文本或数据，描述视觉语言。

**模板结构：**
```
Create one [交付物类型：pitch-deck slide/workflow diagram/chart] titled "[标题]" that feels like a real [风格参考].

Use [背景色], [字体风格], and a [布局风格]. The slide should include:

* [元素1：图表类型和数据]
* [元素2：具体数据点]
* [元素3：注脚/来源]

The design should look like [质量标准]. [排除项].
```

> **图表/幻灯片场景建议使用** `--size 16:9 --quality high`。

---

## ✏️ 图片编辑技巧（图生图模式）

当用户提供参考图片要求编辑时，**必须遵循以下官方编辑技巧**。

### 编辑技巧 1：翻译并保留布局

```
Translate the text in the [图片描述] to [目标语言]. Do not change any other aspect of the image.
```

### 编辑技巧 2：迁移视觉风格

为参考图分配特定角色（调色板、纹理、视觉媒介），将新主体单独描述。

```
Use the same style from the input image and generate [新主体描述] on a [背景].
```

### 编辑技巧 3：保留身份 + 更换服装

明确说明人物哪些方面必须固定，只允许服装改变。

**模板：**
```
Edit the image to dress the [人物] using the provided clothing images. Do not change [their] face, facial features, skin tone, body shape, pose, or identity in any way. Preserve [their] exact likeness, expression, hairstyle, and proportions. Replace only the clothing, fitting the garments naturally to [their] existing pose and body geometry with realistic fabric behavior. Match lighting, shadows, and color temperature to the original photo so the outfit integrates photorealistically, without looking pasted on. Do not change the background, camera angle, framing, or image quality, and do not add accessories, text, logos, or watermarks.
```

### 编辑技巧 4：组合多张参考图

传入场景照片和元素照片，指定哪个元素要移到哪里，什么必须保持不变。

```
Place the [元素] from the second image into the setting of image 1, right next to the [位置参考], use the same style of lighting, composition and background. Do not change anything else.
```

### 编辑技巧 5：透明背景产品抠图

在 prompt 中要求隔离主体 + API 参数中设 `background="transparent"`。

**模板：**
```
Extract the product from the input image and isolate it on a fully transparent background.
Output: centered product, crisp silhouette, no halos/fringing.
Preserve product geometry and label legibility exactly.
Add only light polishing. Do not add a solid backdrop, checkerboard, scenery, or shadow.
Do not restyle the product; remove the background and preserve clean alpha transparency.
```

> **必须配合** `--background transparent --output-format png --quality high`

### 编辑技巧 6：草图转真实图片

保留布局和透视，添加真实材质、光线和环境。

```
Turn this drawing into a photorealistic image.
Preserve the exact layout, proportions, and perspective.
Choose realistic materials and lighting consistent with the sketch intent.
Do not add new elements or text.
```

### 编辑技巧 7：移除物体

明确命名要移除的物体，保留周围一切。

```
Remove the [物体] from [位置描述]. Do not change anything else.
```

### 编辑技巧 8：将人物插入场景

在保留身份的同时插入新场景。指定自然光线、可信细节、身体取景、视线和场景交互。

**模板：**
```
Generate a highly realistic [场景类型] where this person is [动作描述].
[人物位置和朝向描述], wearing [服装], with [细节（污渍、撕裂等）].
The [环境] is in [地点], with believable natural details. The time of day is [时间], with natural lighting and realistic colors. Everything should feel grounded, authentic, and unstyled, as if captured in a real moment. Avoid cinematic lighting, dramatic color grading, or stylized composition.
```

### 编辑技巧 9：更换房间家具

只替换一个物体，保留相机角度、光线、阴影和周围环境。

```
In this room photo, replace ONLY the [原家具] with [新家具描述].
Preserve camera angle, room lighting, floor shadows, and surrounding objects.
Keep all other aspects of the image unchanged.
Photorealistic contact shadows and fabric texture.
```

---

## 🔄 多轮迭代优化

### 工作流程

1. **生成初始图片** — 完整描述场景、主体、文字
2. **逐步微调** — 每次只改一个条件，将上一次输出作为下一次编辑输入
3. **保持角色一致** — 在多张图中使用相同角色时，重复角色的外观描述

### 保持角色一致的方法

**第一步：建立角色**
```
Create a [风格类型] illustration introducing a main character.

Character:
[角色外观描述：服装、配饰、表情、比例]

Theme:
[角色所在的主题/世界]

Style:
[艺术风格：hand-painted watercolor / flat vector / etc.]

Constraints:
- Original character (no copyrighted characters)
- No text
- No watermarks
- [背景约束]
```

**第二步：延续故事（将角色图作为参考图传入）**
```
Continue the [风格] story using the same character.

Scene:
[新场景描述]

Character Consistency:
- Same [服装描述]
- Same facial features, proportions, and color palette
- Same [性格特征]

Style:
[保持一致的艺术风格]

Constraints:
- Do not redesign the character
- No text
- No watermarks
```

---

## ✅ 结果检查清单

生成图片后，**必须按以下清单检查输出**，然后再展示给用户：

1. ✅ **文字准确性** — 要求的文字拼写正确且清晰可读？图表标签和关系正确？
2. ✅ **身份/细节保持** — 人物身份、产品形状、标签和参考细节是否完整保留？
3. ✅ **编辑范围** — 编辑是否只改变了请求的部分？
4. ✅ **透明背景** — 如果需要透明，文件是否包含 alpha 通道而非涂白的背景？

---

## 📝 Prompt 优化规则（你必须执行）

当用户给出简单需求时，你必须根据上述原则**主动优化和扩展提示词**：

### 必须做的事

1. **补充视觉细节** — 用户说"画只猫"，你要补充品种、毛色、姿势、光线、背景、艺术风格
2. **结构化组织** — 按场景 → 主体 → 细节 → 约束的顺序组织长 prompt
3. **明确排除项** — 始终添加 "No watermarks, no extra text, no logos"（除非用户明确要 logo）
4. **选择正确的参数** — 根据场景自动选择最佳的 model、quality、size、resolution
5. **编辑时分离变更和约束** — 明确写出哪些要改、哪些要保持不变
6. **人物描述要具体** — 补充身体取景、视线、手的动作

### 禁止做的事

1. ❌ 不要直接使用用户的原始简短描述作为 prompt
2. ❌ 不要遗漏排除项（水印、额外文字等）
3. ❌ 不要在透明背景请求中描述场景/环境
4. ❌ 不要只用情绪词（"cinematic", "beautiful"）代替具体的光线/色彩描述
5. ❌ 不要在编辑场景中遗漏保留约束

### 提示词长度指南

- **简单物体/图标** → 2-3 句足够
- **人物/场景** → 4-6 句，覆盖主体+光线+构图+排除
- **复杂编辑/产品图** → 6-10 句，分段覆盖变更+保留+约束
- **信息图/图表/幻灯片** → 10+ 句，包含所有数据和标签

---

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

| 用户意图 | 选择模型 | 理由 |
|---|---|---|
| 只给了文字描述，没有特别要求 | **Flare**（默认） | 速度快，质量已接近 GPT-Image-2 |
| 要求"高精度"/"精细编辑"/"投放级"/"商品图" | **Sunburst** | 编辑精度更高 |
| 已有验证过的工作流，想提速 | **先试 Flare** | 如果质量可接受，能降低延迟 |
| 复杂用例，之前质量不达标 | **先试 Sunburst** | 先确认能达到质量要求 |
| 用户说 "sunburst"/"精细" | `--model gpt-image-2.5-sunburst` | 明确要求 |
| 用户说 "flare"/"快速" | 使用默认 | 明确要求 |

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

### 场景 → 参数自动推荐表

| 场景 | size | quality | resolution | 其他参数 |
|---|---|---|---|---|
| 照片级人像/风景 | 按需（2:3 竖/3:2 横） | medium 起 | 2k | — |
| Logo/图标 | 1:1 | medium | 2k | `--background transparent --output-format png` |
| 产品抠图 | 按原图比例 | high | 2k | `--background transparent --output-format png` |
| 信息图/图解 | 2:3 或 3:4 | high | 2k | — |
| 演示文稿/幻灯片 | 16:9 | high | 2k+ | — |
| 漫画条 | 2:3 或 9:16 | medium | 2k | — |
| App 界面原型 | 9:16 | medium | 2k | — |
| 科学教育图 | 3:2 或 16:9 | high | 2k | — |
| 节日贺卡 | 2:3 | medium | 2k | — |
| 商品周边 | 2:3 | medium | 2k | — |
| 4K 壁纸 | 16:9 | max | 4k | — |

### 所有支持的比例

`auto`、`1:1`、`3:2`、`2:3`、`4:3`、`3:4`、`5:4`、`4:5`、`16:9`、`9:16`、`2:1`、`1:2`、`3:1`、`1:3`、`21:9`、`9:21`

也支持精确像素尺寸（如 `1600x1200`），宽高需为 16 的倍数，长短边比不超过 3:1。

所有 15 种比例均支持 1K / 2K / 4K 三种分辨率。

## 输出

脚本成功后将图片下载到 `--out` 指定的本地路径（默认 `./output.png`），stdout 输出本地文件的绝对路径。将该路径展示给用户即可。
