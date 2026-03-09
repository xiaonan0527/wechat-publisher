<p align="center">
  <h1 align="center">WeChat Publisher</h1>
  <p align="center">
    Markdown to WeChat Official Account article — one command to draft.
  </p>
  <p align="center">
    <a href="./README_CN.md">中文文档</a>
  </p>
</p>

---

## What it does

**WeChat Publisher** converts Markdown into WeChat-compatible HTML (pure inline styles) and pushes it as a draft to the WeChat Official Account platform via the official API. It also auto-generates cover images with Gemini Pro.

```
Markdown ──▶ Sections ──▶ WeChat HTML ──▶ Draft on WeChat MP
                                  ▲
                          Gemini Pro cover
```

## Features

- **One-command publish** — Markdown in, WeChat draft out
- **macOS-style code blocks** — red/yellow/green dots header with horizontal scrolling
- **Built-in cover generation** — Gemini Pro image generation, no external dependencies
- **Auto image upload** — local images uploaded to WeChat CDN automatically
- **Pure inline styles** — all CSS inlined for WeChat compatibility, no `<style>` tags

## Quick Start

### Prerequisites

- Node.js 18+
- WeChat Official Account AppID & AppSecret ([apply here](https://mp.weixin.qq.com/))
- Gemini API Key (optional, for cover generation)

### Install

```bash
git clone https://github.com/xiaonan0527/wechat-publisher.git
cd wechat-publisher
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret
GEMINI_API_KEY=your_gemini_key          # optional, for cover generation
# GEMINI_PRO_PROXY=http://127.0.0.1:7890  # optional, proxy for Gemini API
# WECHAT_DEFAULT_AUTHOR=YourName          # optional, defaults to "龙虾"
```

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

## Project Structure

```
wechat-publisher/
├── scripts/
│   ├── publish.mjs              # Main entry point — orchestrates the full flow
│   ├── markdown-to-sections.mjs # Markdown parser → Section data structure
│   ├── wechat-renderer.mjs      # Section data → WeChat-compatible inline HTML
│   └── gemini-imagegen.mjs      # Built-in Gemini Pro image generation
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
│ Gemini Pro  │     ┌──────────────────────┐     ┌─────────────────┐
│ Cover Image │────▶│  Upload to WeChat    │────▶│   WeChat Draft  │
└─────────────┘     │  CDN + Create Draft  │     │   (Media ID)    │
                    └──────────────────────┘     └─────────────────┘
```

### Pipeline detail

1. **Parse** — `markdown-to-sections.mjs` converts Markdown into a typed Section array (headings, paragraphs, code blocks, lists, etc.)
2. **Render** — `wechat-renderer.mjs` transforms each Section into WeChat-compatible HTML with pure inline styles
3. **Generate cover** — `gemini-imagegen.mjs` calls Gemini Pro API to create a 16:9 cover image
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

const sections = markdownToSections(markdownString);
const html = wxRenderSections(sections);
// html is ready to paste into WeChat editor or send via API
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

## Author

**楠哥** ([@xiaonan0527](https://github.com/xiaonan0527))
