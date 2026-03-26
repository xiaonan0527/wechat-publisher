#!/usr/bin/env node
/**
 * 生成三种主题的演示 HTML 文件
 */
import { markdownToSections } from '../scripts/markdown-to-sections.mjs';
import { wxRenderSections } from '../scripts/wechat-renderer.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const md = `# AI 时代的高效编程指南

## 为什么 AI 改变了编程方式

在过去的两年里，**AI 辅助编程**已经从一个新鲜概念变成了开发者的日常工具。无论是代码补全、Bug 修复还是架构设计，AI 都在深刻改变我们的工作方式。

> 真正的效率提升不是写更多代码，而是写更少但更好的代码。AI 帮助我们实现了这一点。

### 代码补全的进化

现代 AI 代码助手已经不仅仅是自动补全，它能理解上下文、推断意图，甚至帮你重构代码。

- **上下文感知**：理解整个项目结构
- **多语言支持**：Python、JavaScript、Rust 等
- **实时建议**：边写边给出优化方案

## 实战技巧：让 AI 成为你的搭档

掌握 \`prompt engineering\` 是高效使用 AI 编程工具的关键。好的 prompt 能让 AI 输出质量提升 10 倍。

### 编写有效的 Prompt

\`\`\`python
# 好的 prompt 示例
def get_weekday(date_str: str) -> str:
    from datetime import datetime
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return weekdays[dt.weekday()]
\`\`\`

### 性能对比

| 方法 | 耗时 | 准确率 | 适用场景 |
|:-----|:----:|:------:|:---------|
| 手动编写 | 30min | 85% | 复杂逻辑 |
| AI 辅助 | 5min | 92% | 通用代码 |
| AI + Review | 8min | 98% | 生产环境 |

---

## 未来展望

1. AI 将从"工具"进化为"协作者"
2. 代码审查将越来越自动化
3. 开发者的核心能力将转向**架构思维**和**问题定义**

更多信息请参考 [AI 编程指南](https://example.com)。
`;

const themes = ['default', 'magazine', 'tech'];
const themeNames = { default: '经典', magazine: '杂志风', tech: '科技风' };

for (const theme of themes) {
  const sections = markdownToSections(md, { theme });
  const body = wxRenderSections(sections, { theme });

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>演示 - ${themeNames[theme]}主题（${theme}）</title>
  <style>
    body { margin: 0; padding: 40px 20px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .phone-frame { max-width: 375px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); overflow: hidden; }
    .phone-header { padding: 12px 20px; background: #fff; border-bottom: 1px solid #eee; text-align: center; font-size: 14px; color: #333; font-weight: 600; }
    .phone-body { padding: 20px 16px; }
    h1.page-title { text-align: center; font-size: 20px; color: #333; margin-bottom: 30px; }
  </style>
</head>
<body>
  <h1 class="page-title">${themeNames[theme]}主题（--theme ${theme}）</h1>
  <div class="phone-frame">
    <div class="phone-header">微信公众号预览</div>
    <div class="phone-body">
      ${body}
    </div>
  </div>
</body>
</html>`;

  const outPath = path.join(__dirname, `theme-${theme}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`✅ examples/theme-${theme}.html (${html.length} bytes)`);
}
