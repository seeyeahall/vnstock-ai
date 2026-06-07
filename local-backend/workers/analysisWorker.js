const fs = require('fs');
const path = require('path');

const META_PROMPT_PATH = path.join(__dirname, '../config/meta_prompt.md');

class AnalysisWorker {
  constructor(config = {}) {
    this.provider = config.provider || 'gemini';
    this.metaPromptPath = config.metaPromptPath || META_PROMPT_PATH;
    this.progressCallback = config.onProgress || (() => {});
  }

  loadMetaPrompt() {
    try {
      return fs.readFileSync(this.metaPromptPath, 'utf-8');
    } catch (err) {
      return this.getDefaultMetaPrompt();
    }
  }

  getDefaultMetaPrompt() {
    return `# META-PROMPT: Phân tích thị trường chứng khoán Việt Nam — 5 bước
ROLE: Chuyên gia phân tích thị trường tài chính, tư duy phản biện cực đoan.

QUY TRÌNH 5 BƯỚC (BẮT BUỘC):
B1. Quét tần suất từ khóa, vol nổ, giá gãy nền → Xác định ngành tiêu điểm
B2. Phân loại trạng thái: Uptrend FOMO / Downtrend / Sideway
B3. Kích hoạt bộ quy tắc phản biện tương ứng
B4. Đối chiếu chéo chuyên gia: Bullish vs Bearish + Blind Spots
B5. Xuất báo cáo theo mẫu người dùng

CẤU TRÚC 4 PHẦN:
PHẦN 1: Toàn cảnh vĩ mô & Nhân quả
PHẦN 2: Vi mô ngành & Cổ phiếu
PHẦN 3: Insights & Cảnh báo
PHẦN 4: Watchlist & Hành động
`;
  }

  buildPrompt(megaContext, template) {
    const metaPrompt = this.loadMetaPrompt();
    const contextJson = JSON.stringify(megaContext, null, 2);
    const templateJson = JSON.stringify(template, null, 2);

    return `${metaPrompt}

---

## DỮ LIỆU ĐẦU VÀO (MEGA CONTEXT)
\`\`\`json
${contextJson}
\`\`\`

## MẪU BÁO CÁO NGƯỜI DÙNG CHỌN
\`\`\`json
${templateJson}
\`\`\`

## YÊU CẦU
1. Chạy đúng 5 bước Meta-Prompt
2. Trả về JSON với cấu trúc 4 phần
3. Mọi luận điểm phải có citation [Kênh - Video - Ngày]
4. Số liệu từ API thực, không từ "kiến thức" AI
5. Đánh dấu rõ: fact | inference | opinion
`;
  }

  async analyze(megaContext, template, provider = null) {
    const prov = provider || this.provider;
    this.progressCallback({ stage: 'start', provider: prov });

    // Step B1: Anomaly Detection (pre-computed in JS for structure)
    this.progressCallback({ stage: 'b1_anomaly', message: 'Quét bất thường & xác định ngành tiêu điểm' });
    const focusSectors = this.detectFocusSectors(megaContext);

    // Step B2: Market Regime
    this.progressCallback({ stage: 'b2_regime', message: 'Phân loại trạng thái thị trường' });
    const regime = this.detectMarketRegime(megaContext);

    // Step B3: Critique Rules
    this.progressCallback({ stage: 'b3_critique', message: 'Kích hoạt bộ quy tắc phản biện' });
    const critiqueRules = this.getCritiqueRules(regime.regime);

    // Step B4: Cross-Reference
    this.progressCallback({ stage: 'b4_crossref', message: 'Đối chiếu chéo chuyên gia' });
    const expertDebate = this.crossReferenceExperts(megaContext);

    // Step B5: Generate Report
    this.progressCallback({ stage: 'b5_generate', message: 'Tạo báo cáo theo mẫu' });
    const report = this.generateStructuredReport(megaContext, template, {
      focusSectors,
      regime,
      critiqueRules,
      expertDebate
    });

    this.progressCallback({ stage: 'complete' });

    return {
      provider: prov,
      market_regime: regime.regime,
      regime_confidence: regime.confidence,
      focus_sectors: focusSectors,
      expert_debate: expertDebate,
      critique_rules: critiqueRules,
      report
    };
  }

  detectFocusSectors(megaContext) {
    const keywordCounts = {};
    const youtube = megaContext.youtube || {};
    const news = megaContext.news || {};

    // Count keywords from transcripts
    const transcripts = youtube.transcripts || [];
    for (const tx of transcripts) {
      const text = tx.transcript?.text || '';
      const sectors = ['bất động sản', 'ngân hàng', 'chứng khoán', 'bán lẻ', 'công nghệ', 'dầu khí', 'thép', 'hàng không'];
      for (const s of sectors) {
        const matches = text.match(new RegExp(s, 'gi'));
        if (matches) {
          keywordCounts[s] = (keywordCounts[s] || 0) + matches.length;
        }
      }
    }

    // Count from news
    const articles = news.articles || [];
    for (const a of articles) {
      for (const kw of (a.keywords || [])) {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    }

    const sorted = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5).map(([k, v]) => ({ sector: k, mentions: v }));
  }

  detectMarketRegime(megaContext) {
    const stock = megaContext.stock || {};
    const data = stock.data || {};
    const vnindex = data.VNINDEX;

    if (!vnindex || !vnindex.ohlcv || !vnindex.ohlcv.length) {
      return { regime: 'unknown', confidence: 0 };
    }

    const ohlcv = vnindex.ohlcv;
    const first = ohlcv[0];
    const last = ohlcv[ohlcv.length - 1];
    const changePct = ((last.close - first.close) / first.close) * 100;

    // Simple regime detection
    let regime = 'sideway';
    let confidence = 0.6;

    if (changePct > 1.5) {
      regime = 'uptrend_fomo';
      confidence = 0.85;
    } else if (changePct > 0.5) {
      regime = 'uptrend_normal';
      confidence = 0.75;
    } else if (changePct < -2) {
      regime = 'downtrend_panic';
      confidence = 0.85;
    } else if (changePct < -0.5) {
      regime = 'downtrend_normal';
      confidence = 0.75;
    }

    // Check RSI if available
    const rsi = vnindex.indicators?.rsi?.rsi14;
    if (rsi) {
      const lastRsi = rsi.filter(v => v !== null).pop();
      if (lastRsi !== undefined) {
        if (lastRsi > 70 && regime.startsWith('uptrend')) confidence = Math.min(confidence + 0.1, 1.0);
        if (lastRsi < 30 && regime.startsWith('downtrend')) confidence = Math.min(confidence + 0.1, 1.0);
      }
    }

    return { regime, confidence: Math.round(confidence * 100) / 100, changePct: Math.round(changePct * 100) / 100 };
  }

  getCritiqueRules(regime) {
    const rules = {
      'uptrend_fomo': [
        'Ép tìm rủi ro ẩn, bẫy tăng giá',
        'Cảnh báo quá mua (RSI > 70)',
        'Phân kỳ âm giá vs OBV',
        'Kiểm tra margin có tăng bất thường không'
      ],
      'uptrend_normal': [
        'Tìm điểm yếu ngành dẫn dắt',
        'Vol có xác nhận không',
        'Margin có tăng không'
      ],
      'sideway': [
        'Tìm vùng tích lũy / phân phối',
        'Dòng tiền chảy vào đâu',
        'Breakout sắp xảy ra?'
      ],
      'downtrend_panic': [
        'Tìm điểm hồi phục kỹ thuật',
        'Hỗ trợ cứng',
        'Dòng tiền vào hàng giá rẻ'
      ],
      'downtrend_normal': [
        'Tìm ngành chống đỡ',
        'Cổ phiếu phòng thủ',
        'Rủi ro margin call'
      ]
    };
    return rules[regime] || rules['sideway'];
  }

  crossReferenceExperts(megaContext) {
    const youtube = megaContext.youtube || {};
    const transcripts = youtube.transcripts || [];

    const bullish = [];
    const bearish = [];
    const blindSpots = [];

    for (const tx of transcripts) {
      const text = tx.transcript?.text || '';
      const title = tx.title || '';
      const channel = tx.channel || 'unknown';

      const sentiment = this.classifyExpertSentiment(text + ' ' + title);
      const entry = { channel, title: title.substring(0, 100), sentiment };

      if (sentiment === 'bullish') bullish.push(entry);
      else if (sentiment === 'bearish') bearish.push(entry);
    }

    // Detect blind spots: topics no one mentions
    const allText = transcripts.map(t => t.transcript?.text || '').join(' ');
    const macroTopics = ['tỷ giá', 'lãi suất', 'USD/VND', 'Fed', 'lạm phát', 'GDP'];
    for (const topic of macroTopics) {
      if (!allText.toLowerCase().includes(topic)) {
        blindSpots.push(topic);
      }
    }

    return { bullish, bearish, blindSpots: blindSpots.slice(0, 5) };
  }

  classifyExpertSentiment(text) {
    const pos = ['tăng', 'mua', 'bullish', 'breakout', 'vượt đỉnh', 'khởi sắc', 'tích cực'];
    const neg = ['giảm', 'bán', 'bearish', 'breakdown', 'rủi ro', 'tiêu cực', 'điều chỉnh'];

    let p = 0, n = 0;
    for (const w of pos) {
      const m = text.match(new RegExp(w, 'gi'));
      if (m) p += m.length;
    }
    for (const w of neg) {
      const m = text.match(new RegExp(w, 'gi'));
      if (m) n += m.length;
    }

    if (p > n * 1.3) return 'bullish';
    if (n > p * 1.3) return 'bearish';
    return 'neutral';
  }

  generateStructuredReport(megaContext, template, analysis) {
    const now = new Date().toISOString().split('T')[0];
    const reportId = `rpt-${now.replace(/-/g, '')}-001`;

    const sections = template?.sections || [
      { id: 'macro', enabled: true },
      { id: 'sector', enabled: true },
      { id: 'insight', enabled: true },
      { id: 'watchlist', enabled: true }
    ];

    const parts = {};
    for (const sec of sections) {
      if (!sec.enabled) continue;
      switch (sec.id) {
        case 'macro':
          parts.part1_macro = {
            title: 'Phần 1: Toàn cảnh vĩ mô & Nhân quả',
            content: this.generateMacroSection(megaContext, analysis),
            sources: this.extractSources(megaContext)
          };
          break;
        case 'sector':
          parts.part2_sector = {
            title: 'Phần 2: Vi mô ngành & Cổ phiếu',
            content: this.generateSectorSection(megaContext, analysis),
            sources: this.extractSources(megaContext)
          };
          break;
        case 'insight':
          parts.part3_insights = {
            title: 'Phần 3: Insights & Cảnh báo',
            content: this.generateInsightSection(analysis),
            sources: []
          };
          break;
        case 'watchlist':
          parts.part4_watchlist = {
            title: 'Phần 4: Watchlist & Hành động',
            content: this.generateWatchlistSection(megaContext, analysis),
            sources: []
          };
          break;
      }
    }

    return {
      report_id: reportId,
      date: now,
      template: template?.template_id || 'custom',
      market_regime: analysis.regime.regime,
      regime_confidence: analysis.regime.confidence,
      focus_sectors: analysis.focusSectors,
      parts,
      blind_spots: analysis.expertDebate.blindSpots,
      expert_debate: {
        bullish_count: analysis.expertDebate.bullish.length,
        bearish_count: analysis.expertDebate.bearish.length
      },
      validation_summary: {
        total_sources: (megaContext.youtube?.transcripts?.length || 0) + (megaContext.news?.articles?.length || 0),
        validated: megaContext.validation?.validated || 0,
        failed: megaContext.validation?.failed || 0
      }
    };
  }

  generateMacroSection(megaContext, analysis) {
    const regime = analysis.regime;
    const stocks = megaContext.stock?.data || {};
    const vnindex = stocks.VNINDEX;
    const lastClose = vnindex?.ohlcv?.[vnindex.ohlcv.length - 1]?.close || 'N/A';

    return `## Trạng thái thị trường: ${regime.regime} (độ tin cậy: ${Math.round(regime.confidence * 100)}%)

**VNINDEX**: ${lastClose} — Biến động ${regime.changePct > 0 ? '+' : ''}${regime.changePct}% trong giai đoạn phân tích.

**Ngành tiêu điểm**: ${analysis.focusSectors.map(s => s.sector).join(', ') || 'Chưa xác định rõ'}

**Bộ quy tắc phản biện đã kích hoạt**:
${analysis.critiqueRules.map(r => `- ${r}`).join('\n')}

**Đối chiếu chuyên gia**:
- Bullish: ${analysis.expertDebate.bullish.length} nguồn
- Bearish: ${analysis.expertDebate.bearish.length} nguồn
- Blind Spots: ${analysis.expertDebate.blindSpots.join(', ') || 'Không phát hiện'}
`;
  }

  generateSectorSection(megaContext, analysis) {
    const stocks = megaContext.stock?.data || {};
    const lines = [];
    for (const [sym, data] of Object.entries(stocks).slice(0, 10)) {
      const ohlcv = data.ohlcv;
      const last = Array.isArray(ohlcv) ? ohlcv[ohlcv.length - 1] : null;
      if (last) {
        lines.push(`- **${sym}**: ${last.close} (Vol: ${last.volume?.toLocaleString() || 'N/A'})`);
      }
    }
    return `## Bản đồ cổ phiếu

${lines.join('\n')}

**Ngành tiêu điểm**: ${analysis.focusSectors.map(s => `${s.sector} (${s.mentions} lần nhắc)`).join(', ')}
`;
  }

  generateInsightSection(analysis) {
    return `## Insights & Cảnh báo

**Blind Spots** (rủi ro/cơ hội bị bỏ sót):
${analysis.expertDebate.blindSpots.length > 0 ? analysis.expertDebate.blindSpots.map(b => `- ${b}`).join('\n') : '- Không phát hiện blind spot rõ ràng'}

**Bộ quy tắc phản biện**:
${analysis.critiqueRules.map(r => `- ${r}`).join('\n')}

**Lưu ý**: Các luận điểm trên là suy luận của AI dựa trên dữ liệu thu thập. Cần đối chiếu với dữ liệu thô trước khi ra quyết định đầu tư.
`;
  }

  generateWatchlistSection(megaContext, analysis) {
    const stocks = megaContext.stock?.data || {};
    const rows = [];
    for (const [sym, data] of Object.entries(stocks).slice(0, 10)) {
      const sig = data.signals;
      const direction = sig?.direction || 'neutral';
      const strength = sig?.strength || 0;
      rows.push(`| ${sym} | ${direction} | ${Math.round(strength * 100)}% | Theo dõi |`);
    }
    return `## Watchlist động

| Mã CP | Xu hướng | Sức mạnh | Hành động |
|-------|----------|----------|-----------|
${rows.join('\n')}

**Kịch bản cơ sở**: Thị trường tiếp tục xu hướng ${analysis.regime.regime}
**Kịch bản rủi ro**: Đảo chiều nếu vol giảm + phân kỳ chỉ báo
`;
  }

  extractSources(megaContext) {
    const sources = [];
    const transcripts = megaContext.youtube?.transcripts || [];
    for (const tx of transcripts.slice(0, 5)) {
      sources.push({
        type: 'youtube',
        channel: tx.channel,
        title: tx.title,
        video_id: tx.videoId
      });
    }
    const articles = megaContext.news?.articles || [];
    for (const a of articles.slice(0, 5)) {
      sources.push({
        type: 'news',
        feed: a.source,
        title: a.title,
        url: a.url
      });
    }
    return sources;
  }
}

module.exports = { AnalysisWorker };
