#!/usr/bin/env python3
"""
chart_generator.py — Generate technical chart images with indicators
Uses matplotlib + mplfinance for candlestick charts
"""
import sys
import json
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime


def generate_candlestick_chart(ohlcv, symbol, indicators=None, output_path='chart.png'):
    """Generate a candlestick chart with indicators overlay."""
    try:
        import mplfinance as mpf
    except ImportError:
        mpf = None

    if mpf is None:
        return generate_simple_chart(ohlcv, symbol, indicators, output_path)

    # Convert to DataFrame
    import pandas as pd
    df = pd.DataFrame(ohlcv)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    df.rename(columns={'open': 'Open', 'high': 'High', 'low': 'Low', 'close': 'Close', 'volume': 'Volume'}, inplace=True)

    # Prepare overlays
    apds = []
    if indicators:
        ma = indicators.get('ma', {})
        for period, color in zip([5, 20, 50], ['#FF6B6B', '#4ECDC4', '#45B7D1']):
            key = f'ma{period}'
            if key in ma:
                vals = ma[key]
                # Pad None values
                s = pd.Series(vals, index=df.index)
                apds.append(mpf.make_addplot(s, color=color, width=1.2, label=f'MA{period}'))

        # Bollinger
        bb = indicators.get('bollinger', {})
        if bb.get('upper'):
            for key, color in [('upper', '#FF9800'), ('middle', '#9E9E9E'), ('lower', '#FF9800')]:
                vals = bb.get(key, [])
                if vals:
                    s = pd.Series(vals, index=df.index)
                    apds.append(mpf.make_addplot(s, color=color, width=1.0))

    fig, axes = mpf.plot(
        df, type='candle', style='charles',
        title=f'{symbol} — Technical Chart',
        ylabel='Price',
        volume=True,
        addplot=apds if apds else None,
        figsize=(14, 10),
        returnfig=True,
        savefig=dict(fname=output_path, dpi=150, bbox_inches='tight')
    )
    plt.close(fig)
    return {'success': True, 'output_path': output_path, 'method': 'mplfinance'}


def generate_simple_chart(ohlcv, symbol, indicators=None, output_path='chart.png'):
    """Fallback simple chart using matplotlib only."""
    dates = [datetime.strptime(d['date'], '%Y-%m-%d') for d in ohlcv]
    closes = [d['close'] for d in ohlcv]
    volumes = [d['volume'] for d in ohlcv]

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), gridspec_kw={'height_ratios': [3, 1]})

    # Price line
    ax1.plot(dates, closes, color='#2196F3', linewidth=1.5, label='Close')

    # Indicators
    if indicators:
        ma = indicators.get('ma', {})
        for period, color in zip([5, 20, 50], ['#FF6B6B', '#4ECDC4', '#45B7D1']):
            key = f'ma{period}'
            if key in ma:
                vals = ma[key]
                ax1.plot(dates, vals, color=color, linewidth=1.2, label=f'MA{period}')

        bb = indicators.get('bollinger', {})
        if bb.get('upper'):
            ax1.plot(dates, bb['upper'], color='#FF9800', linewidth=1.0, alpha=0.7, label='BB Upper')
            ax1.plot(dates, bb['lower'], color='#FF9800', linewidth=1.0, alpha=0.7, label='BB Lower')
            ax1.fill_between(dates, bb['upper'], bb['lower'], alpha=0.1, color='#FF9800')

    ax1.set_title(f'{symbol} — Technical Chart', fontsize=14, fontweight='bold')
    ax1.set_ylabel('Price')
    ax1.legend(loc='upper left')
    ax1.grid(True, alpha=0.3)

    # Volume
    ax2.bar(dates, volumes, color='#607D8B', alpha=0.7)
    ax2.set_ylabel('Volume')
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    return {'success': True, 'output_path': output_path, 'method': 'matplotlib'}


def generate_indicator_panel(ohlcv, indicators, symbol, output_path='indicators.png'):
    """Generate RSI + MACD + Stochastic panel."""
    dates = [datetime.strptime(d['date'], '%Y-%m-%d') for d in ohlcv]

    fig, axes = plt.subplots(3, 1, figsize=(14, 8))

    # RSI
    rsi_vals = indicators.get('rsi', {}).get('rsi14', [])
    if rsi_vals:
        axes[0].plot(dates, rsi_vals, color='#DDA0DD', linewidth=1.5)
        axes[0].axhline(70, color='red', linestyle='--', alpha=0.5)
        axes[0].axhline(30, color='green', linestyle='--', alpha=0.5)
        axes[0].set_title('RSI(14)')
        axes[0].set_ylim(0, 100)
        axes[0].grid(True, alpha=0.3)

    # MACD
    macd = indicators.get('macd', {})
    if macd.get('macd'):
        axes[1].plot(dates, macd['macd'], color='#00CED1', linewidth=1.5, label='MACD')
        axes[1].plot(dates, macd['signal'], color='#FF6347', linewidth=1.5, label='Signal')
        hist = macd.get('histogram', [])
        if hist:
            colors = ['#26A69A' if h and h > 0 else '#EF5350' for h in hist]
            axes[1].bar(dates, hist, color=colors, alpha=0.7)
        axes[1].set_title('MACD(12,26,9)')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)

    # Stochastic
    stoch = indicators.get('stochastic', {})
    if stoch.get('k'):
        axes[2].plot(dates, stoch['k'], color='#5C6BC0', linewidth=1.5, label='%K')
        axes[2].plot(dates, stoch['d'], color='#FF7043', linewidth=1.5, label='%D')
        axes[2].axhline(80, color='red', linestyle='--', alpha=0.5)
        axes[2].axhline(20, color='green', linestyle='--', alpha=0.5)
        axes[2].set_title('Stochastic(14,3,3)')
        axes[2].legend()
        axes[2].grid(True, alpha=0.3)

    plt.suptitle(f'{symbol} — Indicators', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    return {'success': True, 'output_path': output_path}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python chart_generator.py <command> [args]'}))
        sys.exit(1)

    command = sys.argv[1]

    if command == 'candlestick':
        data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else '{}'
        symbol = data.get('symbol', 'VNINDEX')
        ohlcv = data.get('ohlcv', [])
        indicators = data.get('indicators')
        output = sys.argv[3] if len(sys.argv) > 3 else 'chart.png'
        result = generate_candlestick_chart(ohlcv, symbol, indicators, output)
        print(json.dumps(result, ensure_ascii=False))

    elif command == 'indicators':
        data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else '{}'
        symbol = data.get('symbol', 'VNINDEX')
        ohlcv = data.get('ohlcv', [])
        indicators = data.get('indicators', {})
        output = sys.argv[3] if len(sys.argv) > 3 else 'indicators.png'
        result = generate_indicator_panel(ohlcv, indicators, symbol, output)
        print(json.dumps(result, ensure_ascii=False))

    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))


if __name__ == '__main__':
    main()
