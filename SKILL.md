---
name: wechat-publisher
description: 独立的微信公众号文章发布工具。生成文章、AI 生图、直接发布到微信公众号草稿箱。内置 Gemini 生图模块，不依赖外部 skill。
trigger: 当用户要求"发布微信文章"、"写公众号"、"直接发微信"时触发
---

# 微信公众号发布 Skill

独立的微信公众号文章发布工具，不依赖外部 skill，直接调用微信 API 发布。

## 特性

- ✅ **直接发布**：无需预览，直接同步到微信公众号草稿箱
- ✅ **内置生图**：集成 Gemini Pro 生图模块，不依赖外部 skill
- ✅ **自动排版**：转换为微信兼容的 HTML 格式
- ✅ **图片/视频上传**：自动上传图片和视频到微信 CDN
- ✅ **独立运行**：完全独立，可直接分享

## 配置

在 `~/.openclaw/workspace/.env` 或 OpenClaw 配置中添加：

```env
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret
MODELSCOPE_API_KEY=your_token    # 魔搭生图（国内推荐，免费）
# GEMINI_API_KEY=your_gemini_key # Gemini 生图（需代理，可选）
# GEMINI_PRO_PROXY=http://127.0.0.1:7890  # Gemini 代理（可选）
WECHAT_DEFAULT_AUTHOR=龙虾       # 默认作者（可选）
```

## 使用方法

### 1. 从主题创建文章

```
用户：写一篇关于"如何使用 AI 提升工作效率"的公众号文章，直接发布
```

AI 会：
1. 生成 5-8 个候选标题
2. 用户选择标题
3. 生成文章内容
4. 生成封面图（Gemini Pro）
5. 转换为微信 HTML
6. 上传图片到微信 CDN
7. 创建草稿并同步
8. 返回 Media ID

### 2. 从 Markdown 文件创建

```
用户：把这个 Markdown 文件发布到微信公众号
[附件: article.md]
```

### 3. 从已有内容创建

```
用户：把我刚才说的内容整理成公众号文章发布
```

## 工作流程

```
用户输入
  ↓
生成标题（AI）
  ↓
用户选择标题
  ↓
生成封面（Gemini Pro，后台）
  ↓
生成/解析内容
  ↓
等待封面生成完成
  ↓
转换为微信 HTML
  ↓
上传所有图片到微信 CDN
  ↓
创建草稿
  ↓
完成！返回 Media ID
```

## 核心脚本

### `scripts/publish.mjs`

主脚本，处理整个发布流程：

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
- `--image-provider` - 生图提供方：`modelscope`（魔搭）或 `gemini`（可选，默认自动选择）
- `--theme` - 排版主题：`default`（经典）或 `magazine`（杂志风，可选，默认 default）

### `scripts/markdown-to-sections.mjs`

Markdown 解析器，将 Markdown 文本转换为 Section 数据结构：
- 支持：H1-H3 标题、段落、有序/无序列表、引用块、代码块、分隔线、图片、视频、表格
- 默认主题：H2 自动包装为带蓝色左边框的卡片样式
- 杂志风主题（`theme: 'magazine'`）：H2 直接输出为 heading，由渲染器负责杂志风样式
- 自动添加 footer（杂志风主题使用 "THANKS FOR READING" 风格）

### `scripts/wechat-renderer.mjs`

HTML 渲染器，Section 数据 → 微信兼容 HTML：
- 所有样式纯内联（微信不支持 CSS class）
- 代码块 macOS 风格（红黄绿三圆点 + 横向滚动）
- 支持：标题、段落、列表、引用、代码、图片、视频、表格、卡片、分隔线等
- 支持 `theme` 参数切换排版风格：`default`（经典）或 `magazine`（杂志风）

### `scripts/modelscope-imagegen.mjs`

魔搭 ModelScope 生图模块（国内推荐）：
- 调用 Qwen-Image-2512 模型，国内直连，免费
- 支持中英文 prompt，中文理解能力强
- 默认输出 1024x576（16:9 封面比例）

### `scripts/gemini-imagegen.mjs`

Gemini Pro 生图模块（备选）：
- 调用 Gemini Pro API 生成封面图
- 需要代理配置（`GEMINI_PRO_PROXY`）
- 返回 base64 解码后的 PNG 文件

## 标题生成规则

**核心原则：**
1. **字数控制**：20-27字最佳，不超过32字
2. **勾起好奇心**：制造知识漏洞，让人想点开
3. **明确利益**：告诉读者能获得什么
4. **简洁直接**：避免夸张，突出实用性
5. **包含关键词**：便于搜索引擎收录
6. **禁止 emoji**：微信公众号标题不支持 emoji

**标题类型模板：**

1. **数字+结果型**（推荐，效果最好）
   - 格式：`[时间/数量对比] + [结果] + [工具/方法] + [情感词]`
   - 示例：`1小时音频3分钟转文档，这个免费AI工具太好用了`

2. **痛点+解决方案型**
   - 格式：`[痛点场景] + [解决方案] + [效果/特点]`
   - 示例：`音频转文字还在手打？这个免费工具准确率98%`

3. **对比+选择型**
   - 格式：`[对比项] + [测试过程] + [最终选择]`
   - 示例：`音频转文字：测了4个工具，最后我选了这个免费的`

4. **经验分享型**
   - 格式：`[真实经历] + [结果] + [方法]`
   - 示例：`接了个音频转文档的活，用AI 5分钟搞定赚了500`

5. **疑问+答案型**
   - 格式：`[疑问句] + [答案提示]`
   - 示例：`音频转文字哪个工具最好用？实测4种方案`

## 生图功能

支持两种生图提供方，优先级：魔搭 > Gemini。

### 魔搭 Qwen-Image-2512（推荐）

国内可直接访问，免费，生成速度快，中文理解能力强。

配置 `MODELSCOPE_API_KEY` 即可使用，Token 获取地址：https://modelscope.cn/my/myaccesstoken

```javascript
import { generateImage } from './modelscope-imagegen.mjs';

await generateImage(prompt, '/tmp/cover.png', MODELSCOPE_API_KEY, {
  model: 'Qwen/Qwen-Image-2512',
  size: '1024x576',  // 16:9 封面比例
  timeout: 120000
});
```

### Gemini Pro（备选）

需要代理访问，适合海外环境。配置 `GEMINI_API_KEY`，可选 `GEMINI_PRO_PROXY`。

```javascript
import { generateImage } from './gemini-imagegen.mjs';

await generateImage(prompt, '/tmp/cover.png', GEMINI_API_KEY, {
  model: 'gemini-3-pro-image-preview',
  timeout: 600000
});
```

### 选择逻辑

- 如果配置了 `MODELSCOPE_API_KEY`，默认使用魔搭
- 如果只配置了 `GEMINI_API_KEY`，使用 Gemini
- 可通过 `--image-provider modelscope|gemini` 强制指定
- 魔搭失败时自动回退到 Gemini（如果可用）

封面要求：
- 横版 16:9
- 主题相关
- 现代扁平设计风格
- **所有文字必须使用中文**

## 微信 HTML 渲染

### 代码块（微信兼容）

macOS 风格（红黄绿三圆点）：

```html
<section style="border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.08);background:#282c34;overflow:hidden;">
  <!-- 标题栏：line-height:0;font-size:0 消除 inline-block 间距 -->
  <section style="padding:10px 14px 0;background:#282c34;line-height:0;font-size:0;"><span
    style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:#ff5f57;"></span><span
    style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:#febc2e;"></span><span
    style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#28c840;"></span></section>
  <!-- 代码区：overflow-x:auto 实现横向滚动 -->
  <section style="padding:16px 20px;background:#282c34;font-family:'SF Mono',Consolas,monospace;font-size:14px;overflow-x:auto;overflow-y:hidden;">
    <p style="margin:0;white-space:nowrap;"><span>第一行代码</span></p>
    <p style="margin:0;white-space:nowrap;"><span>第二行代码</span></p>
  </section>
</section>
```

关键点：
- 三圆点标签间**不能有空白字符**，否则 inline-block 会产生额外间距
- header 用 `line-height:0;font-size:0` 消除间距，**不用 `display:flex`**（微信不可靠）
- 每行用 `<p white-space:nowrap>` 包裹，禁止折行
- 所有空格转 `&nbsp;`
- 代码区 `<section overflow-x:auto>` 实现横向滚动
- `font-family` 中带空格的字体名用**单引号**（双引号会截断 `style="..."` 属性）

### 样式规范

**默认主题（default）：**
- 字体：17px，行高 1.75
- 标题：h2 20px，h3 18px
- 段落间距：20px
- 引用块：左侧蓝色边框
- 图片：圆角 8px，最大宽度 100%

**杂志风主题（magazine）：**
- H2 渲染为编号卡片（PART 01/02/03）+ 渐变装饰线 + 淡紫白背景
- H3 左侧靛蓝紫竖线装饰
- 段落行距 2.0，字间距 0.8px
- 引用块圆角卡片 + 左侧靛蓝紫色条
- 分隔线改为居中装饰符 `///`
- Footer 使用 "THANKS FOR READING" + 渐变下划线
- 主色调：靛蓝紫（`#6366f1`）→ 紫色（`#8b5cf6`）渐变

## 视频支持

### Markdown 中插入视频

使用与图片相同的 `![]()` 语法，解析器会根据文件扩展名自动区分图片和视频：

```markdown
![演示视频](./demo.mp4)

![产品介绍](https://example.com/intro.mp4)
```

支持的视频格式：`.mp4`、`.mov`、`.avi`、`.wmv`、`.webm`

### 视频上传流程

发布时，脚本会自动扫描文章内容中的本地视频文件并上传到微信 CDN：

1. 检测 HTML 中 `src="xxx.mp4"` 等视频路径
2. 调用微信永久素材 API（`material/add_material?type=video`）上传
3. 将本地路径替换为微信 CDN 地址

### 编程接口

```javascript
import { uploadVideo } from './publish.mjs';

// 单独上传视频到微信永久素材
const { mediaId, url } = await uploadVideo('/path/to/video.mp4', '视频标题', '视频简介');
```

### 限制

- 微信公众号视频素材大小上限：**20MB**
- 推荐格式：**MP4**（兼容性最好）
- 视频上传为**永久素材**，占用素材库配额

## 注意事项

- **标题禁止 emoji**：微信公众号标题不支持 emoji
- **内容合规**：
  - 禁止：翻墙、梯子、VPN、科学上网等敏感词
  - 禁止：政治敏感内容、违反国内法律法规的内容
- **图片必须用 Pro 模型**（flash 中文效果差）
- **Pro 模型后台运行**（耗时 1-3 分钟）

## 错误处理

- Token 过期自动重试
- 图片上传失败回退到默认封面
- 网络错误重试 3 次
- 详细的错误日志

## 示例

### 完整流程示例

```bash
# 默认主题
node scripts/publish.mjs \
  --title "如何使用 AI 提升工作效率" \
  --content "$(cat article.md)" \
  --author "龙虾"

# 杂志风主题
node scripts/publish.mjs \
  --title "如何使用 AI 提升工作效率" \
  --content "$(cat article.md)" \
  --author "龙虾" \
  --theme magazine
```

脚本内部流程：

```javascript
import { markdownToSections } from './markdown-to-sections.mjs';
import { wxRenderSections } from './wechat-renderer.mjs';

// 1. 生成封面
const coverPath = await generateCover(title, content);

// 2. Markdown → Section → 微信 HTML（可切换主题）
const sections = markdownToSections(markdown, { theme: 'magazine' });
const html = wxRenderSections(sections, { theme: 'magazine' });

// 3. 上传图片到微信 CDN
const processedHTML = await uploadInlineMedia(html);
const thumbMediaId = await uploadImage(coverPath);

// 4. 创建草稿
const result = await createDraft({
  title, content: processedHTML, thumbMediaId, author: '龙虾'
});
console.log('草稿创建成功！Media ID:', result.mediaId);
```

## 分享

这个 skill 可以通过 ClawHub 分享给其他 OpenClaw 用户：

1. 创建 GitHub 仓库
2. 推送代码
3. 在 ClawHub 上发布
4. 其他用户可以通过 `clawhub install wechat-publisher` 安装

## 依赖

- Node.js 18+
- Gemini API Key（用于生图）
- 微信公众号 AppID 和 AppSecret

## License

MIT
