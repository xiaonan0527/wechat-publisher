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

// ============ 科技风样式常量（大数字锚点风格） ============
const TECH = {
  accent: '#f97316',    // orange-500，活力橙，与蓝调杂志风完全不同
  accentLight: '#fff7ed', // orange-50，极淡橙底
  dark: '#1c1917',      // stone-900，近黑但暖调
  text: '#44403c',      // stone-700，正文暖灰
  textMuted: '#a8a29e', // stone-400，次要文字
  mono: "Menlo,Monaco,Consolas,'Courier New',monospace",
  body: 'font-size:17px;line-height:1.9;color:#44403c;word-break:break-word;letter-spacing:0.2px',
  p: 'margin:0 0 22px;line-height:1.9;letter-spacing:0.2px;color:#44403c',
  ul: 'margin:0 0 22px;padding-left:0;list-style-type:none',
  ol: 'margin:0 0 22px;padding-left:0;list-style-type:none',
  li: 'margin-bottom:10px;line-height:1.9;letter-spacing:0.2px',
  blockquote: 'margin:0 0 22px;padding:16px 20px;background-color:#fff7ed;border-radius:8px;border:1px solid #fed7aa',
  strong: 'font-weight:700;color:#ea580c',
  code: "background-color:#f5f5f4;padding:2px 6px;border-radius:3px;font-size:14px;color:#1c1917;font-family:Menlo,Monaco,Consolas,'Courier New',monospace",
  link: 'color:#f97316;text-decoration:underline;text-underline-offset:2px',
};

function techRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, t) =>
    `<strong style="${TECH.strong}">${t}</strong>`);
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

// ============ 科技风渲染（大数字锚点风格） ============
function wxRenderSectionTech(s, partCounter) {
  if (!s || !s.type) return '';

  switch (s.type) {
    case 'heading': {
      const level = s.level || 2;
      if (level === 2) {
        partCounter.n++;
        const num = String(partCounter.n).padStart(2, '0');
        // 大数字左侧 + 标题右侧，table 布局，数字超大做装饰锚点
        return `<section style="margin:40px 0 18px;border-top:1px solid #e7e5e4;padding-top:20px;">` +
          `<section style="display:table;width:100%;border-collapse:collapse;">` +
            `<section style="display:table-cell;width:52px;vertical-align:top;padding-right:14px;">` +
              `<p style="margin:0;font-size:36px;font-weight:900;color:${TECH.accent};line-height:1;font-family:${TECH.mono};letter-spacing:-1px;">${num}</p>` +
            `</section>` +
            `<section style="display:table-cell;vertical-align:middle;">` +
              `<h2 style="margin:0;font-size:21px;font-weight:800;color:${TECH.dark};line-height:1.35;letter-spacing:0.3px;">${techRichText(s.text)}</h2>` +
            `</section>` +
          `</section>` +
        `</section>`;
      }
      // H3：全大写字距拉开，橙色小方块前缀
      return `<h3 style="margin:26px 0 14px;font-size:16px;font-weight:700;color:${TECH.dark};line-height:1.5;letter-spacing:1px;">` +
        `<span style="display:inline-block;width:8px;height:8px;background:${TECH.accent};border-radius:2px;margin-right:8px;vertical-align:middle;"></span>` +
        `${techRichText(s.text)}</h3>`;
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
      if (s.ordered) {
        // 有序列表：橙色圆形数字序号
        let idx = 0;
        const items = (s.items || []).map(item => {
          idx++;
          const text = typeof item === 'string' ? item : item.text;
          return `<section style="display:table;width:100%;margin-bottom:12px;border-collapse:collapse;">` +
            `<section style="display:table-cell;width:26px;vertical-align:top;padding-right:10px;">` +
              `<span style="display:inline-block;width:22px;height:22px;background:${TECH.accent};border-radius:50%;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:22px;font-family:${TECH.mono};">${idx}</span>` +
            `</section>` +
            `<section style="display:table-cell;vertical-align:middle;">` +
              `<p style="margin:0;line-height:1.9;color:${TECH.text};">${techRichText(text)}</p>` +
            `</section>` +
          `</section>`;
        }).join('');
        return `<section style="margin:0 0 22px;">${items}</section>`;
      }
      // 无序列表：短横线前缀
      const items = (s.items || []).map(item => {
        const text = typeof item === 'string' ? item : item.text;
        return `<section style="display:table;width:100%;margin-bottom:10px;border-collapse:collapse;">` +
          `<section style="display:table-cell;width:20px;vertical-align:top;padding-right:8px;">` +
            `<span style="display:inline-block;width:12px;height:2px;background:${TECH.accent};margin-top:12px;border-radius:1px;"></span>` +
          `</section>` +
          `<section style="display:table-cell;vertical-align:middle;">` +
            `<p style="margin:0;line-height:1.9;color:${TECH.text};">${techRichText(text)}</p>` +
          `</section>` +
        `</section>`;
      }).join('');
      return `<section style="margin:0 0 22px;">${items}</section>`;
    }

    case 'blockquote': {
      // 橙色淡底卡片，顶部橙色短线装饰，无左边框
      return `<section style="${TECH.blockquote}">` +
        `<section style="width:24px;height:3px;background:${TECH.accent};border-radius:2px;margin-bottom:10px;"></section>` +
        `<p style="margin:0;line-height:1.9;color:${TECH.text};font-style:italic;">${techRichText(s.text)}</p>` +
        `</section>`;
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
      const techTableWrap = 'margin:0 0 22px;overflow-x:auto;-webkit-overflow-scrolling:touch;';
      const techTable = 'border-collapse:collapse;width:100%;min-width:100%;font-size:15px;line-height:1.6;';
      const techTh = `padding:10px 14px;background-color:${TECH.dark};font-weight:700;color:#fff;white-space:nowrap;font-size:13px;letter-spacing:0.5px;`;
      const techTd = `padding:10px 14px;border-bottom:1px solid #e7e5e4;color:${TECH.text};white-space:nowrap;`;
      const aligns = s.aligns || [];
      const ths = (s.headers || []).map((h, ci) => {
        const align = aligns[ci] || 'left';
        return `<th style="${techTh}text-align:${align};">${techRichText(h)}</th>`;
      }).join('');
      const trs = (s.rows || []).map((row, ri) => {
        const bg = ri % 2 === 1 ? `background-color:${TECH.accentLight};` : '';
        const tds = row.map((cell, ci) => {
          const align = aligns[ci] || 'left';
          return `<td style="${techTd}${bg}text-align:${align};">${techRichText(cell)}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<section style="${techTableWrap}"><table style="${techTable}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></section>`;
    }

    case 'divider': {
      return `<section style="margin:36px 0;display:table;width:100%;border-collapse:collapse;">` +
        `<section style="display:table-cell;vertical-align:middle;"><section style="height:1px;background:#e7e5e4;"></section></section>` +
        `<section style="display:table-cell;width:40px;text-align:center;padding:0 10px;white-space:nowrap;">` +
          `<span style="display:inline-block;width:6px;height:6px;background:${TECH.accent};border-radius:50%;"></span>` +
        `</section>` +
        `<section style="display:table-cell;vertical-align:middle;"><section style="height:1px;background:#e7e5e4;"></section></section>` +
      `</section>`;
    }

    case 'card': {
      let style = `margin:0 0 22px;padding:20px;border-radius:8px;border:1px solid #fed7aa;background-color:${TECH.accentLight};`;
      if (s.bgColor) style += `;background-color:${s.bgColor}`;
      if (s.borderColor) style += `;border-color:${s.borderColor}`;
      const children = (s.children || []).map(c => wxRenderSectionTech(c, partCounter)).join('');
      return `<section style="${style}">${children}</section>`;
    }

    case 'footer': {
      return `<section style="margin-top:52px;padding-top:24px;border-top:2px solid ${TECH.accent};text-align:center;">` +
        `<p style="margin:0;font-size:13px;color:${TECH.textMuted};letter-spacing:2px;">— END —</p>` +
        (s.subtext ? `<p style="margin:8px 0 0;font-size:13px;color:${TECH.textMuted};">${wxEsc(s.subtext)}</p>` : '') +
        `</section>`;
    }

    default:
      return '';
  }
}

// ============ 小清新 ins 风样式常量 ============
const INS = {
  pink: '#f472b6',      // pink-400，主色
  pinkDeep: '#ec4899',  // pink-500，深一档
  pinkLight: '#fdf2f8', // 极淡粉底
  pinkBorder: '#fbcfe8',// pink-200，边框
  peach: '#fb923c',     // 蜜桃橙，点缀
  text: '#374151',      // gray-700，正文
  textMuted: '#9ca3af', // gray-400，次要文字
  dark: '#1f2937',      // gray-800，标题
  body: 'font-size:17px;line-height:2;color:#374151;word-break:break-word;letter-spacing:0.8px',
  p: 'margin:0 0 22px;line-height:2;letter-spacing:0.8px;color:#374151',
  ul: 'margin:0 0 22px;padding-left:0;list-style-type:none',
  ol: 'margin:0 0 22px;padding-left:0;list-style-type:none',
  strong: 'font-weight:700;color:#ec4899',
  code: "background-color:#fdf2f8;padding:2px 6px;border-radius:12px;font-size:14px;color:#ec4899;font-family:Menlo,Monaco,Consolas,'Courier New',monospace",
  link: 'color:#ec4899;text-decoration:underline;text-underline-offset:2px',
};

function insRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, t) =>
    `<strong style="${INS.strong}">${t}</strong>`);
  html = html.replace(/`([^`]+)`/g, `<code style="${INS.code}">$1</code>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a style="${INS.link}" href="$2">$1</a>`);
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// ============ 小清新 ins 风渲染 ============
function wxRenderSectionIns(s, partCounter) {
  if (!s || !s.type) return '';

  switch (s.type) {
    case 'heading': {
      const level = s.level || 2;
      if (level === 2) {
        partCounter.n++;
        // 粉色标签 chip + 标题居中 + 细线下划线
        return `<section style="margin:40px 0 20px;text-align:center;">` +
          `<p style="margin:0 0 8px;">` +
            `<span style="display:inline-block;background:${INS.pinkLight};border:1px solid ${INS.pinkBorder};color:${INS.pinkDeep};font-size:11px;padding:3px 12px;border-radius:20px;letter-spacing:2px;">✦ ${String(partCounter.n).padStart(2,'0')} ✦</span>` +
          `</p>` +
          `<h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:${INS.dark};line-height:1.4;letter-spacing:1px;">${insRichText(s.text)}</h2>` +
          `<section style="width:40px;height:2px;background:${INS.pink};border-radius:1px;margin:0 auto;"></section>` +
        `</section>`;
      }
      // H3：粉色小圆点 + 标题
      return `<h3 style="margin:26px 0 14px;font-size:17px;font-weight:700;color:${INS.dark};line-height:1.5;letter-spacing:0.5px;">` +
        `<span style="display:inline-block;width:8px;height:8px;background:${INS.pink};border-radius:50%;margin-right:8px;vertical-align:middle;"></span>` +
        `${insRichText(s.text)}` +
      `</h3>`;
    }

    case 'paragraph':
    case 'p': {
      let style = INS.p;
      if (s.color) style += `;color:${s.color}`;
      if (s.fontSize) style += `;font-size:${s.fontSize}`;
      if (s.align) style += `;text-align:${s.align}`;
      if (s.bold) style += `;font-weight:700`;
      return `<p style="${style}">${insRichText(s.text)}</p>`;
    }

    case 'list': {
      if (s.ordered) {
        let idx = 0;
        const items = (s.items || []).map(item => {
          idx++;
          const text = typeof item === 'string' ? item : item.text;
          return `<section style="display:table;width:100%;margin-bottom:12px;border-collapse:collapse;">` +
            `<section style="display:table-cell;width:28px;vertical-align:top;padding-right:10px;">` +
              `<span style="display:inline-block;width:22px;height:22px;background:linear-gradient(135deg,${INS.pink},${INS.peach});border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;">${idx}</span>` +
            `</section>` +
            `<section style="display:table-cell;vertical-align:middle;">` +
              `<p style="margin:0;line-height:2;color:${INS.text};">${insRichText(text)}</p>` +
            `</section>` +
          `</section>`;
        }).join('');
        return `<section style="margin:0 0 22px;">${items}</section>`;
      }
      const items = (s.items || []).map(item => {
        const text = typeof item === 'string' ? item : item.text;
        return `<section style="display:table;width:100%;margin-bottom:10px;border-collapse:collapse;">` +
          `<section style="display:table-cell;width:20px;vertical-align:top;padding-right:8px;">` +
            `<span style="color:${INS.pink};font-size:16px;line-height:2;">·</span>` +
          `</section>` +
          `<section style="display:table-cell;vertical-align:middle;">` +
            `<p style="margin:0;line-height:2;color:${INS.text};">${insRichText(text)}</p>` +
          `</section>` +
        `</section>`;
      }).join('');
      return `<section style="margin:0 0 22px;">${items}</section>`;
    }

    case 'blockquote': {
      // 粉色圆角卡片，左上角小花装饰
      return `<section style="margin:0 0 22px;padding:18px 20px;background:${INS.pinkLight};border-radius:16px;border:1px solid ${INS.pinkBorder};position:relative;">` +
        `<p style="margin:0 0 4px;font-size:16px;line-height:1;color:${INS.pink};">✿</p>` +
        `<p style="margin:0;line-height:2;color:${INS.dark};letter-spacing:0.8px;">${insRichText(s.text)}</p>` +
      `</section>`;
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
      return `<section style="${WX_STYLES.codeBlockWrap};border-radius:16px;">${header}${body}</section>`;
    }

    case 'image': {
      let html = `<img src="${wxEsc(s.src)}" alt="${wxEsc(s.alt || '')}" style="max-width:100%;height:auto;border-radius:16px;margin:0 0 20px;display:block;"/>`;
      if (s.caption) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.caption)}</p>`;
      return html;
    }

    case 'video': {
      const videoStyle = 'max-width:100%;width:100%;border-radius:16px;margin:0 0 20px;display:block;';
      let html = `<video src="${wxEsc(s.src)}" controls style="${videoStyle}"></video>`;
      if (s.alt) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.alt)}</p>`;
      return html;
    }

    case 'table': {
      const insTableWrap = `margin:0 0 22px;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:16px;border:1px solid ${INS.pinkBorder};overflow:hidden;`;
      const insTable = 'border-collapse:collapse;width:100%;min-width:100%;font-size:15px;line-height:1.8;';
      const insTh = `padding:10px 14px;background:linear-gradient(135deg,${INS.pink},${INS.peach});font-weight:700;color:#fff;white-space:nowrap;font-size:14px;`;
      const insTd = `padding:10px 14px;border-bottom:1px solid ${INS.pinkBorder};color:${INS.text};white-space:nowrap;`;
      const aligns = s.aligns || [];
      const ths = (s.headers || []).map((h, ci) => {
        const align = aligns[ci] || 'left';
        return `<th style="${insTh}text-align:${align};">${insRichText(h)}</th>`;
      }).join('');
      const trs = (s.rows || []).map((row, ri) => {
        const bg = ri % 2 === 1 ? `background-color:${INS.pinkLight};` : '';
        const tds = row.map((cell, ci) => {
          const align = aligns[ci] || 'left';
          return `<td style="${insTd}${bg}text-align:${align};">${insRichText(cell)}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<section style="${insTableWrap}"><table style="${insTable}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></section>`;
    }

    case 'divider': {
      return `<p style="text-align:center;margin:32px 0;font-size:16px;color:${INS.pink};letter-spacing:12px;">· · ·</p>`;
    }

    case 'card': {
      let style = `margin:0 0 22px;padding:20px;border-radius:16px;border:1px solid ${INS.pinkBorder};background-color:${INS.pinkLight};`;
      if (s.bgColor) style += `;background-color:${s.bgColor}`;
      if (s.borderColor) style += `;border-color:${s.borderColor}`;
      const children = (s.children || []).map(c => wxRenderSectionIns(c, partCounter)).join('');
      return `<section style="${style}">${children}</section>`;
    }

    case 'footer': {
      return `<section style="margin-top:52px;text-align:center;">` +
        `<p style="margin:0 0 8px;font-size:18px;color:${INS.pink};letter-spacing:8px;">✿ ✿ ✿</p>` +
        `<section style="width:60px;height:2px;background:linear-gradient(90deg,${INS.pink},${INS.peach});border-radius:1px;margin:0 auto 12px;"></section>` +
        (s.subtext ? `<p style="margin:0;font-size:13px;color:${INS.textMuted};letter-spacing:1px;">${wxEsc(s.subtext)}</p>` : '') +
      `</section>`;
    }

    default:
      return '';
  }
}

// ============ 复古报纸样式常量 ============
const NEWS = {
  ink: '#1a1209',       // 近黑暖棕，报纸墨水色
  text: '#2c1f0e',      // 正文暖棕
  textMuted: '#7a6148', // 淡棕，次要
  paper: '#faf6e9',     // 泛黄纸色，整体底色
  paperDark: '#f0e9d2', // 稍深纸色，隔行/引用底
  rule: '#5c4a2a',      // 报纸线条色
  body: 'font-size:17px;line-height:1.9;color:#2c1f0e;word-break:break-word;letter-spacing:0.6px;background-color:#faf6e9;',
  p: 'margin:0 0 20px;line-height:1.9;letter-spacing:0.6px;color:#2c1f0e',
  ul: 'margin:0 0 20px;padding-left:0;list-style-type:none',
  ol: 'margin:0 0 20px;padding-left:0;list-style-type:none',
  strong: 'font-weight:700;color:#1a1209',
  code: "background-color:#f0e9d2;padding:2px 6px;border-radius:2px;font-size:14px;color:#2c1f0e;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;border:1px solid #c8b89a;",
  link: 'color:#5c3d11;text-decoration:underline;',
};

function newsRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, t) =>
    `<strong style="${NEWS.strong}">${t}</strong>`);
  html = html.replace(/`([^`]+)`/g, `<code style="${NEWS.code}">$1</code>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a style="${NEWS.link}" href="$2">$1</a>`);
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// ============ 复古报纸渲染 ============
function wxRenderSectionNews(s, partCounter) {
  if (!s || !s.type) return '';

  switch (s.type) {
    case 'heading': {
      const level = s.level || 2;
      if (level === 2) {
        partCounter.n++;
        const numRoman = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ'][partCounter.n - 1] || partCounter.n;
        // 黑色实底白字标题栏，顶部细线
        return `<section style="margin:40px 0 18px;">` +
          `<section style="height:3px;background:${NEWS.ink};margin-bottom:2px;"></section>` +
          `<section style="height:1px;background:${NEWS.ink};margin-bottom:6px;"></section>` +
          `<section style="background:${NEWS.ink};padding:10px 16px;display:table;width:100%;box-sizing:border-box;">` +
            `<section style="display:table-cell;vertical-align:middle;width:28px;">` +
              `<span style="color:#c8b89a;font-size:13px;font-style:italic;">${numRoman}</span>` +
            `</section>` +
            `<section style="display:table-cell;vertical-align:middle;">` +
              `<h2 style="margin:0;font-size:20px;font-weight:900;color:#faf6e9;line-height:1.4;letter-spacing:3px;">${newsRichText(s.text)}</h2>` +
            `</section>` +
          `</section>` +
          `<section style="height:1px;background:${NEWS.ink};margin-top:2px;"></section>` +
        `</section>`;
      }
      // H3：双线夹标题
      return `<section style="margin:26px 0 14px;">` +
        `<section style="height:1px;background:${NEWS.rule};margin-bottom:4px;"></section>` +
        `<h3 style="margin:0;font-size:16px;font-weight:700;color:${NEWS.ink};line-height:1.6;letter-spacing:2px;padding:0 4px;">` +
          `${newsRichText(s.text)}` +
        `</h3>` +
        `<section style="height:1px;background:${NEWS.rule};margin-top:4px;"></section>` +
      `</section>`;
    }

    case 'paragraph':
    case 'p': {
      let style = NEWS.p;
      if (s.color) style += `;color:${s.color}`;
      if (s.fontSize) style += `;font-size:${s.fontSize}`;
      if (s.align) style += `;text-align:${s.align}`;
      if (s.bold) style += `;font-weight:700`;
      return `<p style="${style}">${newsRichText(s.text)}</p>`;
    }

    case 'list': {
      if (s.ordered) {
        let idx = 0;
        const items = (s.items || []).map(item => {
          idx++;
          const text = typeof item === 'string' ? item : item.text;
          return `<section style="display:table;width:100%;margin-bottom:10px;border-collapse:collapse;">` +
            `<section style="display:table-cell;width:24px;vertical-align:top;padding-right:8px;">` +
              `<span style="font-weight:700;color:${NEWS.ink};font-size:15px;">${idx}.</span>` +
            `</section>` +
            `<section style="display:table-cell;vertical-align:top;">` +
              `<p style="margin:0;line-height:1.9;color:${NEWS.text};">${newsRichText(text)}</p>` +
            `</section>` +
          `</section>`;
        }).join('');
        return `<section style="margin:0 0 20px;">${items}</section>`;
      }
      const items = (s.items || []).map(item => {
        const text = typeof item === 'string' ? item : item.text;
        return `<section style="display:table;width:100%;margin-bottom:10px;border-collapse:collapse;">` +
          `<section style="display:table-cell;width:18px;vertical-align:top;padding-right:6px;">` +
            `<span style="color:${NEWS.ink};font-weight:700;">»</span>` +
          `</section>` +
          `<section style="display:table-cell;vertical-align:top;">` +
            `<p style="margin:0;line-height:1.9;color:${NEWS.text};">${newsRichText(text)}</p>` +
          `</section>` +
        `</section>`;
      }).join('');
      return `<section style="margin:0 0 20px;">${items}</section>`;
    }

    case 'blockquote': {
      // 编者按风格：双线框包裹，顶部"编者按"标签
      return `<section style="margin:0 0 20px;border-top:2px solid ${NEWS.ink};border-bottom:2px solid ${NEWS.ink};padding:14px 18px;background:${NEWS.paperDark};">` +
        `<p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${NEWS.ink};letter-spacing:4px;">【编者按】</p>` +
        `<p style="margin:0;line-height:1.9;color:${NEWS.text};font-style:italic;letter-spacing:0.6px;">${newsRichText(s.text)}</p>` +
      `</section>`;
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
      // 报纸风图片加细线边框
      let html = `<img src="${wxEsc(s.src)}" alt="${wxEsc(s.alt || '')}" style="max-width:100%;height:auto;border:1px solid ${NEWS.rule};margin:0 0 6px;display:block;"/>`;
      if (s.caption) html += `<p style="text-align:center;font-size:13px;color:${NEWS.textMuted};font-style:italic;margin:0 0 20px;letter-spacing:1px;">${wxEsc(s.caption)}</p>`;
      else html += `<p style="margin-bottom:20px;"></p>`;
      return html;
    }

    case 'video': {
      const videoStyle = 'max-width:100%;width:100%;border:1px solid ${NEWS.rule};margin:0 0 20px;display:block;';
      let html = `<video src="${wxEsc(s.src)}" controls style="${videoStyle}"></video>`;
      if (s.alt) html += `<p style="${WX_STYLES.imgCaption}">${wxEsc(s.alt)}</p>`;
      return html;
    }

    case 'table': {
      const newsTableWrap = `margin:0 0 20px;overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid ${NEWS.rule};`;
      const newsTable = 'border-collapse:collapse;width:100%;min-width:100%;font-size:15px;line-height:1.7;';
      const newsTh = `padding:8px 14px;background:${NEWS.ink};font-weight:700;color:${NEWS.paper};white-space:nowrap;font-size:13px;letter-spacing:2px;border-right:1px solid #3d2a10;`;
      const newsTd = `padding:8px 14px;border-bottom:1px solid #c8b89a;border-right:1px solid #c8b89a;color:${NEWS.text};white-space:nowrap;`;
      const aligns = s.aligns || [];
      const ths = (s.headers || []).map((h, ci) => {
        const align = aligns[ci] || 'left';
        return `<th style="${newsTh}text-align:${align};">${newsRichText(h)}</th>`;
      }).join('');
      const trs = (s.rows || []).map((row, ri) => {
        const bg = ri % 2 === 1 ? `background-color:${NEWS.paperDark};` : `background-color:${NEWS.paper};`;
        const tds = row.map((cell, ci) => {
          const align = aligns[ci] || 'left';
          return `<td style="${newsTd}${bg}text-align:${align};">${newsRichText(cell)}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<section style="${newsTableWrap}"><table style="${newsTable}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></section>`;
    }

    case 'divider': {
      // 报纸三线分隔
      return `<section style="margin:28px 0;">` +
        `<section style="height:2px;background:${NEWS.ink};"></section>` +
        `<section style="height:3px;"></section>` +
        `<section style="height:1px;background:${NEWS.ink};"></section>` +
      `</section>`;
    }

    case 'card': {
      let style = `margin:0 0 20px;padding:18px;border:1px solid ${NEWS.rule};background-color:${NEWS.paperDark};`;
      if (s.bgColor) style += `;background-color:${s.bgColor}`;
      const children = (s.children || []).map(wxRenderSectionNews).join('');
      return `<section style="${style}">${children}</section>`;
    }

    case 'footer': {
      return `<section style="margin-top:48px;">` +
        `<section style="height:2px;background:${NEWS.ink};margin-bottom:2px;"></section>` +
        `<section style="height:1px;background:${NEWS.ink};margin-bottom:12px;"></section>` +
        `<p style="text-align:center;margin:0 0 4px;font-size:12px;color:${NEWS.textMuted};letter-spacing:4px;">— 全文完 —</p>` +
        (s.subtext ? `<p style="text-align:center;margin:0;font-size:12px;color:${NEWS.textMuted};letter-spacing:1px;">${wxEsc(s.subtext)}</p>` : '') +
      `</section>`;
    }

    default:
      return '';
  }
}

// ============ 国潮红金样式常量 ============
const GC = {
  red: '#c0392b',       // 中国红
  redLight: '#fdf2f0',  // 极淡红底
  gold: '#b8860b',      // 暗金色，用于加粗词
  goldLine: '#d4a017',  // 亮金，用于装饰线
  dark: '#1a0a00',      // 极暖近黑
  text: '#3d1c0a',      // 暖棕色正文
  textMuted: '#9a7060', // 淡暖棕，次要文字
  bgWarm: '#fdf8f2',    // 暖白底，整体背景色调
  body: 'font-size:17px;line-height:1.9;color:#3d1c0a;word-break:break-word;letter-spacing:0.5px',
  p: 'margin:0 0 22px;line-height:1.9;letter-spacing:0.5px;color:#3d1c0a',
  ul: 'margin:0 0 22px;padding-left:0;list-style-type:none',
  ol: 'margin:0 0 22px;padding-left:0;list-style-type:none',
  li: 'margin-bottom:10px;line-height:1.9;letter-spacing:0.5px',
  strong: 'font-weight:700;color:#b8860b',
  code: "background-color:#fdf2f0;padding:2px 6px;border-radius:3px;font-size:14px;color:#c0392b;font-family:Menlo,Monaco,Consolas,'Courier New',monospace",
  link: 'color:#c0392b;text-decoration:underline;text-underline-offset:2px',
};

function gcRichText(text) {
  if (!text) return '';
  let html = wxEsc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, t) =>
    `<strong style="${GC.strong}">${t}</strong>`);
  html = html.replace(/`([^`]+)`/g, `<code style="${GC.code}">$1</code>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a style="${GC.link}" href="$2">$1</a>`);
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// ============ 国潮红金渲染 ============
function wxRenderSectionGuochao(s) {
  if (!s || !s.type) return '';

  switch (s.type) {
    case 'heading': {
      const level = s.level || 2;
      if (level === 2) {
        // ◆ 标题 ◆ 居中 + 红色渐变下划线
        return `<section style="margin:40px 0 20px;text-align:center;">` +
          `<h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${GC.dark};line-height:1.4;letter-spacing:2px;">` +
            `<span style="color:${GC.red};margin-right:8px;">◆</span>` +
            `${gcRichText(s.text)}` +
            `<span style="color:${GC.red};margin-left:8px;">◆</span>` +
          `</h2>` +
          `<section style="height:1px;background:linear-gradient(90deg,transparent 0%,${GC.goldLine} 30%,${GC.red} 50%,${GC.goldLine} 70%,transparent 100%);"></section>` +
        `</section>`;
      }
      // H3：【 】书名号风格，红色
      return `<h3 style="margin:26px 0 14px;font-size:17px;font-weight:700;color:${GC.dark};line-height:1.5;letter-spacing:1px;">` +
        `<span style="color:${GC.red};font-weight:400;">【</span>` +
        `${gcRichText(s.text)}` +
        `<span style="color:${GC.red};font-weight:400;">】</span>` +
      `</h3>`;
    }

    case 'paragraph':
    case 'p': {
      let style = GC.p;
      if (s.color) style += `;color:${s.color}`;
      if (s.fontSize) style += `;font-size:${s.fontSize}`;
      if (s.align) style += `;text-align:${s.align}`;
      if (s.bold) style += `;font-weight:700`;
      return `<p style="${style}">${gcRichText(s.text)}</p>`;
    }

    case 'list': {
      if (s.ordered) {
        let idx = 0;
        const items = (s.items || []).map(item => {
          idx++;
          const text = typeof item === 'string' ? item : item.text;
          // 红色方形序号
          return `<section style="display:table;width:100%;margin-bottom:12px;border-collapse:collapse;">` +
            `<section style="display:table-cell;width:24px;vertical-align:top;padding-right:10px;">` +
              `<span style="display:inline-block;width:20px;height:20px;background:${GC.red};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:20px;border-radius:2px;">${idx}</span>` +
            `</section>` +
            `<section style="display:table-cell;vertical-align:middle;">` +
              `<p style="margin:0;line-height:1.9;color:${GC.text};">${gcRichText(text)}</p>` +
            `</section>` +
          `</section>`;
        }).join('');
        return `<section style="margin:0 0 22px;">${items}</section>`;
      }
      // 无序：红色菱形 ◈
      const items = (s.items || []).map(item => {
        const text = typeof item === 'string' ? item : item.text;
        return `<section style="display:table;width:100%;margin-bottom:10px;border-collapse:collapse;">` +
          `<section style="display:table-cell;width:20px;vertical-align:top;padding-right:8px;">` +
            `<span style="color:${GC.red};font-size:13px;line-height:1.9;">◈</span>` +
          `</section>` +
          `<section style="display:table-cell;vertical-align:middle;">` +
            `<p style="margin:0;line-height:1.9;color:${GC.text};">${gcRichText(text)}</p>` +
          `</section>` +
        `</section>`;
      }).join('');
      return `<section style="margin:0 0 22px;">${items}</section>`;
    }

    case 'blockquote': {
      // ❝ ❞ 书法大引号，暖底居中感
      return `<section style="margin:0 0 22px;padding:18px 20px;background:${GC.redLight};border-radius:6px;border-top:2px solid ${GC.red};border-bottom:2px solid ${GC.red};text-align:center;">` +
        `<p style="margin:0 0 6px;font-size:22px;color:${GC.red};line-height:1;">❝</p>` +
        `<p style="margin:0 0 6px;line-height:1.9;color:${GC.dark};font-style:italic;letter-spacing:0.8px;">${gcRichText(s.text)}</p>` +
        `<p style="margin:0;font-size:22px;color:${GC.red};line-height:1;">❞</p>` +
      `</section>`;
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
      const gcTableWrap = 'margin:0 0 22px;overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid #e8c8b0;border-radius:6px;overflow:hidden;';
      const gcTable = 'border-collapse:collapse;width:100%;min-width:100%;font-size:15px;line-height:1.6;';
      const gcTh = `padding:10px 14px;background-color:${GC.red};font-weight:700;color:#fff;white-space:nowrap;font-size:14px;letter-spacing:1px;`;
      const gcTd = `padding:10px 14px;border-bottom:1px solid #f0ddd0;color:${GC.text};white-space:nowrap;`;
      const aligns = s.aligns || [];
      const ths = (s.headers || []).map((h, ci) => {
        const align = aligns[ci] || 'left';
        return `<th style="${gcTh}text-align:${align};">${gcRichText(h)}</th>`;
      }).join('');
      const trs = (s.rows || []).map((row, ri) => {
        const bg = ri % 2 === 1 ? `background-color:${GC.redLight};` : '';
        const tds = row.map((cell, ci) => {
          const align = aligns[ci] || 'left';
          return `<td style="${gcTd}${bg}text-align:${align};">${gcRichText(cell)}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<section style="${gcTableWrap}"><table style="${gcTable}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></section>`;
    }

    case 'divider': {
      // ────◆──── 居中菱形分隔
      return `<p style="text-align:center;margin:32px 0;font-size:14px;color:${GC.goldLine};letter-spacing:4px;">────◆────</p>`;
    }

    case 'card': {
      let style = `margin:0 0 22px;padding:20px;border-radius:6px;border:1px solid #e8c8b0;background-color:${GC.redLight};`;
      if (s.bgColor) style += `;background-color:${s.bgColor}`;
      if (s.borderColor) style += `;border-color:${s.borderColor}`;
      const children = (s.children || []).map(wxRenderSectionGuochao).join('');
      return `<section style="${style}">${children}</section>`;
    }

    case 'footer': {
      return `<section style="margin-top:52px;text-align:center;">` +
        `<p style="margin:0 0 8px;font-size:14px;color:${GC.goldLine};letter-spacing:6px;">✦ ✦ ✦</p>` +
        `<section style="height:1px;background:linear-gradient(90deg,transparent,${GC.red},transparent);margin-bottom:12px;"></section>` +
        (s.subtext ? `<p style="margin:0;font-size:13px;color:${GC.textMuted};letter-spacing:1px;">${wxEsc(s.subtext)}</p>` : '') +
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
  if (theme === 'guochao') {
    const body = sections.map(wxRenderSectionGuochao).join('\n');
    return `<section style="${GC.body}">${body}</section>`;
  }
  if (theme === 'ins') {
    const partCounter = { n: 0 };
    const body = sections.map(s => wxRenderSectionIns(s, partCounter)).join('\n');
    return `<section style="${INS.body}">${body}</section>`;
  }
  if (theme === 'news') {
    const partCounter = { n: 0 };
    const body = sections.map(s => wxRenderSectionNews(s, partCounter)).join('\n');
    return `<section style="${NEWS.body}">${body}</section>`;
  }
  const body = sections.map(wxRenderSection).join('\n');
  return `<section style="${WX_STYLES.body}">${body}</section>`;
}
