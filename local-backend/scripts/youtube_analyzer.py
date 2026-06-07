#!/usr/bin/env python3
"""
youtube_analyzer.py — YouTube transcript extraction with fallback chain
Priority: subtitle (youtube-transcript-api) → yt-dlp caption → Groq Whisper → Gemini audio
"""
import sys
import json
import re
import os
import subprocess
import tempfile
from urllib.parse import urlparse, parse_qs


def extract_video_id(url):
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    parsed = urlparse(url)
    if parsed.hostname in ('youtu.be', 'www.youtu.be'):
        return parsed.path.lstrip('/')
    if parsed.hostname in ('youtube.com', 'www.youtube.com', 'm.youtube.com'):
        qs = parse_qs(parsed.query)
        if 'v' in qs:
            return qs['v'][0]
    return None


def get_channel_handle(url):
    """Extract channel handle from URL."""
    match = re.search(r'youtube\.com/@([^?&/\s]+)', url)
    if match:
        return match.group(1)
    return None


def try_subtitle_api(video_id):
    """Try youtube-transcript-api first."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcripts = YouTubeTranscriptApi.get_transcript(video_id, languages=['vi', 'en'])
        text = ' '.join([t['text'] for t in transcripts])
        return {
            'method': 'subtitle',
            'language': 'vi',
            'text': text,
            'length_chars': len(text),
            'success': True
        }
    except Exception as e:
        return {'method': 'subtitle', 'success': False, 'error': str(e)}


def try_ytdlp_caption(video_id):
    """Fallback: yt-dlp caption extraction."""
    try:
        url = f'https://www.youtube.com/watch?v={video_id}'
        cmd = [
            'yt-dlp', '--skip-download', '--write-subs', '--sub-langs', 'vi,en',
            '--sub-format', 'json3', '--dump-single-json', url
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            subtitles = data.get('subtitles', {})
            for lang in ['vi', 'en']:
                if lang in subtitles:
                    return {
                        'method': 'yt-dlp',
                        'language': lang,
                        'text': f'[yt-dlp caption available for {lang}]',
                        'length_chars': 0,
                        'success': True,
                        'note': 'Caption metadata extracted, full text requires download'
                    }
        return {'method': 'yt-dlp', 'success': False, 'error': result.stderr[:500]}
    except Exception as e:
        return {'method': 'yt-dlp', 'success': False, 'error': str(e)}


def try_whisper(video_id):
    """Fallback: Groq Whisper audio transcription."""
    return {
        'method': 'whisper',
        'success': False,
        'error': 'Whisper fallback requires audio download + Groq API key (not implemented in standalone)'
    }


def try_gemini_audio(video_id):
    """Fallback: Gemini audio analysis."""
    return {
        'method': 'gemini_audio',
        'success': False,
        'error': 'Gemini audio fallback requires Gemini API key + audio file (not implemented in standalone)'
    }


def validate_transcript(transcript, duration_minutes=0):
    """Validate transcript quality vs video duration."""
    text = transcript.get('text', '')
    length = len(text)
    checks = {
        'length_ratio': length / max(duration_minutes, 1),
        'has_content': length > 100,
        'has_stock_terms': bool(re.search(r'\b(VNINDEX|FPT|VCB|HPG|GAS|VHM|MSN|SAB|GVR|MWG|PLX|VIC|TCB|MBB|ACB|VPB|SSB|TPB|cổ phiếu|thị trường|ngành|tăng trưởng|lợi nhuận|EPS|P/E|P/B|ROE)\b', text, re.IGNORECASE)),
        'has_paragraphs': '\n\n' in text or len(text) > 500
    }
    score = 0
    if checks['has_content']:
        score += 0.3
    if checks['has_stock_terms']:
        score += 0.3
    if checks['has_paragraphs']:
        score += 0.2
    if checks['length_ratio'] > 50:
        score += 0.2

    valid = score >= 0.5
    return {
        'valid': valid,
        'score': round(score, 2),
        'checks': checks,
        'action': 'accept' if valid else 'fallback_to_whisper'
    }


def extract_transcript(video_url, duration_minutes=0):
    """Run full fallback chain for a single video."""
    video_id = extract_video_id(video_url)
    if not video_id:
        return {'success': False, 'error': 'Cannot extract video ID', 'url': video_url}

    # Chain: subtitle → yt-dlp → whisper → gemini_audio
    methods = [
        ('subtitle', try_subtitle_api),
        ('yt-dlp', try_ytdlp_caption),
        ('whisper', try_whisper),
        ('gemini_audio', try_gemini_audio)
    ]

    for name, method_fn in methods:
        result = method_fn(video_id)
        if result.get('success'):
            validation = validate_transcript(result, duration_minutes)
            result['validation'] = validation
            result['video_id'] = video_id
            result['url'] = video_url
            if validation['valid']:
                return result
            # If invalid but we have text, still return with warning
            result['warning'] = f'Transcript validation failed (score={validation["score"]})'
            return result

    # All methods failed
    return {
        'success': False,
        'error': 'All transcript methods failed',
        'url': video_url,
        'video_id': video_id,
        'attempts': [name for name, _ in methods]
    }


def collect_channel_videos(channel_url, days=7, max_videos=10):
    """Collect recent videos from a channel."""
    try:
        cmd = [
            'yt-dlp', '--flat-playlist', '--dump-single-json',
            '--playlist-end', str(max_videos),
            '--dateafter', f'now-{days}days',
            channel_url
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            entries = data.get('entries', [])
            videos = []
            for entry in entries:
                if entry:
                    videos.append({
                        'id': entry.get('id'),
                        'title': entry.get('title'),
                        'url': f'https://www.youtube.com/watch?v={entry.get("id")}',
                        'duration': entry.get('duration', 0),
                        'upload_date': entry.get('upload_date')
                    })
            return videos
        return []
    except Exception as e:
        return [{'error': str(e), 'channel_url': channel_url}]


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python youtube_analyzer.py <command> [args]'}))
        sys.exit(1)

    command = sys.argv[1]

    if command == 'transcript':
        video_url = sys.argv[2] if len(sys.argv) > 2 else ''
        duration = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        result = extract_transcript(video_url, duration)
        print(json.dumps(result, ensure_ascii=False))

    elif command == 'channel':
        channel_url = sys.argv[2] if len(sys.argv) > 2 else ''
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 7
        max_videos = int(sys.argv[4]) if len(sys.argv) > 4 else 10
        videos = collect_channel_videos(channel_url, days, max_videos)
        print(json.dumps(videos, ensure_ascii=False))

    elif command == 'batch':
        # Read channel URLs from stdin or file
        channels = json.loads(sys.argv[2]) if len(sys.argv) > 2 else []
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 7
        max_per_channel = int(sys.argv[4]) if len(sys.argv) > 4 else 10

        all_videos = []
        all_transcripts = []
        failed = []

        for ch in channels:
            videos = collect_channel_videos(ch, days, max_per_channel)
            for v in videos:
                if 'error' in v:
                    failed.append({'channel': ch, 'error': v['error']})
                    continue
                all_videos.append(v)
                tx = extract_transcript(v['url'], v.get('duration', 0) // 60)
                if tx.get('success'):
                    all_transcripts.append({
                        'video_id': v['id'],
                        'title': v['title'],
                        'transcript': tx
                    })
                else:
                    failed.append({
                        'video_id': v['id'],
                        'title': v['title'],
                        'error': tx.get('error', 'Unknown')
                    })

        print(json.dumps({
            'videos': all_videos,
            'transcripts': all_transcripts,
            'failed': failed
        }, ensure_ascii=False))

    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))


if __name__ == '__main__':
    main()
