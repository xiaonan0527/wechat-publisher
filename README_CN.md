<p align="center">
  <h1 align="center">WeChat Publisher</h1>
  <p align="center">
    Markdown 一键转微信公众号文章，直达草稿箱。
  </p>
  <p align="center">
    <a href="./README.md">English</a>
  </p>
</p>

---

## 简介

**WeChat Publisher** 将 Markdown 转换为微信公众号兼容的 HTML（纯内联样式），并通过微信官方 API 直接推送到草稿箱。内置 Gemini Pro 封面图生成，无需依赖外部工具。

```
Markdown ──▶ Sections ──▶ 微信 HTML ──▶ 公众号草稿箱
                                 ▲
                         Gemini Pro 封面
```

## 特性

- **一键发布** — Markdown 输入，草稿箱输出
- **macOS 风格代码块** — 红黄绿三圆点 + 横向滚动
- **内置封面生成** — Gemini Pro 生图，不依赖外部 skill
- **自动图片上传** — 本地图片自动上传到微信 CDN
- **纯内联样式** — 所有 CSS 内联，兼容微信渲染引擎

## 快速开始

### 环境要求

- Node.js 18+
- 微信公众号 AppID 和 AppSecret（[申请地址](https://mp.weixin.qq.com/)）
- Gemini API Key（可选，用于生成封面图）

### 安装

```bash
git clone https://github.com/xiaonan0527/wechat-publisher.git
cd wechat-publisher
```

### 配置

```bash
cp .env.example .env
```

编辑 `.env`，填入你的凭证：

```env
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret
GEMINI_API_KEY=your_gemini_key          # 可选，用于封面生成
# GEMINI_PRO_PROXY=http://127.0.0.1:7890  # 可选，Gemini API 代理
# WECHAT_DEFAULT_AUTHOR=你的名字          # 可选，默认"龙虾"
```

### 发布文章

```bash
node scripts/publish.mjs \
  --title "文章标题" \
  --content "$(cat article.md)" \
  --author "龙虾"
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--title` | 是 | 文章标题 |
| `--content` | 是 | 文章内容（Markdown 格式） |
| `--author` | 否 | 作者名（默认：`龙虾`） |
| `--no-cover` | 否 | 跳过封面图生成 |

## 项目结构

```
wechat-publisher/
├── scripts/
│   ├── publish.mjs              # 主入口 — 编排完整发布流程
│   ├── markdown-to-sections.mjs # Markdown 解析器 → Section 数据结构
│   ├── wechat-renderer.mjs      # Section 数据 → 微信兼容内联 HTML
│   └── gemini-imagegen.mjs      # 内置 Gemini Pro 生图模块
├── .env.example                 # 环境变量模板
├── SKILL.md                     # OpenClaw skill 定义
└── README.md
```

## 工作原理

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Markdown   │────▶│ markdown-to-sections │────▶│   Section 数组   │
└─────────────┘     └──────────────────────┘     └────────┬────────┘
                                                          │
                    ┌──────────────────────┐              ▼
                    │  wechat-renderer     │◀─────────────┘
                    │  (内联样式,           │
                    │   macOS 代码块)       │
                    └──────────┬───────────┘
                               │
┌─────────────┐               ▼
│ Gemini Pro  │     ┌──────────────────────┐     ┌─────────────────┐
│   封面图     │────▶│  上传微信 CDN +       │────▶│   公众号草稿     │
└─────────────┘     │  创建草稿             │     │   (Media ID)    │
                    └──────────────────────┘     └─────────────────┘
```

### 流水线详解

1. **解析** — `markdown-to-sections.mjs` 将 Markdown 转为类型化的 Section 数组（标题、段落、代码块、列表等）
2. **渲染** — `wechat-renderer.mjs` 将每个 Section 转为微信兼容的纯内联样式 HTML
3. **生成封面** — `gemini-imagegen.mjs` 调用 Gemini Pro API 生成 16:9 封面图
4. **上传发布** — `publish.mjs` 上传图片到微信 CDN 并通过微信公众号 API 创建草稿

### 代码块渲染

代码块使用 macOS 风格标题栏（三色圆点）+ 横向滚动：

- header 使用 `line-height:0; font-size:0` 消除 inline-block 间距（微信不可靠支持 `display:flex`）
- 每行用 `<p style="white-space:nowrap">` 包裹，禁止折行
- 空格转换为 `&nbsp;` 兼容微信
- `font-family` 中带空格的字体名使用**单引号**，避免截断 `style="..."` 属性

## 编程接口

```javascript
import { markdownToSections } from './scripts/markdown-to-sections.mjs';
import { wxRenderSections } from './scripts/wechat-renderer.mjs';

const sections = markdownToSections(markdownString);
const html = wxRenderSections(sections);
// html 可直接粘贴到微信编辑器或通过 API 发送
```

## 安全性

- 所有密钥从环境变量读取
- `.env` 已加入 `.gitignore`
- 提供 `.env.example` 安全模板
- 代码中无任何硬编码密钥

## 参与贡献

1. Fork 本仓库
2. 创建特性分支（`git checkout -b feat/amazing-feature`）
3. 提交更改（`git commit -m 'feat: add amazing feature'`）
4. 推送分支（`git push origin feat/amazing-feature`）
5. 创建 Pull Request

## 许可证

[MIT](./LICENSE)

## 作者

**楠哥** ([@xiaonan0527](https://github.com/xiaonan0527))
