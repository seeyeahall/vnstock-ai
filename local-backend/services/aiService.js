import { get } from 'https';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let registry = {};
try {
  registry = JSON.parse(readFileSync(join(__dirname, '..', 'config', 'api_registry.json'), 'utf-8'));
} catch (e) {
  console.log('[AIService] Registry load error:', e.message);
}

/**
 * Call Gemini API with a prompt
 * @param {string} prompt - The prompt to send
 * @param {object} options - Options (temperature, maxTokens, etc.)
 * @returns {Promise<string>} - The generated text
 */
export async function callGemini(prompt, options = {}) {
  const config = registry.gemini;
  if (!config || !config.api_key) {
    throw new Error('Gemini API key not configured');
  }

  const model = options.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.api_key}`;

  const body = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      topP: options.topP ?? 0.95,
      topK: options.topK ?? 40
    }
  });

  return new Promise((resolve, reject) => {
    const req = get(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Gemini API error: ${json.error.message}`));
            return;
          }
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse Gemini response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Build analysis prompt from merged data
 * @param {object} mergedData - Data from agent swarm
 * @param {string} templateId - Report template ID
 * @returns {string} - Formatted prompt
 */
export function buildAnalysisPrompt(mergedData, templateId) {
  const stockData = mergedData.stock?.data || {};
  const newsData = mergedData.news?.data || [];
  const youtubeData = mergedData.youtube?.data || [];

  const symbols = Object.keys(stockData);
  const stockSummary = symbols.map(s => {
    const d = stockData[s];
    return `- ${s}: Giá ${d.price || 'N/A'}, RSI ${d.indicators?.rsi14 || 'N/A'}, Xu hướng ${d.trend || 'N/A'}`;
  }).join('\n');

  const newsSummary = newsData.slice(0, 5).map(n => `- ${n.title || 'N/A'} (${n.source || 'N/A'})`).join('\n');
  const youtubeSummary = youtubeData.slice(0, 3).map(y => `- ${y.title || 'N/A'} (${y.channel || 'N/A'})`).join('\n');

  return `Bạn là chuyên gia phân tích chứng khoán Việt Nam. Hãy phân tích dữ liệu sau và tạo báo cáo ngắn gọn:

## Dữ liệu cổ phiếu
${stockSummary || 'Không có dữ liệu'}

## Tin tức gần đây
${newsSummary || 'Không có tin tức'}

## Video YouTube phân tích
${youtubeSummary || 'Không có video'}

## Yêu cầu
1. Xác định chế độ thị trường (Uptrend/Downtrend/Sideway)
2. Chỉ ra ngành tiêu điểm
3. Tính RSI trung bình
4. Viết tóm tắt 2-3 câu
5. Template: ${templateId}

Trả về JSON với format:
{
  "marketRegime": "...",
  "focusSectors": ["..."],
  "avgRSI": number,
  "summary": "...",
  "provider": "gemini"
}`;
}

/**
 * Parse Gemini analysis response
 * @param {string} text - Raw response text
 * @returns {object} - Parsed analysis
 */
export function parseAnalysisResponse(text) {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonStr);
    return {
      marketRegime: parsed.marketRegime || 'Sideway',
      focusSectors: Array.isArray(parsed.focusSectors) ? parsed.focusSectors : ['Tổng hợp'],
      avgRSI: typeof parsed.avgRSI === 'number' ? parsed.avgRSI : 50,
      summary: parsed.summary || '',
      provider: parsed.provider || 'gemini',
      symbols: parsed.symbols || 0,
      articles: parsed.articles || 0
    };
  } catch (e) {
    console.error('[AIService] Failed to parse analysis:', e.message);
    return null;
  }
}
