#!/usr/bin/env node
/**
 * GPT-Image-2.5 图片生成脚本
 * 支持 gpt-image-2.5-flare (快速出图) 和 gpt-image-2.5-sunburst (编辑精度优先)
 * 提交生成任务 → 轮询任务状态 → 下载图片到本地
 */

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.nange-ai', 'config.json');
const BASE_URL = 'https://api.nange-ai.com/gpt-image/v1';

const VALID_MODELS = ['gpt-image-2.5-flare', 'gpt-image-2.5-sunburst'];
const VALID_QUALITIES = ['low', 'medium', 'high', 'xhigh', 'max', 'auto'];
const VALID_RESOLUTIONS = ['1k', '2k', '4k'];
const VALID_OUTPUT_FORMATS = ['png', 'jpeg', 'webp'];
const VALID_BACKGROUNDS = ['transparent', 'opaque', 'auto'];

/**
 * 读取 API Key（优先级：环境变量 > 配置文件）
 */
function loadApiKey() {
  const envKey = process.env.NANGE_API_KEY || process.env.GPT_IMAGE_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.api_key && config.api_key !== 'YOUR_KEY' && config.api_key.trim()) {
        return config.api_key.trim();
      }
    } catch (_) { /* ignore parse errors */ }
  }

  console.error('错误：未找到 API Key');
  console.error('');
  console.error('请选择以下任一方式配置：');
  console.error('');
  console.error('  方式 A（环境变量）：');
  console.error('    export NANGE_API_KEY="your-api-key"');
  console.error('');
  console.error('  方式 B（配置文件）：');
  if (process.platform === 'win32') {
    console.error(`    mkdir "%USERPROFILE%\\.nange-ai" && echo {"api_key":"YOUR_KEY"} > "%USERPROFILE%\\.nange-ai\\config.json"`);
  } else {
    console.error(`    mkdir -p ~/.nange-ai && echo '{"api_key":"YOUR_KEY"}' > ~/.nange-ai/config.json`);
  }
  console.error('');
  console.error('API Key 创建地址：https://api.nange-ai.com/keys（选择 GPT-Image 分组）');
  process.exit(1);
}

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const MIME_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
};

function resolveImageArg(arg) {
  if (arg.startsWith('http://') || arg.startsWith('https://') || arg.startsWith('data:')) {
    return arg;
  }
  const absPath = path.resolve(arg);
  if (!fs.existsSync(absPath)) {
    console.error(`错误：图片文件不存在 → ${absPath}`);
    process.exit(1);
  }
  const ext = path.extname(absPath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const b64 = fs.readFileSync(absPath).toString('base64');
  process.stderr.write(`已读取本地图片: ${absPath} (${mime})\n`);
  return `data:${mime};base64,${b64}`;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode >= 400) {
        reject(new Error(`下载失败 HTTP ${res.statusCode}`));
        return;
      }
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(); });
      ws.on('error', reject);
    }).on('error', reject);
  });
}

async function submitTask(apiKey, prompt, model, size, resolution, imageUrls, background, quality, outputFormat) {
  const body = {
    model,
    prompt,
    n: 1,
    size,
    resolution,
  };

  if (background) {
    body.background = background;
  }
  if (quality) {
    body.quality = quality;
  }
  if (outputFormat) {
    body.output_format = outputFormat;
  }
  if (imageUrls && imageUrls.length > 0) {
    body.image_urls = imageUrls;
  }

  const payload = JSON.stringify(body);

  const result = await request(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  }, payload);

  return result.data[0].task_id;
}

async function pollTask(apiKey, taskId) {
  const timeout = 5 * 60 * 1000;
  const interval = 5000;
  const start = Date.now();

  while (true) {
    if (Date.now() - start > timeout) {
      throw new Error('任务超时（超过 5 分钟）');
    }

    const result = await request(`${BASE_URL}/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    const { status, progress, result: taskResult, error } = result.data;

    if (status === 'completed') {
      return taskResult.images[0].url[0];
    }
    if (status === 'failed') {
      throw new Error(error?.message || '任务失败');
    }

    process.stderr.write(`生成中... ${progress || 0}%\n`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    model: 'gpt-image-2.5-flare',
    quality: 'medium',
    size: '1:1',
    resolution: '2k',
    imageUrls: [],
    out: './output.png',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prompt': parsed.prompt = args[++i]; break;
      case '--model': parsed.model = args[++i]; break;
      case '--quality': parsed.quality = args[++i]; break;
      case '--size': parsed.size = args[++i]; break;
      case '--resolution': parsed.resolution = args[++i]; break;
      case '--image-url': parsed.imageUrls.push(args[++i]); break;
      case '--out': parsed.out = args[++i]; break;
      case '--background': parsed.background = args[++i]; break;
      case '--output-format': parsed.outputFormat = args[++i]; break;
    }
  }

  if (!parsed.prompt) {
    console.error('用法: node generate.js --prompt "提示词" [选项]');
    console.error('');
    console.error('选项:');
    console.error('  --model <model>          模型 (默认: gpt-image-2.5-flare)');
    console.error('                           可选: gpt-image-2.5-flare, gpt-image-2.5-sunburst');
    console.error('  --quality <quality>      质量 (默认: medium)');
    console.error('                           可选: low, medium, high, xhigh, max, auto');
    console.error('  --size <size>            比例或像素尺寸 (默认: 1:1)');
    console.error('                           比例: auto, 1:1, 3:2, 2:3, 4:3, 3:4, 5:4, 4:5,');
    console.error('                                 16:9, 9:16, 2:1, 1:2, 3:1, 1:3, 21:9, 9:21');
    console.error('                           像素: 如 1600x1200 (宽高需为 16 的倍数)');
    console.error('  --resolution <res>       分辨率 (默认: 2k)  可选: 1k, 2k, 4k');
    console.error('  --background <mode>      背景 (可选: transparent, opaque, auto)');
    console.error('  --output-format <fmt>    输出格式 (可选: png, jpeg, webp)');
    console.error('  --image-url <path|url>   参考图 (可多次指定, 最多 16 张)');
    console.error('  --out <path>             输出路径 (默认: ./output.png)');
    process.exit(1);
  }

  if (!VALID_MODELS.includes(parsed.model)) {
    console.error(`错误：不支持的模型 "${parsed.model}"，可选: ${VALID_MODELS.join(', ')}`);
    process.exit(1);
  }
  if (parsed.quality && !VALID_QUALITIES.includes(parsed.quality)) {
    console.error(`错误：不支持的质量档位 "${parsed.quality}"，可选: ${VALID_QUALITIES.join(', ')}`);
    process.exit(1);
  }
  if (!VALID_RESOLUTIONS.includes(parsed.resolution)) {
    console.error(`错误：不支持的分辨率 "${parsed.resolution}"，可选: ${VALID_RESOLUTIONS.join(', ')}`);
    process.exit(1);
  }
  if (parsed.outputFormat && !VALID_OUTPUT_FORMATS.includes(parsed.outputFormat)) {
    console.error(`错误：不支持的输出格式 "${parsed.outputFormat}"，可选: ${VALID_OUTPUT_FORMATS.join(', ')}`);
    process.exit(1);
  }
  if (parsed.background && !VALID_BACKGROUNDS.includes(parsed.background)) {
    console.error(`错误：不支持的背景模式 "${parsed.background}"，可选: ${VALID_BACKGROUNDS.join(', ')}`);
    process.exit(1);
  }

  return parsed;
}

async function main() {
  const { prompt, model, quality, size, resolution, imageUrls, out, background, outputFormat } = parseArgs();
  const apiKey = loadApiKey();

  const resolvedUrls = imageUrls.map(resolveImageArg);

  const mode = resolvedUrls.length > 0 ? '图生图' : '文生图';
  process.stderr.write(`正在提交${mode}任务: model=${model}, quality=${quality}, size=${size}, resolution=${resolution}\n`);
  if (background) {
    process.stderr.write(`背景模式: ${background}\n`);
  }
  if (outputFormat) {
    process.stderr.write(`输出格式: ${outputFormat}\n`);
  }
  if (resolvedUrls.length > 0) {
    process.stderr.write(`参考图片: ${resolvedUrls.length} 张\n`);
  }

  const taskId = await submitTask(apiKey, prompt, model, size, resolution, resolvedUrls, background, quality, outputFormat);
  process.stderr.write(`任务已提交: ${taskId}\n`);

  const imageUrl = await pollTask(apiKey, taskId);

  const outPath = path.resolve(out);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  process.stderr.write(`正在下载图片到 ${outPath} ...\n`);
  await downloadFile(imageUrl, outPath);
  process.stderr.write(`下载完成\n`);
  console.log(outPath);
}

main().catch((err) => {
  console.error(`错误：${err.message}`);
  process.exit(1);
});
