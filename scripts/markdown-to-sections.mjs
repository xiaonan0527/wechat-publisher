/**
 * Markdown 转 Section 数据结构
 * 将 Markdown 文本转换为 wechat-renderer 可用的 Section 数组
 */

/**
 * 解析 Markdown 为 Section 数组
 * @param {string} markdown - Markdown 文本
 * @param {object} options - 选项
 * @param {string} options.coverImage - 封面图路径（可选）
 * @returns {Array} Section 数组
 */
export function markdownToSections(markdown, options = {}) {
  const sections = [];
  
  // 如果有封面图，添加到开头
  if (options.coverImage) {
    sections.push({
      type: 'image',
      src: options.coverImage,
      alt: '封面图'
    });
  }
  
  const lines = markdown.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // 空行
    if (!line) {
      i++;
      continue;
    }
    
    // H1 标题（跳过，通常是文章标题）
    if (line.startsWith('# ')) {
      i++;
      continue;
    }
    
    // H2 标题（带卡片）
    if (line.startsWith('## ')) {
      const text = line.substring(3).trim();
      sections.push({
        type: 'card',
        bgColor: '#f8f8f8',
        borderColor: '#3b82f6',
        children: [
          { type: 'heading', level: 2, text, emoji: '📌' }
        ]
      });
      i++;
      continue;
    }
    
    // H3 标题
    if (line.startsWith('### ')) {
      const text = line.substring(4).trim();
      sections.push({
        type: 'heading',
        level: 3,
        text,
        emoji: '▸'
      });
      i++;
      continue;
    }
    
    // 引用块
    if (line.startsWith('> ')) {
      let quoteText = line.substring(2);
      i++;
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteText += '\n' + lines[i].trim().substring(2);
        i++;
      }
      sections.push({
        type: 'blockquote',
        text: quoteText,
        borderColor: '#60a5fa'
      });
      continue;
    }
    
    // 代码块
    if (line.startsWith('```')) {
      const language = line.substring(3).trim() || 'text';
      i++;
      let codeText = '';
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeText += (codeText ? '\n' : '') + lines[i];
        i++;
      }
      i++; // 跳过结束的 ```
      sections.push({
        type: 'code',
        language,
        text: codeText
      });
      continue;
    }
    
    // 无序列表
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const item = lines[i].trim().substring(2);
        items.push(item);
        i++;
      }
      sections.push({
        type: 'list',
        ordered: false,
        items
      });
      continue;
    }
    
    // 有序列表
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^\d+\.\s/, '');
        items.push(item);
        i++;
      }
      sections.push({
        type: 'list',
        ordered: true,
        items
      });
      continue;
    }
    
    // 分隔线
    if (line === '---' || line === '***' || line === '___') {
      sections.push({ type: 'divider' });
      i++;
      continue;
    }
    
    // 普通段落
    let paragraph = line;
    i++;
    while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
      paragraph += '\n' + lines[i].trim();
      i++;
    }
    
    // 检查是否是粗体段落
    const isBold = paragraph.startsWith('**') && paragraph.endsWith('**');
    
    sections.push({
      type: 'paragraph',
      text: paragraph,
      bold: isBold
    });
  }
  
  // 添加 footer
  sections.push({
    type: 'footer',
    text: '— END —',
    subtext: '🦐 龙虾 · OpenClaw 技术分享'
  });
  
  return sections;
}

/**
 * 检查是否是特殊行（标题、列表、代码块等）
 */
function isSpecialLine(line) {
  const trimmed = line.trim();
  return (
    /^#{1,6}\s/.test(trimmed) ||
    trimmed.startsWith('- ') ||
    trimmed.startsWith('* ') ||
    trimmed.startsWith('> ') ||
    trimmed.startsWith('```') ||
    /^\d+\.\s/.test(trimmed) ||
    trimmed === '---' ||
    trimmed === '***' ||
    trimmed === '___'
  );
}
