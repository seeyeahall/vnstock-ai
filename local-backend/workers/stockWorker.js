const { spawn } = require('child_process');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, '../scripts/stock_fetcher.py');

const DEFAULT_SYMBOLS = [
  'VNINDEX', 'FPT', 'VCB', 'HPG', 'GAS', 'VHM', 'MSN', 'SAB',
  'GVR', 'MWG', 'PLX', 'VIC', 'TCB', 'MBB', 'ACB', 'VPB', 'SSB', 'TPB'
];

function runPython(args) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [SCRIPT_PATH, ...args]);
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (data) => { stdout += data.toString(); });
    py.stderr.on('data', (data) => { stderr += data.toString(); });
    py.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited ${code}: ${stderr || stdout}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve({ raw: stdout, error: e.message });
        }
      }
    });
  });
}

class StockWorker {
  constructor(config = {}) {
    this.symbols = config.symbols || DEFAULT_SYMBOLS;
    this.timeframe = config.timeframe || '1d';
    this.days = config.days || 30;
    this.progressCallback = config.onProgress || (() => {});
  }

  async fetchOHLCV(symbols, timeframe = '1d', days = 30) {
    const syms = symbols || this.symbols;
    this.progressCallback({ stage: 'fetch_start', total: syms.length });

    const results = {};
    for (let i = 0; i < syms.length; i++) {
      const sym = syms[i];
      this.progressCallback({ stage: 'fetch_symbol', current: i + 1, total: syms.length, symbol: sym });
      try {
        const data = await runPython(['fetch', sym, String(days)]);
        results[sym] = data;
      } catch (err) {
        results[sym] = { error: err.message, symbol: sym };
      }
    }

    this.progressCallback({ stage: 'fetch_complete', count: syms.length });
    return results;
  }

  async calculateIndicators(ohlcvData) {
    // ohlcvData can be a single symbol's data or batch
    if (ohlcvData.ohlcv) {
      // Single symbol
      try {
        const data = await runPython(['indicators', ohlcvData.symbol || 'VNINDEX', String(ohlcvData.ohlcv.length + 20)]);
        return data;
      } catch (err) {
        return { error: err.message };
      }
    }
    // Batch
    const symbols = Object.keys(ohlcvData);
    this.progressCallback({ stage: 'indicators_start', total: symbols.length });

    const results = {};
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      this.progressCallback({ stage: 'indicator_symbol', current: i + 1, total: symbols.length, symbol: sym });
      try {
        const data = await runPython(['indicators', sym, String(this.days + 50)]);
        results[sym] = data;
      } catch (err) {
        results[sym] = { error: err.message, symbol: sym };
      }
    }

    this.progressCallback({ stage: 'indicators_complete', count: symbols.length });
    return results;
  }

  async run(config = {}) {
    const symbols = config.symbols || this.symbols;
    const days = config.days || this.days;

    // Fetch OHLCV
    const ohlcvResults = await this.fetchOHLCV(symbols, config.timeframe || this.timeframe, days);

    // Calculate indicators for all symbols
    const indicatorResults = await this.calculateIndicators(ohlcvResults);

    // Merge
    const merged = {};
    for (const sym of symbols) {
      const ohlcv = ohlcvResults[sym];
      const ind = indicatorResults[sym];
      merged[sym] = {
        ohlcv: ohlcv?.ohlcv || ohlcv,
        indicators: ind?.indicators || ind,
        signals: ind?.signals || null,
        error: ohlcv?.error || ind?.error || null
      };
    }

    return {
      symbols,
      timeframe: config.timeframe || this.timeframe,
      days,
      data: merged
    };
  }
}

module.exports = { StockWorker, DEFAULT_SYMBOLS };
