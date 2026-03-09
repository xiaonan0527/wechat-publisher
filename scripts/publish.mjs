#!/usr/bin/env node

/**
 * 微信公众号发布脚本
 * 
 * 用法：
 * node publish.mjs --title "标题" --content "内容" --author "作者"
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { markdownToSections } from './markdown-to-sections.mjs';
import { wxRenderSections } from './wechat-renderer.mjs';
import { generateImage } from './gemini-imagegen.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ 配置（从环境变量读取）============
const APPID = process.env.WECHAT_APPID || '';
const APPSECRET = process.env.WECHAT_APPSECRET || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!APPID || !APPSECRET) {
  console.error('❌ 错误：未配置微信公众号 AppID 和 AppSecret');
  console.error('请在 ~/.openclaw/workspace/.env 中配置：');
  console.error('  WECHAT_APPID=your_appid');
  console.error('  WECHAT_APPSECRET=your_appsecret');
  process.exit(1);
}

// ============ Token 缓存 ============
let tokenCache = { token: '', expiresAt: 0 };

// ============ HTTP 请求工具 ============
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = options.body ? (typeof options.body === 'string' ? Buffer.from(options.body) : options.body) : null;
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        ...(bodyBuf ? { 'Content-Length': bodyBuf.length.toString() } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function httpsPostMultipart(url, fieldName, filePath, mimeType = 'image/png') {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const boundary = '----FormBoundary' + crypto.randomBytes(8).toString('hex');
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const bodyBuffer = Buffer.concat([Buffer.from(header), fileData, Buffer.from(footer)]);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length.toString(),
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

// ============ 微信 API ============
async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.token;
  }
  const data = await httpsRequest(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
  );
  if (data.access_token) {
    tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }
  throw new Error(`获取 token 失败: ${JSON.stringify(data)}`);
}

async function uploadImage(imagePath) {
  const token = await getAccessToken();
  const result = await httpsPostMultipart(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
    'media',
    imagePath
  );
  if (result.media_id) {
    return result.media_id;
  }
  throw new Error(`上传图片失败: ${JSON.stringify(result)}`);
}

async function createDraft(article) {
  const token = await getAccessToken();
  
  // 打印调试信息
  console.log('📋 创建草稿参数:');
  console.log('  - 标题:', article.title);
  console.log('  - 作者:', article.author);
  console.log('  - 内容长度:', article.content?.length || 0);
  console.log('  - thumb_media_id:', article.thumbMediaId || '(无)');
  console.log('  - 内容前100字符:', article.content?.substring(0, 100) || '(空)');
  
  const result = await httpsRequest(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
    {
      method: 'POST',
      body: JSON.stringify({
        articles: [{
          title: article.title,
          author: article.author || '龙虾',
          content: article.content,
          thumb_media_id: article.thumbMediaId,
          digest: article.digest || '',
          need_open_comment: 0,
          only_fans_can_comment: 0,
        }],
      }),
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (result.media_id) {
    return { mediaId: result.media_id };
  }
  throw new Error(`创建草稿失败: ${JSON.stringify(result)}`);
}

// ============ 上传文章中的图片到微信 CDN ============
async function uploadInlineImages(html) {
  // 匹配所有本地图片路径
  const imgRegex = /src="([^"]+\.(png|jpg|jpeg|gif|webp))"/gi;
  let match;
  const imageMap = {};
  
  while ((match = imgRegex.exec(html)) !== null) {
    const imagePath = match[1];
    
    // 跳过已经是 URL 的图片
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      continue;
    }
    
    // 跳过已处理的图片
    if (imageMap[imagePath]) {
      continue;
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  图片不存在: ${imagePath}`);
      continue;
    }
    
    try {
      console.log(`📤 上传图片: ${path.basename(imagePath)}`);
      const token = await getAccessToken();
      const uploadResult = await httpsPostMultipart(
        `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`,
        'media',
        imagePath
      );
      
      if (uploadResult.url) {
        imageMap[imagePath] = uploadResult.url;
        console.log(`✅ 图片上传成功`);
      }
    } catch (error) {
      console.error(`❌ 图片上传失败: ${error.message}`);
    }
  }
  
  // 替换所有图片 URL
  for (const [localPath, cdnUrl] of Object.entries(imageMap)) {
    html = html.split(`src="${localPath}"`).join(`src="${cdnUrl}"`);
  }
  
  return html;
}

// ============ Markdown 转 HTML（使用 wechat-renderer）============
function markdownToWechatHTML(markdown, options = {}) {
  const sections = markdownToSections(markdown, options);
  return wxRenderSections(sections);
}

// ============ 生成封面 ============
async function generateCover(title, content) {
  if (!GEMINI_API_KEY) {
    console.log('⚠️  未配置 Gemini API Key，跳过封面生成');
    return null;
  }
  
  const prompt = `创建一个现代扁平风格的封面图，主题：${title}。
要求：
- 横版 16:9 比例
- 现代扁平设计风格
- 主题相关的视觉元素
- 所有文字必须使用中文
- 文字尽量居中显示
- 色彩鲜明，吸引眼球`;

  const outputPath = `/tmp/wechat-cover-${Date.now()}.png`;
  
  console.log('🎨 生成封面图...');
  try {
    await generateImage(prompt, outputPath, GEMINI_API_KEY, {
      model: 'gemini-3-pro-image-preview',
      timeout: 600000
    });
    
    console.log('✅ 封面生成完成');
    
    // 检查文件是否真的存在
    if (!fs.existsSync(outputPath)) {
      console.error('❌ 封面文件不存在:', outputPath);
      return null;
    }
    
    // 检查文件大小
    const stats = fs.statSync(outputPath);
    const sizeMB = stats.size / (1024 * 1024);
    console.log(`📊 封面大小: ${sizeMB.toFixed(2)}MB`);
    
    return outputPath;
  } catch (error) {
    console.error('❌ 封面生成失败:', error.message);
    return null;
  }
}

// ============ 主函数 ============
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const index = args.indexOf(name);
    return index !== -1 ? args[index + 1] : null;
  };
  
  const title = getArg('--title');
  const content = getArg('--content');
  const author = getArg('--author') || process.env.WECHAT_DEFAULT_AUTHOR || '龙虾';
  const noCover = args.includes('--no-cover');
  
  if (!title || !content) {
    console.error('用法: node publish.mjs --title "标题" --content "内容" [--author "作者"] [--no-cover]');
    process.exit(1);
  }
  
  console.log('📝 开始发布微信公众号文章...\n');
  console.log(`标题: ${title}`);
  console.log(`作者: ${author}\n`);
  
  // 1. 生成封面
  let coverPath = null;
  let thumbMediaId = null;
  
  if (!noCover) {
    coverPath = await generateCover(title, content);
  }
  
  // 2. 转换内容
  console.log('📄 转换文章格式...');
  
  // 先上传封面图到微信 CDN（用于文章内容）
  let coverImageUrl = null;
  if (coverPath && fs.existsSync(coverPath)) {
    console.log('📤 上传封面图到微信 CDN...');
    const token = await getAccessToken();
    const uploadResult = await httpsPostMultipart(
      `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`,
      'media',
      coverPath
    );
    if (uploadResult.url) {
      coverImageUrl = uploadResult.url;
      console.log('✅ 封面图上传到 CDN 完成');
    }
  }
  
  // 转换 Markdown 为 HTML，并插入封面图
  const html = markdownToWechatHTML(content, { coverImage: coverImageUrl });
  
  // 上传文章中的其他图片到微信 CDN
  const processedHTML = await uploadInlineImages(html);
  
  console.log(`✅ 格式转换完成（HTML 长度: ${processedHTML.length} 字节）\n`);
  
  // 3. 上传封面
  if (coverPath && fs.existsSync(coverPath)) {
    console.log('📤 上传封面图...');
    thumbMediaId = await uploadImage(coverPath);
    console.log('✅ 封面上传完成\n');
    
    // 清理临时文件
    fs.unlinkSync(coverPath);
  } else {
    console.log('⚠️  未生成封面，使用默认封面\n');
    // 这里可以上传一个默认封面
  }
  
  if (!thumbMediaId) {
    console.error('❌ 错误：没有可用的封面图');
    process.exit(1);
  }
  
  // 4. 创建草稿
  console.log('📮 创建草稿...');
  const result = await createDraft({
    title,
    content: processedHTML,
    thumbMediaId,
    author,
  });
  
  console.log('\n✅ 文章已同步到微信公众号草稿箱！');
  console.log(`Media ID: ${result.mediaId}`);
  console.log('\n请在微信公众号后台查看并发布。\n');
}

// 运行
main().catch(error => {
  console.error('\n❌ 发布失败:', error.message);
  process.exit(1);
});
