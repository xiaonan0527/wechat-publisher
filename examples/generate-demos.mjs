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

在过去的两年里，**AI 辅助编程**已经从一个新鲜概念变成了开发者的日常工具。无论是代码补全、Bug 修复还是架构设计，AI 都在深刻改变我们的工作方式。使用 \`Claude\` 或 \`GPT-4\` 等工具，可以让开发效率提升数倍，详见 [Anthropic 官网](https://anthropic.com)。

> 真正的效率提升不是写更多代码，而是写更少但更好的代码。AI 帮助我们实现了这一点——从繁琐的重复劳动中解放出来，专注于真正有价值的创造性工作。

### 代码补全的进化

现代 AI 代码助手已经不仅仅是自动补全，它能理解上下文、推断意图，甚至帮你重构整个模块。**上下文感知能力**是其中最关键的突破。

- **上下文感知**：理解整个项目结构，跨文件推理
- **多语言支持**：Python、JavaScript、Rust、Go 无缝切换
- **实时建议**：边写边给出优化方案，减少心智负担
- 支持自然语言描述直接生成可运行代码片段

### 主流工具横向对比

| 工具 | 响应速度 | 代码质量 | 上下文长度 | 适用场景 |
|:-----|:--------:|:--------:|:----------:|:---------|
| Claude Sonnet | 快 | ★★★★★ | 200K | 复杂重构 |
| GPT-4o | 中 | ★★★★☆ | 128K | 通用开发 |
| Gemini Pro | 快 | ★★★★☆ | 1M | 大文件分析 |
| Copilot | 极快 | ★★★☆☆ | 8K | 行内补全 |

## 实战技巧：让 AI 成为你的搭档

掌握 \`prompt engineering\` 是高效使用 AI 编程工具的关键。好的 prompt 能让 AI 输出质量提升 **10 倍**以上，而糟糕的 prompt 只会得到一堆无法直接使用的垃圾代码。

### 编写有效的 Prompt

给 AI 足够的上下文是第一要务。以下是一个**结构化 prompt 模板**，经过实践验证效果显著：

\`\`\`python
# 推荐的 prompt 结构
def build_prompt(task, context, constraints):
    return f"""
你是一个资深 Python 工程师。

背景：{context}

任务：{task}

约束条件：
- {constraints}
- 代码需要有类型注解
- 包含必要的错误处理
"""
\`\`\`

### 高效工作流程

1. **明确目标**：用一句话描述你想要什么结果
2. **提供上下文**：粘贴相关代码、错误信息或需求文档
3. **迭代优化**：对生成结果提出具体修改意见
4. **代码审查**：永远不要盲目复制，理解每一行逻辑

---

## 避坑指南

在使用 AI 编程工具时，有几类常见错误需要特别注意，稍不留神就会引入难以排查的 bug。

### 典型错误模式

> AI 生成的代码有时会"幻觉"出不存在的 API 或库方法。务必在文档中验证每一个你不熟悉的函数调用，尤其是涉及第三方库的部分。

- 不验证 AI 生成的依赖版本兼容性
- 直接使用未经测试的数据库查询语句
- 忽略 AI 给出的安全警告注释
- **在生产环境直接部署未 review 的代码**

## 未来展望

AI 编程工具的演进速度远超预期。根据最新研究数据，到 2026 年底，**超过 60% 的新增代码**将由 AI 辅助生成。

1. AI 将从"工具"进化为真正意义上的"协作者"
2. 代码审查流程将越来越依赖 AI 自动化
3. 开发者的核心能力将转向**架构思维**和**问题定义**
4. 低代码与 AI 融合，普通人也能构建复杂系统

![示例配图](https://picsum.photos/seed/ai-code/600/300)

更多信息请参考 [AI 编程完整指南](https://example.com)。
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
