import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
} from "lucide-react";
import { API_BASE } from "@/services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicators {
  ma?: { ma5: number[]; ma20: number[]; ma50: number[] };
  ema?: { ema12: number[]; ema26: number[] };
  rsi?: { rsi14: number[] };
  macd?: { macd: number[]; signal: number[]; histogram: number[] };
  bollinger?: { upper: number[]; middle: number[]; lower: number[] };
  ichimoku_standard?: { tenkan: number[]; kijun: number[]; senkou_a: number[]; senkou_b: number[]; chikou: number[] };
  ichimoku_longterm?: { tenkan: number[]; kijun: number[]; senkou_a: number[]; senkou_b: number[]; chikou: number[] };
  volume_ma?: { vma20: number[] };
  obv?: { obv: number[] };
  stochastic?: { k: number[]; d: number[] };
}

const INDICATOR_LIST = [
  { id: "ma", name: "MA (5,20,50)" },
  { id: "ema", name: "EMA (12,26)" },
  { id: "rsi", name: "RSI (14)" },
  { id: "macd", name: "MACD" },
  { id: "bollinger", name: "Bollinger Bands" },
  { id: "ichimoku_standard", name: "Ichimoku Standard" },
  { id: "ichimoku_longterm", name: "Ichimoku Long-term" },
  { id: "volume_ma", name: "Volume MA" },
  { id: "obv", name: "OBV" },
  { id: "stochastic", name: "Stochastic" },
];

const SYMBOLS = ["VNINDEX", "FPT", "VCB", "HPG", "GAS", "VHM", "MWG", "SSI"];

function generateMockOHLCV(days: number): OHLCV[] {
  const data: OHLCV[] = [];
  let price = 1200;
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * 20;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    const volume = Math.floor(1000000 + Math.random() * 2000000);
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    data.push({
      date: date.toISOString().split("T")[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    price = close;
  }
  return data;
}

function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function emaCalc(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[0]);
    } else {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
  }
  return result;
}

function calculateIndicators(ohlcv: OHLCV[]): Indicators {
  const closes = ohlcv.map((d) => d.close);
  const highs = ohlcv.map((d) => d.high);
  const lows = ohlcv.map((d) => d.low);
  const volumes = ohlcv.map((d) => d.volume);

  // MA
  const ma5 = sma(closes, 5);
  const ma20 = sma(closes, 20);
  const ma50 = sma(closes, 50);

  // EMA
  const ema12 = emaCalc(closes, 12);
  const ema26 = emaCalc(closes, 26);

  // RSI
  const rsi14: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 14) { rsi14.push(NaN); continue; }
    let gains = 0, losses = 0;
    for (let j = i - 13; j <= i; j++) {
      const change = closes[j] - closes[j - 1];
      if (change > 0) gains += change;
      else losses += -change;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi14.push(100 - 100 / (1 + rs));
  }

  // MACD
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = emaCalc(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);

  // Bollinger
  const bbMiddle = sma(closes, 20);
  const bbUpper: number[] = [];
  const bbLower: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 19) { bbUpper.push(NaN); bbLower.push(NaN); continue; }
    const slice = closes.slice(i - 19, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / 20;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
    const std = Math.sqrt(variance);
    bbUpper.push(mean + 2 * std);
    bbLower.push(mean - 2 * std);
  }

  // Ichimoku Standard (9,17,26,26,26)
  const tenkanS = highs.map((_, i) => {
    if (i < 8) return NaN;
    const hh = Math.max(...highs.slice(i - 8, i + 1));
    const ll = Math.min(...lows.slice(i - 8, i + 1));
    return (hh + ll) / 2;
  });
  const kijunS = highs.map((_, i) => {
    if (i < 16) return NaN;
    const hh = Math.max(...highs.slice(i - 16, i + 1));
    const ll = Math.min(...lows.slice(i - 16, i + 1));
    return (hh + ll) / 2;
  });
  const senkouAS = tenkanS.map((v, i) => (isNaN(v) || isNaN(kijunS[i]) ? NaN : (v + kijunS[i]) / 2));
  const senkouBS = highs.map((_, i) => {
    if (i < 25) return NaN;
    const hh = Math.max(...highs.slice(i - 25, i + 1));
    const ll = Math.min(...lows.slice(i - 25, i + 1));
    return (hh + ll) / 2;
  });
  const chikouS = closes.map((v) => v);

  // Ichimoku Long-term (65,129,5,2,2)
  const tenkanL = highs.map((_, i) => {
    if (i < 64) return NaN;
    const hh = Math.max(...highs.slice(i - 64, i + 1));
    const ll = Math.min(...lows.slice(i - 64, i + 1));
    return (hh + ll) / 2;
  });
  const kijunL = highs.map((_, i) => {
    if (i < 128) return NaN;
    const hh = Math.max(...highs.slice(i - 128, i + 1));
    const ll = Math.min(...lows.slice(i - 128, i + 1));
    return (hh + ll) / 2;
  });
  const senkouAL = tenkanL.map((v, i) => (isNaN(v) || isNaN(kijunL[i]) ? NaN : (v + kijunL[i]) / 2));
  const senkouBL = highs.map((_, i) => {
    if (i < 1) return NaN;
    const hh = Math.max(...highs.slice(i - 1, i + 1));
    const ll = Math.min(...lows.slice(i - 1, i + 1));
    return (hh + ll) / 2;
  });
  const chikouL = closes.map((v) => v);

  // Volume MA
  const vma20 = sma(volumes, 20);

  // OBV
  const obv: number[] = [volumes[0]];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv.push(obv[i - 1] + volumes[i]);
    else if (closes[i] < closes[i - 1]) obv.push(obv[i - 1] - volumes[i]);
    else obv.push(obv[i - 1]);
  }

  // Stochastic
  const kLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 13) { kLine.push(NaN); continue; }
    const hh = Math.max(...highs.slice(i - 13, i + 1));
    const ll = Math.min(...lows.slice(i - 13, i + 1));
    kLine.push(((closes[i] - ll) / (hh - ll)) * 100);
  }
  const dLine = sma(kLine, 3);

  return {
    ma: { ma5, ma20, ma50 },
    ema: { ema12, ema26 },
    rsi: { rsi14 },
    macd: { macd: macdLine, signal: signalLine, histogram },
    bollinger: { upper: bbUpper, middle: bbMiddle, lower: bbLower },
    ichimoku_standard: { tenkan: tenkanS, kijun: kijunS, senkou_a: senkouAS, senkou_b: senkouBS, chikou: chikouS },
    ichimoku_longterm: { tenkan: tenkanL, kijun: kijunL, senkou_a: senkouAL, senkou_b: senkouBL, chikou: chikouL },
    volume_ma: { vma20 },
    obv: { obv },
    stochastic: { k: kLine, d: dLine },
  };
}

export default function ChartViewer() {
  const [symbol, setSymbol] = useState("VNINDEX");
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m">("1d");
  const [enabledIndicators, setEnabledIndicators] = useState<Record<string, boolean>>({
    ma: true,
    ema: false,
    rsi: true,
    macd: true,
    bollinger: false,
    ichimoku_standard: false,
    ichimoku_longterm: false,
    volume_ma: true,
    obv: false,
    stochastic: false,
  });
  const [ohlcv, setOhlcv] = useState<OHLCV[]>([]);
  const [indicators, setIndicators] = useState<Indicators>({});
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<ChartJS | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/charts/${symbol}?timeframe=${timeframe}`);
      if (res.ok) {
        const data = await res.json();
        setOhlcv(data.ohlcv || []);
        setIndicators(data.indicators || {});
      } else {
        throw new Error("API error");
      }
    } catch {
      const mock = generateMockOHLCV(timeframe === "1d" ? 60 : timeframe === "1w" ? 52 : 12);
      setOhlcv(mock);
      setIndicators(calculateIndicators(mock));
    }
    setLoading(false);
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleIndicator = (id: string) => {
    setEnabledIndicators((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const labels = ohlcv.map((d) => d.date);

  const mainDatasets: any[] = [];

  // Price line (close)
  mainDatasets.push({
    type: "line" as const,
    label: "Close",
    data: ohlcv.map((d) => d.close),
    borderColor: "#2563eb",
    backgroundColor: "#2563eb",
    borderWidth: 1.5,
    pointRadius: 0,
    tension: 0.1,
    yAxisID: "y",
  });

  if (enabledIndicators.ma && indicators.ma) {
    mainDatasets.push(
      { type: "line" as const, label: "MA5", data: indicators.ma.ma5, borderColor: "#FF6B6B", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "MA20", data: indicators.ma.ma20, borderColor: "#4ECDC4", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "MA50", data: indicators.ma.ma50, borderColor: "#45B7D1", borderWidth: 1, pointRadius: 0, yAxisID: "y" }
    );
  }

  if (enabledIndicators.ema && indicators.ema) {
    mainDatasets.push(
      { type: "line" as const, label: "EMA12", data: indicators.ema.ema12, borderColor: "#96CEB4", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "EMA26", data: indicators.ema.ema26, borderColor: "#FFEAA7", borderWidth: 1, pointRadius: 0, yAxisID: "y" }
    );
  }

  if (enabledIndicators.bollinger && indicators.bollinger) {
    mainDatasets.push(
      { type: "line" as const, label: "BB Upper", data: indicators.bollinger.upper, borderColor: "#FF9800", borderWidth: 1, pointRadius: 0, yAxisID: "y", borderDash: [4, 4] },
      { type: "line" as const, label: "BB Middle", data: indicators.bollinger.middle, borderColor: "#9E9E9E", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "BB Lower", data: indicators.bollinger.lower, borderColor: "#FF9800", borderWidth: 1, pointRadius: 0, yAxisID: "y", borderDash: [4, 4] }
    );
  }

  if (enabledIndicators.ichimoku_standard && indicators.ichimoku_standard) {
    const is = indicators.ichimoku_standard;
    mainDatasets.push(
      { type: "line" as const, label: "Tenkan", data: is.tenkan, borderColor: "#FF6B6B", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "Kijun", data: is.kijun, borderColor: "#4ECDC4", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "Senkou A", data: is.senkou_a, borderColor: "rgba(78,205,196,0.5)", borderWidth: 1, pointRadius: 0, fill: "+1", backgroundColor: "rgba(78,205,196,0.1)", yAxisID: "y" },
      { type: "line" as const, label: "Senkou B", data: is.senkou_b, borderColor: "rgba(255,107,107,0.5)", borderWidth: 1, pointRadius: 0, fill: "-1", backgroundColor: "rgba(255,107,107,0.1)", yAxisID: "y" },
      { type: "line" as const, label: "Chikou", data: is.chikou, borderColor: "#9B59B6", borderWidth: 1, pointRadius: 0, yAxisID: "y" }
    );
  }

  if (enabledIndicators.ichimoku_longterm && indicators.ichimoku_longterm) {
    const il = indicators.ichimoku_longterm;
    mainDatasets.push(
      { type: "line" as const, label: "LT Tenkan", data: il.tenkan, borderColor: "#E74C3C", borderWidth: 1.5, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "LT Kijun", data: il.kijun, borderColor: "#3498DB", borderWidth: 1.5, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "LT Senkou A", data: il.senkou_a, borderColor: "rgba(52,152,219,0.5)", borderWidth: 1, pointRadius: 0, fill: "+1", backgroundColor: "rgba(52,152,219,0.1)", yAxisID: "y" },
      { type: "line" as const, label: "LT Senkou B", data: il.senkou_b, borderColor: "rgba(231,76,60,0.5)", borderWidth: 1, pointRadius: 0, fill: "-1", backgroundColor: "rgba(231,76,60,0.1)", yAxisID: "y" },
      { type: "line" as const, label: "LT Chikou", data: il.chikou, borderColor: "#8E44AD", borderWidth: 1, pointRadius: 0, yAxisID: "y" }
    );
  }

  const mainChartData = { labels, datasets: mainDatasets };

  const volumeDatasets: any[] = [
    {
      type: "bar" as const,
      label: "Volume",
      data: ohlcv.map((d) => d.volume),
      backgroundColor: ohlcv.map((d) => (d.close >= d.open ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)")),
      yAxisID: "y",
    },
  ];

  if (enabledIndicators.volume_ma && indicators.volume_ma) {
    volumeDatasets.push({
      type: "line" as const,
      label: "VMA20",
      data: indicators.volume_ma.vma20,
      borderColor: "#FFA726",
      borderWidth: 1,
      pointRadius: 0,
      yAxisID: "y",
    });
  }

  const volumeChartData = { labels, datasets: volumeDatasets };

  const rsiDatasets: any[] = [];
  if (enabledIndicators.rsi && indicators.rsi) {
    rsiDatasets.push({
      type: "line" as const,
      label: "RSI14",
      data: indicators.rsi.rsi14,
      borderColor: "#DDA0DD",
      borderWidth: 1.5,
      pointRadius: 0,
      yAxisID: "y",
    });
  }
  if (enabledIndicators.stochastic && indicators.stochastic) {
    rsiDatasets.push(
      { type: "line" as const, label: "%K", data: indicators.stochastic.k, borderColor: "#5C6BC0", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "%D", data: indicators.stochastic.d, borderColor: "#FF7043", borderWidth: 1, pointRadius: 0, yAxisID: "y" }
    );
  }
  const rsiChartData = { labels, datasets: rsiDatasets };

  const macdDatasets: any[] = [];
  if (enabledIndicators.macd && indicators.macd) {
    macdDatasets.push(
      { type: "line" as const, label: "MACD", data: indicators.macd.macd, borderColor: "#00CED1", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      { type: "line" as const, label: "Signal", data: indicators.macd.signal, borderColor: "#FF6347", borderWidth: 1, pointRadius: 0, yAxisID: "y" },
      {
        type: "bar" as const,
        label: "Histogram",
        data: indicators.macd.histogram,
        backgroundColor: indicators.macd.histogram.map((v) => (v >= 0 ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)")),
        yAxisID: "y",
      }
    );
  }
  if (enabledIndicators.obv && indicators.obv) {
    macdDatasets.push({
      type: "line" as const,
      label: "OBV",
      data: indicators.obv.obv,
      borderColor: "#AB47BC",
      borderWidth: 1,
      pointRadius: 0,
      yAxisID: "y1",
    });
  }
  const macdChartData = { labels, datasets: macdDatasets };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: { legend: { display: true, labels: { boxWidth: 10, font: { size: 10 } } } },
    scales: {
      x: { ticks: { maxTicksLimit: 8, font: { size: 9 } }, grid: { display: false } },
    },
  };

  const addToReport = () => {
    const config = { symbol, timeframe, indicators: enabledIndicators };
    localStorage.setItem("vnstock-chart-config", JSON.stringify(config));
    alert("Chart config added to report!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Chart Viewer</h2>
          <p className="text-sm text-gray-500">Interactive technical analysis with 10 indicators</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-28">
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value as "1d" | "1w" | "1m")} className="w-24">
            <option value="1d">1D</option>
            <option value="1w">1W</option>
            <option value="1m">1M</option>
          </Select>
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={addToReport}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add to Report
          </Button>
        </div>
      </div>

      {/* Indicator Toggles */}
      <div className="flex flex-wrap gap-2">
        {INDICATOR_LIST.map((ind) => (
          <button
            key={ind.id}
            onClick={() => toggleIndicator(ind.id)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              enabledIndicators[ind.id]
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {enabledIndicators[ind.id] && <TrendingUp className="w-3 h-3 inline mr-1" />}
            {ind.name}
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            {symbol} — Price & Overlays
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-80">
            <Chart
              ref={chartRef as any}
              type="line"
              data={mainChartData}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  y: { position: "right" as const, ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Volume */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold">Volume</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-32">
            <Chart
              type="bar"
              data={volumeChartData}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  y: { position: "right" as const, ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* RSI / Stochastic */}
      {(enabledIndicators.rsi || enabledIndicators.stochastic) && (
        <Card className="border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold">Oscillators</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-32">
              <Chart
                type="line"
                data={rsiChartData}
                options={{
                  ...commonOptions,
                  scales: {
                    ...commonOptions.scales,
                    y: {
                      position: "right" as const,
                      min: 0,
                      max: 100,
                      ticks: { font: { size: 9 } },
                    },
                  },
                  plugins: {
                    ...commonOptions.plugins,
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* MACD / OBV */}
      {(enabledIndicators.macd || enabledIndicators.obv) && (
        <Card className="border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold">Momentum / Volume Flow</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-40">
              <Chart
                type="bar"
                data={macdChartData}
                options={{
                  ...commonOptions,
                  scales: {
                    ...commonOptions.scales,
                    y: { position: "right" as const, ticks: { font: { size: 9 } } },
                    ...(enabledIndicators.obv ? { y1: { position: "left" as const, ticks: { font: { size: 9 } } } } : {}),
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signal Summary */}
      <Card className="border bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Active Indicators:</span>
            {INDICATOR_LIST.filter((i) => enabledIndicators[i.id]).map((i) => (
              <Badge key={i.id} variant="outline" className="text-[10px] bg-white">
                {i.name}
              </Badge>
            ))}
            {INDICATOR_LIST.filter((i) => enabledIndicators[i.id]).length === 0 && (
              <span className="text-xs text-gray-400">None selected</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
