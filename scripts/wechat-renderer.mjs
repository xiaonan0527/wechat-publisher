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
  tableWrap: 'margin:0 0 20px;overflow-x:auto;-webkit-overflow-scrolling:touch;',
  table: 'border-collapse:collapse;width:100%;min-width:100%;font-size:15px;line-height:1.6;',
  th: 'padding:10px 14px;border:1px solid #e5e7eb;background-color:#f9fafb;font-weight:600;color:#1a1a1a;text-align:left;white-space:nowrap;',
  td: 'padding:10px 14px;border:1px solid #e5e7eb;color:#333;white-space:nowrap;',
  trEven: 'background-color:#f9fafb;',
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

// ============ 加粗文字高亮效果（随机选取）============
const HIGHLIGHT_EFFECTS = [
  // 荧光笔底色 — 文字下方 40% 区域染色，模拟马克笔划线
  'background-image:linear-gradient(to top, #fef3c7 40%, transparent 40%)',  // 暖黄
  'background-image:linear-gradient(to top, #d1fae5 40%, transparent 40%)',  // 薄荷绿
  'background-image:linear-gradient(to top, #ede9fe 40%, transparent 40%)',  // 淡紫
  'background-image:linear-gradient(to top, #dbeafe 40%, transparent 40%)',  // 天蓝
  'background-image:linear-gradient(to top, #fce7f3 40%, transparent 40%)',  // 蜜桃粉
  'background-image:linear-gradient(to top, #fed7aa 40%, transparent 40%)',  // 杏橘
  // 底部彩条 — 细线下划线强调
  'border-bottom:2px solid #fbbf24;padding-bottom:1px',  // 琥珀
  'border-bottom:2px solid #34d399;padding-bottom:1px',  // 翡翠绿
  'border-bottom:2px solid #818cf8;padding-bottom:1px',  // 靛蓝紫
  'border-bottom:2px solid #f472b6;padding-bottom:1px',  // 玫红
  // 柔色背景块 — 文字整体浅色包裹
  'background-color:rgba(254,243,199,0.55);padding:2px 4px;border-radius:3px',  // 淡黄
  'background-color:rgba(209,250,229,0.50);padding:2px 4px;border-radius:3px',  // 淡绿
  'background-color:rgba(237,233,254,0.55);padding:2px 4px;border-radius:3px',  // 淡紫
];

function randomHighlight() {
  return HIGHLIGHT_EFFECTS[Math.floor(Math.random() * HIGHLIGHT_EFFECTS.length)];
}

// ============ 杂志风样式常量 ============
const MAG = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  tagColor: '#64748b',
  bgLight: '#f8f7ff',
  body: 'font-size:17px;line-height:2;color:#2d2d2d;word-break:break-word;letter-spacing:0.8px',
  p: 'margin:0 0 24px;line-height:2;letter-spacing:0.8px',
  h3: 'margin:28px 0 16px;padding-left:14px;font-size:18px;font-weight:700;color:#1a1a1a;line-height:1.5;border-left:3px solid #6366f1',
  ul: 'margin:0 0 24px;padding-left:24px;list-style-type:disc',
  ol: 'margin:0 0 24px;padding-left:24px;list-style-type:decimal',
  li: 'margin-bottom:12px;line-height:2;letter-spacing:0.8px',
  blockquote: 'margin:0 0 24px;padding:18px 22px;border-left:3px solid #6366f1;background-color:#f8f7ff;border-radius:0 10px 10px 0',
  strong: 'font-weight:700;color:#1a1a1a',
  code: 'background-color:#f0edff;padding:2px 6px;border-radius:4px;font-size:15px;color:#6366f1;font-family:Menlo,Monaco,Consolas,monospace',
  link: 'color:#6366f1;text-decoration:none;border-bottom:1px solid #c7d2fe',
};

// ============ 科技风样式常量 ============
const TECH = {
  primary: '#22d3ee',
  secondary: '#06b6d4',
  dark: '#1e293b',
  darkBg: '#0f172a',
  textLight: '#e2e8f0',
  textMuted: '#94a3b8',
  body: 'font-size:17px;line-height:1.8;color:#333;word-break:break-word;letter-spacing:0.6px',
  p: 'margin:0 0 20px;line-height:1.8;letter-spacing:0.6px',
  h3: 'margin:28px 0 16px;padding-left:14px;font-size:18px;font-weight:700;color:#1e293b;line-height:1.5;border-left:3px solid #22d3ee',
  ul: 'margin:0 0 20px;padding-left:24px;list-style-type:disc',
  ol: 'margin:0 0 20px;padding-left:24px;list-style-type:decimal',
  li: 'margin-bottom:10px;line-height:1.8;letter-spacing:0.6px',
  blockquote: 'margin:0 0 20px;padding:18px 22px;border-left:3px solid #22d3ee;background-color:#1e293b;border-radius:0 8px 8px 0;color:#e2e8f0',
  strong: 'font-weight:700;color:#1e293b',
  code: 'background-color:#1e293b;padding:2px 6px;border-radius:4px;font-size:15px;color:#22d3ee;font-family:Menlo,Monaco,Consolas,monospace',
  link: 'color:#22d3ee;text-decoration:none',
};

const TECH_HIGHLIGHTS = [
  // 青色系荧光笔底色
  'background-image:linear-gradient(to top, rgba(34,211,238,0.25) 40%, transparent 40%)',
  'background-image:linear-gradient(to top, rgba(6,182,212,0.25) 40%, transparent 40%)',
  // 绿色系荧光笔底色
  'background-image:linear-gradient(to top, rgba(52,211,153,0.25) 40%, transparent 40%)',
  'background-image:linear-gradient(to top, rgba(16,185,129,0.25) 40%, transparent 40%)',
  // 底部彩条
  'border-bottom:2px solid #22d3ee;padding-bottom:1px',
  'border-bottom:2px solid #06b6d4;padding-bottom:1px',
  'border-bottom:2px solid #34d399;padding-bottom:1px',
  // 柔色背景块
  'background-color:rgba(34,211,238,0.12);padding:2px 4px;border-radius:3px',
  'background-color:rgba(52,211,153,0.12);padding:2px 4px;border-radius:3px',
];

function randomTechHighlight() {
  return TECH_HIGHLIGHTS[Math.floor(Math.random() * TECH_HIGHLIGHTS.length)];
}

function techRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, t) =>
    `<strong style="${TECH.strong};${randomTechHighlight()}">${t}</strong>`);
  html = html.replace(/`([^`]+)`/g, `<code style="${TECH.code}">$1</code>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a style="${TECH.link}" href="$2">$1</a>`);
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function magRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, t) =>
    `<strong style="${MAG.strong};${randomHighlight()}">${t}</strong>`);
  html = html.replace(/`([^`]+)`/g, `<code style="${MAG.code}">$1</code>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a style="${MAG.link}" href="$2">$1</a>`);
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function wxRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, t) =>
    `<strong style="${WX_STYLES.strong};${randomHighlight()}">${t}</strong>`);
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

    case 'video': {
      const videoStyle = 'max-width:100%;width:100%;border-radius:8px;margin:0 0 20px;display:block;';
      let html = `<video src="${wxEsc(s.src)}" controls style="${videoStyle}"></video>`;
      if (s.alt) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.alt)}</p>`;
      return html;
    }

    case 'table': {
      const aligns = s.aligns || [];
      const ths = (s.headers || []).map((h, ci) => {
        const align = aligns[ci] || 'left';
        return `<th style="${WX_STYLES.th}text-align:${align};">${wxRichText(h)}</th>`;
      }).join('');
      const trs = (s.rows || []).map((row, ri) => {
        const bgStyle = ri % 2 === 1 ? WX_STYLES.trEven : '';
        const tds = row.map((cell, ci) => {
          const align = aligns[ci] || 'left';
          return `<td style="${WX_STYLES.td}text-align:${align};">${wxRichText(cell)}</td>`;
        }).join('');
        return `<tr style="${bgStyle}">${tds}</tr>`;
      }).join('');
      return `<section style="${WX_STYLES.tableWrap}"><table style="${WX_STYLES.table}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></section>`;
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

// ============ 杂志风渲染 ============
function wxRenderSectionMagazine(s, partCounter) {
  if (!s || !s.type) return '';

  switch (s.type) {
    case 'heading': {
      const level = s.level || 2;
      if (level === 2) {
        partCounter.n++;
        const num = String(partCounter.n).padStart(2, '0');
        return `<section style="margin:36px 0 20px;padding:24px;border-radius:12px;background:${MAG.bgLight};">` +
          `<p style="margin:0;font-size:11px;color:${MAG.tagColor};letter-spacing:4px;text-transform:uppercase;">PART ${num}</p>` +
          `<section style="margin:8px 0 12px;width:40px;height:3px;border-radius:2px;background:${MAG.gradient};"></section>` +
          `<h2 style="margin:0;font-size:22px;font-weight:800;color:#1a1a1a;line-height:1.4;">${magRichText(s.text)}</h2>` +
          `</section>`;
      }
      return `<h3 style="${MAG.h3}">${magRichText(s.text)}</h3>`;
    }

    case 'paragraph':
    case 'p': {
      let style = MAG.p;
      if (s.color) style += `;color:${s.color}`;
      if (s.fontSize) style += `;font-size:${s.fontSize}`;
      if (s.align) style += `;text-align:${s.align}`;
      if (s.bold) style += `;font-weight:700`;
      return `<p style="${style}">${magRichText(s.text)}</p>`;
    }

    case 'list': {
      const tag = s.ordered ? 'ol' : 'ul';
      const listStyle = s.ordered ? MAG.ol : MAG.ul;
      const items = (s.items || []).map(item => {
        const text = typeof item === 'string' ? item : item.text;
        return `<li style="${MAG.li}">${magRichText(text)}</li>`;
      }).join('');
      return `<${tag} style="${listStyle}">${items}</${tag}>`;
    }

    case 'blockquote': {
      return `<section style="${MAG.blockquote}">${magRichText(s.text)}</section>`;
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
      if (s.caption) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.caption)}</p>`;
      return html;
    }

    case 'video': {
      const videoStyle = 'max-width:100%;width:100%;border-radius:12px;margin:0 0 24px;display:block;';
      let html = `<video src="${wxEsc(s.src)}" controls style="${videoStyle}"></video>`;
      if (s.alt) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.alt)}</p>`;
      return html;
    }

    case 'table': {
      const magTableWrap = 'margin:0 0 24px;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px;border:1px solid #e5e7eb;';
      const magTable = 'border-collapse:collapse;width:100%;min-width:100%;font-size:15px;line-height:1.8;';
      const magTh = `padding:12px 16px;border-bottom:2px solid ${MAG.primary};background-color:${MAG.bgLight};font-weight:700;color:#1a1a1a;white-space:nowrap;`;
      const magTd = 'padding:10px 16px;border-bottom:1px solid #f0f0f0;color:#2d2d2d;white-space:nowrap;';
      const aligns = s.aligns || [];
      const ths = (s.headers || []).map((h, ci) => {
        const align = aligns[ci] || 'left';
        return `<th style="${magTh}text-align:${align};">${magRichText(h)}</th>`;
      }).join('');
      const trs = (s.rows || []).map((row, ri) => {
        const bg = ri % 2 === 1 ? `background-color:${MAG.bgLight};` : '';
        const tds = row.map((cell, ci) => {
          const align = aligns[ci] || 'left';
          return `<td style="${magTd}${bg}text-align:${align};">${magRichText(cell)}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<section style="${magTableWrap}"><table style="${magTable}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></section>`;
    }

    case 'divider': {
      return `<p style="text-align:center;margin:36px 0;font-size:14px;color:${MAG.tagColor};letter-spacing:8px;">///</p>`;
    }

    case 'card': {
      let style = `margin:0 0 24px;padding:22px;border-radius:12px`;
      if (s.bgColor) style += `;background-color:${s.bgColor}`;
      if (s.borderColor) style += `;border-left:3px solid ${s.borderColor}`;
      const children = (s.children || []).map(c => wxRenderSectionMagazine(c, partCounter)).join('');
      return `<section style="${style}">${children}</section>`;
    }

    case 'footer': {
      return `<section style="margin-top:56px;text-align:center;">` +
        `<p style="margin:0 0 8px;font-size:11px;color:${MAG.tagColor};letter-spacing:6px;text-transform:uppercase;">THANKS FOR READING</p>` +
        `<section style="margin:0 auto 16px;width:60px;height:3px;border-radius:2px;background:${MAG.gradient};"></section>` +
        (s.subtext ? `<p style="margin:0;font-size:13px;color:#b2b2b2;">${wxEsc(s.subtext)}</p>` : '') +
        `</section>`;
    }

    default:
      return '';
  }
}

// ============ 科技风渲染 ============
function wxRenderSectionTech(s, partCounter) {
  if (!s || !s.type) return '';

  switch (s.type) {
    case 'heading': {
      const level = s.level || 2;
      if (level === 2) {
        partCounter.n++;
        const num = String(partCounter.n).padStart(2, '0');
        return `<section style="margin:36px 0 20px;padding:24px;border-radius:8px;background:${TECH.dark};color:#fff;">` +
          `<p style="margin:0 0 4px;font-size:12px;color:${TECH.textMuted};letter-spacing:3px;font-family:Menlo,Monaco,Consolas,monospace;">${num} //</p>` +
          `<section style="margin:8px 0 12px;width:40px;height:3px;border-radius:2px;background:linear-gradient(90deg,${TECH.primary},transparent);"></section>` +
          `<h2 style="margin:0;font-size:22px;font-weight:800;color:#fff;line-height:1.4;">${techRichText(s.text)}</h2>` +
          `</section>`;
      }
      return `<h3 style="${TECH.h3}"><span style="font-family:Menlo,Monaco,Consolas,monospace;font-size:12px;color:${TECH.textMuted};margin-right:6px;">&gt;</span>${techRichText(s.text)}</h3>`;
    }

    case 'paragraph':
    case 'p': {
      let style = TECH.p;
      if (s.color) style += `;color:${s.color}`;
      if (s.fontSize) style += `;font-size:${s.fontSize}`;
      if (s.align) style += `;text-align:${s.align}`;
      if (s.bold) style += `;font-weight:700`;
      return `<p style="${style}">${techRichText(s.text)}</p>`;
    }

    case 'list': {
      const tag = s.ordered ? 'ol' : 'ul';
      const listStyle = s.ordered ? TECH.ol : TECH.ul;
      const items = (s.items || []).map(item => {
        const text = typeof item === 'string' ? item : item.text;
        return `<li style="${TECH.li}">${techRichText(text)}</li>`;
      }).join('');
      return `<${tag} style="${listStyle}">${items}</${tag}>`;
    }

    case 'blockquote': {
      return `<section style="${TECH.blockquote}">${techRichText(s.text)}</section>`;
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
      if (s.caption) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.caption)}</p>`;
      return html;
    }

    case 'video': {
      const videoStyle = 'max-width:100%;width:100%;border-radius:8px;margin:0 0 20px;display:block;';
      let html = `<video src="${wxEsc(s.src)}" controls style="${videoStyle}"></video>`;
      if (s.alt) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.alt)}</p>`;
      return html;
    }

    case 'table': {
      const techTableWrap = 'margin:0 0 20px;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px;overflow:hidden;';
      const techTable = 'border-collapse:collapse;width:100%;min-width:100%;font-size:15px;line-height:1.6;';
      const techTh = `padding:12px 16px;background-color:${TECH.dark};border-bottom:2px solid ${TECH.primary};font-weight:700;color:#fff;white-space:nowrap;`;
      const techTd = `padding:10px 16px;border-bottom:1px solid #e5e7eb;color:#333;white-space:nowrap;`;
      const aligns = s.aligns || [];
      const ths = (s.headers || []).map((h, ci) => {
        const align = aligns[ci] || 'left';
        return `<th style="${techTh}text-align:${align};">${techRichText(h)}</th>`;
      }).join('');
      const trs = (s.rows || []).map((row, ri) => {
        const bg = ri % 2 === 1 ? `background-color:#f1f5f9;` : '';
        const tds = row.map((cell, ci) => {
          const align = aligns[ci] || 'left';
          return `<td style="${techTd}${bg}text-align:${align};">${techRichText(cell)}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<section style="${techTableWrap}"><table style="${techTable}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></section>`;
    }

    case 'divider': {
      return `<p style="text-align:center;margin:32px 0;font-size:13px;color:${TECH.textMuted};letter-spacing:4px;font-family:Menlo,Monaco,Consolas,monospace;">// ──────── //</p>`;
    }

    case 'card': {
      let style = `margin:0 0 20px;padding:20px;border-radius:8px`;
      if (s.bgColor) style += `;background-color:${s.bgColor}`;
      if (s.borderColor) style += `;border-left:3px solid ${s.borderColor}`;
      const children = (s.children || []).map(c => wxRenderSectionTech(c, partCounter)).join('');
      return `<section style="${style}">${children}</section>`;
    }

    case 'footer': {
      return `<section style="margin-top:48px;text-align:center;">` +
        `<p style="margin:0 0 8px;font-size:13px;color:${TECH.textMuted};letter-spacing:4px;font-family:Menlo,Monaco,Consolas,monospace;">[EOF]</p>` +
        `<section style="margin:0 auto 16px;width:60px;height:3px;border-radius:2px;background:linear-gradient(90deg,${TECH.primary},transparent);"></section>` +
        (s.subtext ? `<p style="margin:0;font-size:13px;color:#b2b2b2;">${wxEsc(s.subtext)}</p>` : '') +
        `</section>`;
    }

    default:
      return '';
  }
}

export function wxRenderSections(sections, options = {}) {
  const theme = options.theme || 'default';
  if (theme === 'magazine') {
    const partCounter = { n: 0 };
    const body = sections.map(s => wxRenderSectionMagazine(s, partCounter)).join('\n');
    return `<section style="${MAG.body}">${body}</section>`;
  }
  if (theme === 'tech') {
    const partCounter = { n: 0 };
    const body = sections.map(s => wxRenderSectionTech(s, partCounter)).join('\n');
    return `<section style="${TECH.body}">${body}</section>`;
  }
  const body = sections.map(wxRenderSection).join('\n');
  return `<section style="${WX_STYLES.body}">${body}</section>`;
}
