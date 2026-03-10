/**
 * 魔搭 ModelScope 图片生成模块
 * 调用 Z-Image-Turbo 模型，国内可直接访问，免费
 * API 为异步模式：提交任务 → 轮询结果 → 下载图片
 */

import https from 'https';
import fs from 'fs';

/**
 * 通过魔搭 API 生成图片
 * @param {string} prompt - 图片描述（支持中英文）
 * @param {string} outputPath - 输出文件路径
 * @param {string} apiKey - ModelScope API Token
 * @param {object} options
 * @param {string} options.model - 模型名（默认 Tongyi-MAI/Z-Image-Turbo）
 * @param {string} options.size - 图片尺寸（默认 1024x576，16:9）
 * @param {number} options.timeout - 超时毫秒数（默认 120000）
 * @param {number} options.pollInterval - 轮询间隔毫秒数（默认 3000）
 * @returns {Promise<string>} 输出路径
 */
export async function generateImage(prompt, outputPath, apiKey, options = {}) {
  const model = options.model || 'Tongyi-MAI/Z-Image-Turbo';
  const size = options.size || '1024x576';
  const timeout = options.timeout || 120000;
  const pollInterval = options.pollInterval || 3000;

  const taskId = await submitTask(prompt, model, size, apiKey);
  const imageUrl = await pollTask(taskId, apiKey, timeout, pollInterval);
  await downloadFile(imageUrl, outputPath);
  return outputPath;
}

function submitTask(prompt, model, size, apiKey) {
  const payload = JSON.stringify({ model, prompt, n: 1, size });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api-inference.modelscope.cn',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-ModelScope-Async-Mode': 'true',
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.task_id) return resolve(result.task_id);
          reject(new Error(`魔搭提交任务失败: ${data.substring(0, 300)}`));
        } catch { reject(new Error(`魔搭响应解析失败: ${data.substring(0, 300)}`)); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function queryTask(taskId, apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api-inference.modelscope.cn',
      path: `/v1/tasks/${taskId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-ModelScope-Task-Type': 'image_generation',
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`魔搭任务查询解析失败: ${data.substring(0, 300)}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function pollTask(taskId, apiKey, timeout, interval) {
  const deadline = Date.now() + timeout;
  return new Promise((resolve, reject) => {
    const check = async () => {
      if (Date.now() > deadline) return reject(new Error(`魔搭生图超时 (${timeout}ms)`));
      try {
        const result = await queryTask(taskId, apiKey);
        if (result.task_status === 'SUCCEED') {
          const images = result.output_images;
          if (images?.length) return resolve(images[0]);
          return reject(new Error('魔搭返回成功但没有图片数据'));
        }
        if (result.task_status === 'FAILED') {
          return reject(new Error(`魔搭生图任务失败: ${JSON.stringify(result.errors || result)}`));
        }
        setTimeout(check, interval);
      } catch (e) { reject(e); }
    };
    setTimeout(check, interval);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`下载图片失败，状态码: ${res.statusCode}`));
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
      stream.on('error', reject);
    }).on('error', reject);
  });
}
