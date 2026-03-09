# 微信公众号发布 Skill

独立的微信公众号文章发布工具，不依赖任务中心，直接调用微信 API 发布。

## 特性

- ✅ **直接发布**：无需预览，直接同步到微信公众号草稿箱
- ✅ **AI 生图**：集成 Gemini Pro 自动生成封面
- ✅ **自动排版**：转换为微信兼容的 HTML 格式
- ✅ **图片上传**：自动上传图片到微信 CDN
- ✅ **独立运行**：不依赖任务中心，可独立分享

## 安装

### 通过 ClawHub 安装（推荐）

```bash
clawhub install wechat-publisher
```

### 手动安装

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/xiaonan0527/wechat-publisher.git
```

## 配置

1. 复制环境变量模板：

```bash
cp ~/.openclaw/workspace/skills/wechat-publisher/.env.example ~/.openclaw/workspace/.env
```

2. 编辑 `.env` 文件，填入你的配置：

```env
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret
GEMINI_API_KEY=your_gemini_key
```

**⚠️ 重要：不要将 `.env` 文件提交到 Git！**

## 使用

### 在 OpenClaw 中使用

```
用户：写一篇关于"如何使用 AI 提升工作效率"的公众号文章，直接发布
```

AI 会自动调用这个 skill 完成发布。

### 命令行使用

```bash
node ~/.openclaw/workspace/skills/wechat-publisher/scripts/publish.mjs \
  --title "文章标题" \
  --content "文章内容（Markdown）" \
  --author "龙虾"
```

参数：
- `--title` - 文章标题（必填）
- `--content` - 文章内容，Markdown 格式（必填）
- `--author` - 作者名（可选，默认"龙虾"）
- `--no-cover` - 不生成封面，使用默认封面

## 工作流程

1. 生成封面图（Gemini Pro）
2. 转换 Markdown 为微信 HTML
3. 上传封面到微信 CDN
4. 创建草稿并同步
5. 返回 Media ID

## 依赖

- Node.js 18+
- Gemini API Key（用于生图，可选）
- 微信公众号 AppID 和 AppSecret

## 安全性

- ✅ 所有敏感信息从环境变量读取
- ✅ `.env` 文件已加入 `.gitignore`
- ✅ 提供 `.env.example` 作为模板
- ✅ 不在代码中硬编码任何 key

## 分享

这个 skill 可以通过 ClawHub 分享给其他 OpenClaw 用户。

## License

MIT

## 作者

楠哥
