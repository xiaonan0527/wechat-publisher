<p align="center">
  <h1 align="center">WeChat Publisher</h1>
  <p align="center">
    Markdown to WeChat Official Account article — one command to draft.
  </p>
  <p align="center">
    <a href="./README_CN.md">中文文档</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Skills-blue?style=flat-square" alt="OpenClaw Skills" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/License-MIT-brightgreen?style=flat-square" alt="License MIT" />
  <img src="https://img.shields.io/badge/Platform-WeChat%20MP-orange?style=flat-square" alt="WeChat MP" />
</p>

---

## What it does

**WeChat Publisher** converts Markdown into WeChat-compatible HTML (pure inline styles) and pushes it as a draft to the WeChat Official Account platform via the official API. It also auto-generates cover images with ModelScope Qwen-Image-2512 (China, free) or Gemini Pro.

```
Markdown ──▶ Sections ──▶ WeChat HTML ──▶ Draft on WeChat MP
                                  ▲
                          Gemini Pro cover
```

## Features

- **One-command publish** — Markdown in, WeChat draft out
- **macOS-style code blocks** — red/yellow/green dots header with horizontal scrolling
- **Dual image generation** — ModelScope Qwen-Image-2512 (China, free) + Gemini Pro (global), auto-fallback
- **Auto image upload** — local images uploaded to WeChat CDN automatically
- **Magazine theme** — optional "magazine-style" layout with numbered sections, gradient accents, and spacious typography
- **Pure inline styles** — all CSS inlined for WeChat compatibility, no `<style>` tags

## Quick Start

### Prerequisites

- Node.js 18+
- WeChat Official Account AppID & AppSecret ([apply here](https://mp.weixin.qq.com/))
- ModelScope API Token or Gemini API Key (optional, for cover generation)

### Install

```bash
git clone https://github.com/xiaonan0527/wechat-publisher.git
cd wechat-publisher
```

### Configure

```bash
cp .env.example .env
```

#### Get WeChat AppID and AppSecret

1. Log in to [WeChat Developer Platform](https://developers.weixin.qq.com/)
2. Navigate to your Official Account (公众号) → **Development** → **Basic Configuration** (开发 → 基本配置)
3. Find **AppID** (应用ID) — this is your `WECHAT_APPID`
4. Click **Generate** (生成) next to **AppSecret** (应用密钥) to create a new secret
5. Copy the AppSecret immediately (it will only be shown once) — this is your `WECHAT_APPSECRET`

<img width="3788" height="1372" alt="Image" src="https://github.com/user-attachments/assets/271d7449-2e75-4294-b2a4-912979f7ce2d" />

> **Important**: If you're running this tool on a cloud server, you must add your server's public IP address to the **IP Whitelist** (IP白名单) in the same Basic Configuration page. Otherwise, API calls will be rejected by WeChat.

#### Set Up Environment Variables

Edit `.env` with your credentials:

```env
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret

# Cover image generation (choose one or both)
MODELSCOPE_API_KEY=your_token             # recommended, China-accessible, free
# GEMINI_API_KEY=your_gemini_key          # alternative, requires proxy from China
# GEMINI_PRO_PROXY=http://127.0.0.1:7890  # optional, proxy for Gemini API

# WECHAT_DEFAULT_AUTHOR=YourName          # optional, defaults to "龙虾"
```

> **ModelScope Token**: Sign up at [modelscope.cn](https://modelscope.cn), then get your token at [My Access Token](https://modelscope.cn/my/myaccesstoken). It's free.

### Publish

```bash
node scripts/publish.mjs \
  --title "Your Article Title" \
  --content "$(cat your-article.md)" \
  --author "YourName"
```

| Flag | Required | Description |
|------|----------|-------------|
| `--title` | Yes | Article title |
| `--content` | Yes | Article content in Markdown |
| `--author` | No | Author name (default: `龙虾`) |
| `--no-cover` | No | Skip cover image generation |
| `--image-provider` | No | `modelscope` or `gemini` (auto-detected by default) |
| `--theme` | No | `default` or `magazine` (default: `default`) |

## Project Structure

```
wechat-publisher/
├── scripts/
│   ├── publish.mjs              # Main entry point — orchestrates the full flow
│   ├── markdown-to-sections.mjs # Markdown parser → Section data structure
│   ├── wechat-renderer.mjs      # Section data → WeChat-compatible inline HTML
│   ├── modelscope-imagegen.mjs  # ModelScope Qwen-Image-2512 (China, free)
│   └── gemini-imagegen.mjs      # Gemini Pro image generation (global)
├── .env.example                 # Environment variable template
├── SKILL.md                     # OpenClaw skill definition
└── README.md
```

## How It Works

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Markdown   │────▶│ markdown-to-sections │────▶│  Section Array  │
└─────────────┘     └──────────────────────┘     └────────┬────────┘
                                                          │
                    ┌──────────────────────┐              ▼
                    │  wechat-renderer     │◀─────────────┘
                    │  (inline styles,     │
                    │   macOS code blocks) │
                    └──────────┬───────────┘
                               │
┌─────────────┐               ▼
│ Cover Image │     ┌──────────────────────┐     ┌─────────────────┐
│ ModelScope  │────▶│  Upload to WeChat    │────▶│   WeChat Draft  │
│ or Gemini   │     │  CDN + Create Draft  │     │   (Media ID)    │
                    └──────────────────────┘     └─────────────────┘
```

### Pipeline detail

1. **Parse** — `markdown-to-sections.mjs` converts Markdown into a typed Section array (headings, paragraphs, code blocks, lists, etc.)
2. **Render** — `wechat-renderer.mjs` transforms each Section into WeChat-compatible HTML with pure inline styles
3. **Generate cover** — `modelscope-imagegen.mjs` (Qwen-Image-2512, recommended) or `gemini-imagegen.mjs` (Gemini Pro) creates a 16:9 cover image, with auto-fallback
4. **Upload & publish** — `publish.mjs` uploads images to WeChat CDN and creates a draft via WeChat MP API

### Code block rendering

Code blocks use a macOS-style header (three colored dots) with horizontal scrolling:

- `line-height:0; font-size:0` on the header eliminates inline-block gaps (WeChat does not reliably support `display:flex`)
- Each line uses `<p style="white-space:nowrap">` to prevent wrapping
- Spaces are converted to `&nbsp;` for WeChat compatibility
- Font names with spaces use **single quotes** inside `style="..."` to avoid attribute truncation

## Programmatic Usage

```javascript
import { markdownToSections } from './scripts/markdown-to-sections.mjs';
import { wxRenderSections } from './scripts/wechat-renderer.mjs';

// Default theme
const sections = markdownToSections(markdownString);
const html = wxRenderSections(sections);

// Magazine theme — numbered sections, gradient accents, spacious layout
const magSections = markdownToSections(markdownString, { theme: 'magazine' });
const magHtml = wxRenderSections(magSections, { theme: 'magazine' });
```

## Security

- All secrets read from environment variables
- `.env` is in `.gitignore`
- `.env.example` provided as a safe template
- No hardcoded keys anywhere in the codebase

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

[MIT](./LICENSE)

## Buy Me a Coffee

If you find this project helpful, consider supporting me:

[![Buy Me A Coffee](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/xiaonan0527)

## Author

**楠哥** ([@xiaonan0527](https://github.com/xiaonan0527))

![Image](https://github.com/user-attachments/assets/2c8a4893-3e11-478c-a063-a9de03e596dc)