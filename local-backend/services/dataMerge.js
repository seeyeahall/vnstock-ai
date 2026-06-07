/**
 * dataMerge.js — Merge and deduplicate agent results into mega_context
 */

class DataMergeService {
  constructor(config = {}) {
    this.config = config;
  }

  async merge(agentResults) {
    const { youtube = {}, stock = {}, news = {} } = agentResults;

    // Deduplicate videos by videoId
    const seenVideos = new Set();
    const uniqueVideos = [];
    const uniqueTranscripts = [];

    for (const v of (youtube.videos || [])) {
      if (v.id && !seenVideos.has(v.id)) {
        seenVideos.add(v.id);
        uniqueVideos.push(v);
      }
    }

    for (const t of (youtube.transcripts || [])) {
      if (t.videoId && !seenVideos.has(t.videoId + '_tx')) {
        seenVideos.add(t.videoId + '_tx');
        uniqueTranscripts.push(t);
      }
    }

    // Deduplicate news by URL
    const seenUrls = new Set();
    const uniqueArticles = [];
    for (const a of (news.articles || [])) {
      const key = a.url || a.title;
      if (key && !seenUrls.has(key)) {
        seenUrls.add(key);
        uniqueArticles.push(a);
      }
    }

    // Build mega context
    const megaContext = {
      meta: {
        generated_at: new Date().toISOString(),
        version: '3.0',
        sources: {
          youtube: { total: youtube.videos?.length || 0, unique: uniqueVideos.length, transcripts: uniqueTranscripts.length, failed: youtube.failed?.length || 0 },
          stock: { symbols: Object.keys(stock.data || {}).length, total_ohlcv_points: this.countOhlcvPoints(stock.data) },
          news: { total: news.articles?.length || 0, unique: uniqueArticles.length, failed: news.failed?.length || 0 }
        }
      },
      youtube: {
        videos: uniqueVideos,
        transcripts: uniqueTranscripts,
        failed: youtube.failed || []
      },
      stock: stock,
      news: {
        articles: uniqueArticles,
        failed: news.failed || []
      },
      validation: {
        validated: uniqueTranscripts.length + uniqueArticles.length,
        failed: (youtube.failed?.length || 0) + (news.failed?.length || 0),
        total_sources: uniqueVideos.length + uniqueArticles.length + Object.keys(stock.data || {}).length
      }
    };

    return megaContext;
  }

  countOhlcvPoints(stockData) {
    if (!stockData) return 0;
    let count = 0;
    for (const sym of Object.values(stockData)) {
      if (sym.ohlcv && Array.isArray(sym.ohlcv)) {
        count += sym.ohlcv.length;
      }
    }
    return count;
  }

  async mergeWithHistory(megaContext, historyContext = null) {
    if (!historyContext) return megaContext;

    // Compare with previous run to detect changes
    const changes = {
      new_videos: [],
      price_changes: [],
      sentiment_shift: []
    };

    const prevVideos = historyContext.youtube?.videos || [];
    const prevIds = new Set(prevVideos.map(v => v.id));
    for (const v of megaContext.youtube.videos) {
      if (!prevIds.has(v.id)) {
        changes.new_videos.push(v);
      }
    }

    return {
      ...megaContext,
      history: {
        has_previous: true,
        changes
      }
    };
  }
}

module.exports = { DataMergeService };
