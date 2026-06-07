const https = require('https');
const http = require('http');
const { XMLParser } = require('fast-xml-parser');

// Default RSS feeds
const DEFAULT_FEEDS = [
  { name: 'CafeF', url: 'https://cafef.vn/rss/tai-chinh-ngan-hang.rss' },
  { name: 'CafeF_ChungKhoan', url: 'https://cafef.vn/rss/chung-khoan.rss' },
  { name: 'VietStock', url: 'https://vietstock.vn/rss/chung-khoan.rss' },
  { name: 'SSI_Research', url: 'https://ssi.com.vn/rss/research.rss' }
];

function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, timeout).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractKeywords(text) {
  const stockTerms = [
    'VNINDEX', 'FPT', 'VCB', 'HPG', 'GAS', 'VHM', 'MSN', 'SAB', 'GVR', 'MWG',
    'PLX', 'VIC', 'TCB', 'MBB', 'ACB', 'VPB', 'SSB', 'TPB', 'cổ phiếu', 'thị trường',
    'ngành', 'tăng trưởng', 'lợi nhuận', 'EPS', 'P/E', 'P/B', 'ROE', 'tài chính',
    'ngân hàng', 'bất động sản', 'chứng khoán', 'đầu tư', 'khối lượng', 'giá'
  ];
  const found = [];
  for (const term of stockTerms) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(text)) found.push(term);
  }
  return found.slice(0, 10);
}

function analyzeSentiment(text) {
  const positiveWords = ['tăng', 'tăng trưởng', 'lợi nhuận', 'tích cực', 'bullish', 'mua', 'hồi phục', 'bứt phá', 'vượt đỉnh', 'khởi sắc'];
  const negativeWords = ['giảm', 'sụt giảm', 'tiêu cực', 'bearish', 'bán', 'rủi ro', 'khó khăn', 'suy yếu', 'thua lỗ', 'điều chỉnh'];

  let pos = 0, neg = 0;
  for (const w of positiveWords) {
    const matches = text.match(new RegExp(w, 'gi'));
    if (matches) pos += matches.length;
  }
  for (const w of negativeWords) {
    const matches = text.match(new RegExp(w, 'gi'));
    if (matches) neg += matches.length;
  }

  if (pos > neg * 1.5) return 'positive';
  if (neg > pos * 1.5) return 'negative';
  return 'neutral';
}

class NewsWorker {
  constructor(config = {}) {
    this.feeds = config.feeds || DEFAULT_FEEDS;
    this.maxArticles = config.maxArticles || 50;
    this.progressCallback = config.onProgress || (() => {});
  }

  async collect(feeds, maxArticles = 50) {
    const targetFeeds = feeds || this.feeds;
    const limit = maxArticles || this.maxArticles;
    this.progressCallback({ stage: 'start', totalFeeds: targetFeeds.length });

    const allArticles = [];
    const failed = [];

    for (let i = 0; i < targetFeeds.length; i++) {
      const feed = targetFeeds[i];
      this.progressCallback({ stage: 'feed', current: i + 1, total: targetFeeds.length, name: feed.name });

      try {
        const xml = await fetchUrl(feed.url);
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
        const parsed = parser.parse(xml);

        let items = [];
        if (parsed.rss && parsed.rss.channel && parsed.rss.channel.item) {
          items = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item : [parsed.rss.channel.item];
        } else if (parsed.feed && parsed.feed.entry) {
          items = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
        }

        for (const item of items.slice(0, Math.ceil(limit / targetFeeds.length))) {
          const title = item.title || '';
          const content = item.description || item.summary || item.content || '';
          const link = item.link || (item.guid && item.guid['#text']) || '';
          const pubDate = item.pubDate || item.published || item.updated || '';

          const keywords = extractKeywords(title + ' ' + content);
          const sentiment = analyzeSentiment(title + ' ' + content);

          allArticles.push({
            source: feed.name,
            title: String(title).replace(/<[^>]+>/g, ''),
            content: String(content).replace(/<[^>]+>/g, ' ').substring(0, 2000),
            url: link,
            published_at: pubDate,
            keywords,
            sentiment
          });
        }
      } catch (err) {
        failed.push({ feed: feed.name, url: feed.url, error: err.message });
      }

      this.progressCallback({ stage: 'feed_done', current: i + 1, total: targetFeeds.length, articlesSoFar: allArticles.length });
    }

    this.progressCallback({ stage: 'complete', articles: allArticles.length, failed: failed.length });

    return {
      articles: allArticles.slice(0, limit),
      failed: failed
    };
  }
}

module.exports = { NewsWorker, DEFAULT_FEEDS };
