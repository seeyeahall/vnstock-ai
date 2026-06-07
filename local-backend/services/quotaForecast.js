import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let registry = {};
try {
  registry = JSON.parse(readFileSync(join(__dirname, '..', 'config', 'api_registry.json'), 'utf-8'));
} catch (e) {
  console.log('[QuotaForecast] Registry load error:', e.message);
}

// Token estimation constants
const TOKENS_PER_VIDEO_TRANSCRIPT = 45000;   // ~30 min video transcript
const TOKENS_PER_ARTICLE = 2500;             // average news article
const TOKENS_PER_STOCK_SYMBOL = 800;         // OHLCV + indicators
const TOKENS_PER_REPORT_SECTION = 3000;      // analysis output per section
const OVERHEAD_MULTIPLIER = 1.15;            // system prompt + meta-prompt overhead

function forecastQuota(inputs) {
  const { videos = 0, articles = 0, symbols = 0, sections = 0 } = inputs;

  const estimatedTokens = Math.round(
    (videos * TOKENS_PER_VIDEO_TRANSCRIPT +
     articles * TOKENS_PER_ARTICLE +
     symbols * TOKENS_PER_STOCK_SYMBOL +
     sections * TOKENS_PER_REPORT_SECTION) *
    OVERHEAD_MULTIPLIER
  );

  // Find best provider capacity
  const providers = ['gemini', 'groq', 'openrouter'];
  let bestProvider = null;
  let bestCapacity = 0;

  for (const p of providers) {
    const cfg = registry[p];
    if (cfg && cfg.max_context > bestCapacity) {
      bestCapacity = cfg.max_context;
      bestProvider = p;
    }
  }

  const dailyLimit = registry[bestProvider]?.rpd_limit || 1500;
  // Rough token-to-request mapping: assume 50K tokens per request on average
  const estimatedRequests = Math.ceil(estimatedTokens / 50000);
  const dailyCapacity = dailyLimit * 50000;

  let status = 'PASS';
  let batches = 1;

  if (estimatedTokens > dailyCapacity) {
    status = 'OVERLOAD';
    batches = Math.ceil(estimatedTokens / dailyCapacity);
  } else if (estimatedTokens > dailyCapacity * 0.8) {
    status = 'WARNING';
  }

  return {
    status,
    estimated_tokens: estimatedTokens,
    estimated_requests: estimatedRequests,
    daily_capacity: dailyCapacity,
    best_provider: bestProvider,
    batches,
    breakdown: {
      videos: videos * TOKENS_PER_VIDEO_TRANSCRIPT,
      articles: articles * TOKENS_PER_ARTICLE,
      symbols: symbols * TOKENS_PER_STOCK_SYMBOL,
      sections: sections * TOKENS_PER_REPORT_SECTION,
      overhead: Math.round((videos * TOKENS_PER_VIDEO_TRANSCRIPT + articles * TOKENS_PER_ARTICLE + symbols * TOKENS_PER_STOCK_SYMBOL + sections * TOKENS_PER_REPORT_SECTION) * (OVERHEAD_MULTIPLIER - 1))
    }
  };
}

export { forecastQuota };
