#!/usr/bin/env python3
"""
stock_fetcher.py — Fetch stock OHLCV and calculate 10 technical indicators
Supports: VNINDEX, FPT, VCB, HPG, GAS, VHM, MSN, SAB, GVR, MWG, PLX, VIC, TCB, MBB, ACB, VPB, SSB, TPB
"""
import sys
import json
import math
from datetime import datetime, timedelta


def fetch_ohlcv_mock(symbol, days=30):
    """Mock OHLCV data generator for testing. Replace with VNStock API call."""
    import random
    random.seed(hash(symbol) % 10000)
    base_price = {
        'VNINDEX': 1270, 'FPT': 103, 'VCB': 92, 'HPG': 26, 'GAS': 68,
        'VHM': 58, 'MSN': 72, 'SAB': 185, 'GVR': 22, 'MWG': 68,
        'PLX': 42, 'VIC': 45, 'TCB': 28, 'MBB': 22, 'ACB': 24,
        'VPB': 18, 'SSB': 32, 'TPB': 20
    }.get(symbol, 100)

    ohlcv = []
    price = base_price
    for i in range(days, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        change = random.uniform(-0.03, 0.03)
        open_p = round(price * (1 + random.uniform(-0.01, 0.01)), 2)
        close_p = round(price * (1 + change), 2)
        high_p = round(max(open_p, close_p) * (1 + random.uniform(0, 0.02)), 2)
        low_p = round(min(open_p, close_p) * (1 - random.uniform(0, 0.02)), 2)
        volume = int(random.uniform(0.5, 3.0) * 1000000)
        ohlcv.append({
            'date': date, 'open': open_p, 'high': high_p,
            'low': low_p, 'close': close_p, 'volume': volume
        })
        price = close_p
    return ohlcv


def sma(data, period):
    """Simple Moving Average."""
    closes = [d['close'] for d in data]
    result = []
    for i in range(len(closes)):
        if i < period - 1:
            result.append(None)
        else:
            result.append(round(sum(closes[i - period + 1:i + 1]) / period, 2))
    return result


def ema(data, period):
    """Exponential Moving Average."""
    closes = [d['close'] for d in data]
    k = 2 / (period + 1)
    result = []
    for i in range(len(closes)):
        if i < period - 1:
            result.append(None)
        elif i == period - 1:
            result.append(round(sum(closes[:period]) / period, 2))
        else:
            result.append(round(closes[i] * k + result[-1] * (1 - k), 2))
    return result


def rsi(data, period=14):
    """Relative Strength Index."""
    closes = [d['close'] for d in data]
    gains, losses = [], []
    for i in range(1, len(closes)):
        change = closes[i] - closes[i - 1]
        gains.append(max(change, 0))
        losses.append(abs(min(change, 0)))

    result = [None] * (period + 1)
    if len(gains) < period:
        return result + [None] * (len(closes) - len(result))

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        if avg_loss == 0:
            result.append(100.0)
        else:
            rs = avg_gain / avg_loss
            result.append(round(100 - (100 / (1 + rs)), 2))

    # Pad initial None values
    while len(result) < len(closes):
        result.insert(0, None)
    return result[-len(closes):]


def macd(data, fast=12, slow=26, signal=9):
    """MACD indicator."""
    ema_fast = ema(data, fast)
    ema_slow = ema(data, slow)
    macd_line = []
    for i in range(len(ema_fast)):
        if ema_fast[i] is None or ema_slow[i] is None:
            macd_line.append(None)
        else:
            macd_line.append(round(ema_fast[i] - ema_slow[i], 2))

    # Signal line = EMA of MACD line
    signal_line = [None] * (slow - 1)
    valid_macd = [v for v in macd_line if v is not None]
    if len(valid_macd) >= signal:
        sig_ema = sum(valid_macd[:signal]) / signal
        signal_line.append(round(sig_ema, 2))
        for i in range(signal, len(valid_macd)):
            k = 2 / (signal + 1)
            sig_ema = valid_macd[i] * k + sig_ema * (1 - k)
            signal_line.append(round(sig_ema, 2))

    while len(signal_line) < len(macd_line):
        signal_line.insert(0, None)

    histogram = []
    for i in range(len(macd_line)):
        if macd_line[i] is None or signal_line[i] is None:
            histogram.append(None)
        else:
            histogram.append(round(macd_line[i] - signal_line[i], 2))

    return {'macd': macd_line, 'signal': signal_line, 'histogram': histogram}


def bollinger(data, period=20, std_dev=2):
    """Bollinger Bands."""
    closes = [d['close'] for d in data]
    middle = sma(data, period)
    upper, lower = [], []
    for i in range(len(closes)):
        if i < period - 1:
            upper.append(None)
            lower.append(None)
        else:
            window = closes[i - period + 1:i + 1]
            mean = sum(window) / period
            variance = sum((x - mean) ** 2 for x in window) / period
            std = math.sqrt(variance)
            upper.append(round(mean + std_dev * std, 2))
            lower.append(round(mean - std_dev * std, 2))
    return {'upper': upper, 'middle': middle, 'lower': lower}


def ichimoku(data, tenkan=9, kijun=17, senkou_b=26, senkou_span=26, chikou_span=26):
    """Ichimoku Cloud indicator."""
    highs = [d['high'] for d in data]
    lows = [d['low'] for d in data]
    closes = [d['close'] for d in data]
    n = len(data)

    def hl2(period, idx):
        if idx < period - 1:
            return None
        h = max(highs[idx - period + 1:idx + 1])
        l = min(lows[idx - period + 1:idx + 1])
        return (h + l) / 2

    tenkan_line = [hl2(tenkan, i) for i in range(n)]
    kijun_line = [hl2(kijun, i) for i in range(n)]

    senkou_a = []
    for i in range(n):
        if tenkan_line[i] is None or kijun_line[i] is None:
            senkou_a.append(None)
        else:
            senkou_a.append(round((tenkan_line[i] + kijun_line[i]) / 2, 2))

    senkou_b = [hl2(senkou_b, i) for i in range(n)]
    chikou = [closes[i] if i >= chikou_span else None for i in range(n)]

    # Shift senkou lines forward
    senkou_a_shifted = [None] * senkou_span + senkou_a[:-senkou_span] if n > senkou_span else [None] * n
    senkou_b_shifted = [None] * senkou_span + senkou_b[:-senkou_span] if n > senkou_span else [None] * n

    return {
        'tenkan': [round(v, 2) if v else None for v in tenkan_line],
        'kijun': [round(v, 2) if v else None for v in kijun_line],
        'senkou_a': [round(v, 2) if v else None for v in senkou_a_shifted],
        'senkou_b': [round(v, 2) if v else None for v in senkou_b_shifted],
        'chikou': [round(v, 2) if v else None for v in chikou]
    }


def volume_ma(data, period=20):
    """Volume Moving Average."""
    volumes = [d['volume'] for d in data]
    result = []
    for i in range(len(volumes)):
        if i < period - 1:
            result.append(None)
        else:
            result.append(round(sum(volumes[i - period + 1:i + 1]) / period, 0))
    return result


def obv(data):
    """On-Balance Volume."""
    volumes = [d['volume'] for d in data]
    closes = [d['close'] for d in data]
    result = [volumes[0]]
    for i in range(1, len(closes)):
        if closes[i] > closes[i - 1]:
            result.append(result[-1] + volumes[i])
        elif closes[i] < closes[i - 1]:
            result.append(result[-1] - volumes[i])
        else:
            result.append(result[-1])
    return result


def stochastic(data, k_period=14, d_period=3, smooth=3):
    """Stochastic Oscillator."""
    highs = [d['high'] for d in data]
    lows = [d['low'] for d in data]
    closes = [d['close'] for d in data]
    n = len(data)

    k_values = []
    for i in range(n):
        if i < k_period - 1:
            k_values.append(None)
        else:
            lowest = min(lows[i - k_period + 1:i + 1])
            highest = max(highs[i - k_period + 1:i + 1])
            range_val = highest - lowest
            if range_val == 0:
                k_values.append(50.0)
            else:
                k_values.append(round((closes[i] - lowest) / range_val * 100, 2))

    # %D = SMA of %K
    d_values = []
    for i in range(n):
        if i < k_period + d_period - 2:
            d_values.append(None)
        else:
            window = [v for v in k_values[i - d_period + 1:i + 1] if v is not None]
            if window:
                d_values.append(round(sum(window) / len(window), 2))
            else:
                d_values.append(None)

    return {'k': k_values, 'd': d_values}


def calculate_all_indicators(ohlcv):
    """Calculate all 10 indicators."""
    return {
        'ma': {
            'ma5': sma(ohlcv, 5),
            'ma20': sma(ohlcv, 20),
            'ma50': sma(ohlcv, 50)
        },
        'ema': {
            'ema12': ema(ohlcv, 12),
            'ema26': ema(ohlcv, 26)
        },
        'rsi': {
            'rsi14': rsi(ohlcv, 14)
        },
        'macd': macd(ohlcv, 12, 26, 9),
        'bollinger': bollinger(ohlcv, 20, 2),
        'ichimoku_standard': ichimoku(ohlcv, 9, 17, 26, 26, 26),
        'ichimoku_longterm': ichimoku(ohlcv, 65, 129, 5, 2, 2),
        'volume_ma': {
            'volume_ma20': volume_ma(ohlcv, 20)
        },
        'obv': {
            'obv': obv(ohlcv)
        },
        'stochastic': stochastic(ohlcv, 14, 3, 3)
    }


def aggregate_signals(indicators, last_close):
    """Aggregate buy/sell signals from all indicators."""
    signals = {}

    # MA
    ma5 = [v for v in indicators['ma']['ma5'] if v is not None]
    ma20 = [v for v in indicators['ma']['ma20'] if v is not None]
    if ma5 and ma20:
        signals['ma'] = 'bullish' if ma5[-1] > ma20[-1] else 'bearish'
    else:
        signals['ma'] = 'neutral'

    # RSI
    rsi_vals = [v for v in indicators['rsi']['rsi14'] if v is not None]
    if rsi_vals:
        r = rsi_vals[-1]
        signals['rsi'] = 'overbought' if r > 70 else 'oversold' if r < 30 else 'neutral'
    else:
        signals['rsi'] = 'neutral'

    # MACD
    macd_hist = [v for v in indicators['macd']['histogram'] if v is not None]
    if macd_hist:
        signals['macd'] = 'bullish' if macd_hist[-1] > 0 else 'bearish'
    else:
        signals['macd'] = 'neutral'

    # Bollinger
    bb = indicators['bollinger']
    upper = [v for v in bb['upper'] if v is not None]
    lower = [v for v in bb['lower'] if v is not None]
    if upper and lower:
        if last_close > upper[-1]:
            signals['bollinger'] = 'overbought'
        elif last_close < lower[-1]:
            signals['bollinger'] = 'oversold'
        else:
            signals['bollinger'] = 'neutral'
    else:
        signals['bollinger'] = 'neutral'

    # Ichimoku
    ichi = indicators['ichimoku_standard']
    senkou_a = [v for v in ichi['senkou_a'] if v is not None]
    if senkou_a and last_close > senkou_a[-1]:
        signals['ichimoku'] = 'bullish'
    else:
        signals['ichimoku'] = 'bearish'

    # Volume
    vol_ma = [v for v in indicators['volume_ma']['volume_ma20'] if v is not None]
    # Volume signal requires current volume, skip for now
    signals['volume'] = 'confirming'  # placeholder

    # Stochastic
    stoch = indicators['stochastic']
    k_vals = [v for v in stoch['k'] if v is not None]
    if k_vals:
        k = k_vals[-1]
        signals['stochastic'] = 'overbought' if k > 80 else 'oversold' if k < 20 else 'neutral'
    else:
        signals['stochastic'] = 'neutral'

    bullish = sum(1 for s in signals.values() if s in ('bullish', 'confirming', 'oversold'))
    bearish = sum(1 for s in signals.values() if s in ('bearish', 'overbought'))
    total = len(signals)
    strength = max(bullish, bearish) / total if total else 0
    direction = 'bullish' if bullish > bearish else 'bearish' if bearish > bullish else 'neutral'

    return {
        'signals': signals,
        'strength': round(strength, 2),
        'direction': direction,
        'bullish_count': bullish,
        'bearish_count': bearish,
        'total': total
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python stock_fetcher.py <command> [args]'}))
        sys.exit(1)

    command = sys.argv[1]

    if command == 'fetch':
        symbol = sys.argv[2] if len(sys.argv) > 2 else 'VNINDEX'
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 30
        ohlcv = fetch_ohlcv_mock(symbol, days)
        print(json.dumps({'symbol': symbol, 'ohlcv': ohlcv}, ensure_ascii=False))

    elif command == 'indicators':
        symbol = sys.argv[2] if len(sys.argv) > 2 else 'VNINDEX'
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        ohlcv = fetch_ohlcv_mock(symbol, days)
        indicators = calculate_all_indicators(ohlcv)
        last_close = ohlcv[-1]['close'] if ohlcv else 0
        signals = aggregate_signals(indicators, last_close)
        print(json.dumps({
            'symbol': symbol,
            'ohlcv': ohlcv,
            'indicators': indicators,
            'signals': signals
        }, ensure_ascii=False))

    elif command == 'batch':
        symbols = json.loads(sys.argv[2]) if len(sys.argv) > 2 else ['VNINDEX']
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 30
        results = {}
        for sym in symbols:
            ohlcv = fetch_ohlcv_mock(sym, days)
            indicators = calculate_all_indicators(ohlcv)
            last_close = ohlcv[-1]['close'] if ohlcv else 0
            signals = aggregate_signals(indicators, last_close)
            results[sym] = {
                'ohlcv': ohlcv,
                'indicators': indicators,
                'signals': signals
            }
        print(json.dumps(results, ensure_ascii=False))

    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))


if __name__ == '__main__':
    main()
