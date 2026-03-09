/**
 * WeChat Article Renderer - Node.js version
 * 渲染为微信兼容 HTML（纯内联样式）
 */

// ============ 样式常量 ============
const WX_STYLES = {
  body: 'font-size:17px;line-height:1.75;color:#333;word-break:break-word;letter-spacing:0.5px',
  h2: 'font-size:20px;font-weight:700;color:#1a1a1a;margin:24px 0 14px;line-height:1.4',
  h3: 'font-size:18px;font-weight:600;color:#1a1a1a;margin:24px 0 12px;line-height:1.4',
  p: 'margin:0 0 20px;line-height:1.75;letter-spacing:0.5px',
  ul: 'margin:0 0 20px;padding-left:24px;list-style-type:disc',
  ol: 'margin:0 0 20px;padding-left:24px;list-style-type:decimal',
  li: 'margin-bottom:10px;line-height:1.75;letter-spacing:0.5px',
  blockquote: 'margin:0 0 20px;padding:16px 20px;border-left:4px solid #60a5fa;background-color:#f7f8fa;border-radius:0 8px 8px 0',
  code: 'background-color:#f0f1f3;padding:2px 6px;border-radius:4px;font-size:15px;color:#c7254e;font-family:Menlo,Monaco,Consolas,monospace',
  codeBlockWrap: 'margin:20px 0;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.08);background:#282c34;overflow:hidden;',
  codeBlockHeader: 'padding:10px 14px 0;background:#282c34;line-height:0;font-size:0;',
  codeBlockDot: 'display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;',
  codeBlockBody: "width:100%;box-sizing:border-box;padding:16px 20px;color:#abb2bf;background:#282c34;font-family:'SF Mono',Consolas,Monaco,'Courier New',monospace;font-size:14px;line-height:1.6;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;",
  img: 'max-width:100%;height:auto;border-radius:8px;margin:0 0 20px;display:block',
  imgCaption: 'text-align:center;font-size:14px;color:#999;margin:-12px 0 20px',
  hr: 'border:none;border-top:1px solid #eaeaea;margin:32px 0',
  footer: 'text-align:center;font-size:14px;color:#8c8c8c;margin-top:48px;padding-top:24px;border-top:1px solid #eaeaea',
  footerSub: 'margin-top:8px;font-size:13px;color:#b2b2b2',
  card: 'margin:0 0 20px;padding:20px;border-radius:8px',
  strong: 'font-weight:700;color:#1a1a1a',
};

function wxEsc(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wxEscCode(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/ /g, '&nbsp;');
}

function wxRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, `<strong style="${WX_STYLES.strong}">$1</strong>`);
  html = html.replace(/`([^`]+)`/g, `<code style="${WX_STYLES.code}">$1</code>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a style="color:#576b95;text-decoration:none;border-bottom:1px solid #576b95" href="$2">$1</a>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function wxRenderSection(s) {
  if (!s || !s.type) return '';
  
  switch (s.type) {
    case 'heading': {
      const level = s.level || 2;
      const tag = level === 2 ? 'h2' : 'h3';
      const emoji = s.emoji ? `${s.emoji} ` : '';
      const style = level === 2 ? WX_STYLES.h2 : WX_STYLES.h3;
      return `<${tag} style="${style}">${emoji}${wxRichText(s.text)}</${tag}>`;
    }
    
    case 'paragraph':
    case 'p': {
      let style = WX_STYLES.p;
      if (s.color) style += `;color:${s.color}`;
      if (s.fontSize) style += `;font-size:${s.fontSize}`;
      if (s.align) style += `;text-align:${s.align}`;
      if (s.bold) style += `;font-weight:700`;
      return `<p style="${style}">${wxRichText(s.text)}</p>`;
    }
    
    case 'list': {
      const tag = s.ordered ? 'ol' : 'ul';
      const listStyle = s.ordered ? WX_STYLES.ol : WX_STYLES.ul;
      const items = (s.items || []).map(item => {
        const text = typeof item === 'string' ? item : item.text;
        return `<li style="${WX_STYLES.li}">${wxRichText(text)}</li>`;
      }).join('');
      return `<${tag} style="${listStyle}">${items}</${tag}>`;
    }
    
    case 'blockquote': {
      let style = WX_STYLES.blockquote;
      if (s.borderColor) style += `;border-left-color:${s.borderColor}`;
      return `<section style="${style}">${wxRichText(s.text)}</section>`;
    }
    
    case 'code': {
      const lines = (s.text || '').split('\n');
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

      const lineStyle = 'margin:0;padding:0;white-space:nowrap;overflow:visible;width:max-content;min-width:100%;line-height:1.6;';
      const codeLines = lines.map(line => {
        const escaped = wxEscCode(line);
        return `<p style="${lineStyle}"><span style="font-family:Menlo,Monaco,Consolas,monospace;font-size:14px;color:#abb2bf;">${escaped}</span><span style="display:inline-block;width:20px;">&nbsp;</span></p>`;
      }).join('');

      const header = `<section style="${WX_STYLES.codeBlockHeader}"><span style="${WX_STYLES.codeBlockDot}background:#ff5f57;"></span><span style="${WX_STYLES.codeBlockDot}background:#febc2e;"></span><span style="${WX_STYLES.codeBlockDot}background:#28c840;margin-right:0;"></span></section>`;
      const body = `<section style="${WX_STYLES.codeBlockBody}">${codeLines}</section>`;
      return `<section style="${WX_STYLES.codeBlockWrap}">${header}${body}</section>`;
    }
    
    case 'image': {
      let html = `<img src="${wxEsc(s.src)}" alt="${wxEsc(s.alt || '')}" style="${WX_STYLES.img}"/>`;
      if (s.caption) {
        html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.caption)}</p>`;
      }
      return html;
    }
    
    case 'divider': {
      return `<hr style="${WX_STYLES.hr}"/>`;
    }
    
    case 'card': {
      let style = WX_STYLES.card;
      if (s.bgColor) style += `;background-color:${s.bgColor}`;
      if (s.borderColor) style += `;border-left:4px solid ${s.borderColor}`;
      const children = (s.children || []).map(wxRenderSection).join('');
      return `<section style="${style}">${children}</section>`;
    }
    
    case 'footer': {
      let html = `<section style="${WX_STYLES.footer}">${wxEsc(s.text)}`;
      if (s.subtext) {
        html += `<div style="${WX_STYLES.footerSub}">${wxEsc(s.subtext)}</div>`;
      }
      html += '</section>';
      return html;
    }
    
    default:
      return '';
  }
}

export function wxRenderSections(sections) {
  const body = sections.map(wxRenderSection).join('\n');
  return `<section style="${WX_STYLES.body}">${body}</section>`;
}
