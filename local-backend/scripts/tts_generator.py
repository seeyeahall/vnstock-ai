#!/usr/bin/env python3
"""
tts_generator.py — Text-to-Speech generator
Supports: Google Cloud TTS (primary), Gemini TTS (fallback), edge-tts (local fallback)
"""
import sys
import json
import os
import tempfile
import subprocess


def generate_google_tts(text, voice='vi-VN-Neural2-A', output_path='report.mp3'):
    """Generate audio using Google Cloud TTS."""
    try:
        from google.cloud import texttospeech
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice_params = texttospeech.VoiceSelectionParams(
            language_code='vi-VN',
            name=voice
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,
            pitch=0.0
        )
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice_params, audio_config=audio_config
        )
        with open(output_path, 'wb') as f:
            f.write(response.audio_content)
        return {
            'success': True,
            'method': 'google_cloud_tts',
            'output_path': output_path,
            'duration_estimate': len(text) * 0.05  # ~0.05s per char
        }
    except Exception as e:
        return {'success': False, 'method': 'google_cloud_tts', 'error': str(e)}


def generate_gemini_tts(text, output_path='report.mp3'):
    """Generate audio using Gemini TTS (if available)."""
    try:
        import google.generativeai as genai
        # Gemini TTS is experimental; fallback to text generation with audio hint
        return {
            'success': False,
            'method': 'gemini_tts',
            'error': 'Gemini TTS not yet available via API. Use Google Cloud TTS or edge-tts.'
        }
    except Exception as e:
        return {'success': False, 'method': 'gemini_tts', 'error': str(e)}


def generate_edge_tts(text, voice='vi-VN-HoaiMyNeural', output_path='report.mp3'):
    """Generate audio using edge-tts (free, local)."""
    try:
        import asyncio
        import edge_tts

        async def _generate():
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)

        asyncio.run(_generate())
        return {
            'success': True,
            'method': 'edge_tts',
            'output_path': output_path,
            'duration_estimate': len(text) * 0.05
        }
    except Exception as e:
        return {'success': False, 'method': 'edge_tts', 'error': str(e)}


def generate_pyttsx3(text, output_path='report.mp3'):
    """Generate audio using pyttsx3 (offline, low quality)."""
    try:
        import pyttsx3
        engine = pyttsx3.init()
        # pyttsx3 outputs WAV, convert to MP3 if possible
        wav_path = output_path.replace('.mp3', '.wav')
        engine.save_to_file(text, wav_path)
        engine.runAndWait()
        # Try convert with ffmpeg
        try:
            subprocess.run(['ffmpeg', '-i', wav_path, '-y', output_path], check=True, capture_output=True)
            os.remove(wav_path)
        except Exception:
            output_path = wav_path
        return {
            'success': True,
            'method': 'pyttsx3',
            'output_path': output_path,
            'duration_estimate': len(text) * 0.05
        }
    except Exception as e:
        return {'success': False, 'method': 'pyttsx3', 'error': str(e)}


def generate_audio(text, output_path='report.mp3', preferred='google_cloud'):
    """Run TTS with fallback chain."""
    # Truncate very long text to avoid API limits (target 3-5 minutes)
    max_chars = 5000
    if len(text) > max_chars:
        text = text[:max_chars] + '...'

    methods = [
        ('google_cloud', generate_google_tts),
        ('gemini', generate_gemini_tts),
        ('edge_tts', generate_edge_tts),
        ('pyttsx3', generate_pyttsx3)
    ]

    # If preferred is specified, reorder
    if preferred and preferred != 'auto':
        methods = sorted(methods, key=lambda x: x[0] != preferred)

    for name, fn in methods:
        result = fn(text, output_path)
        if result.get('success'):
            return result

    return {
        'success': False,
        'error': 'All TTS methods failed',
        'attempts': [name for name, _ in methods]
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python tts_generator.py <command> [args]'}))
        sys.exit(1)

    command = sys.argv[1]

    if command == 'generate':
        text = sys.argv[2] if len(sys.argv) > 2 else ''
        output = sys.argv[3] if len(sys.argv) > 3 else 'report.mp3'
        preferred = sys.argv[4] if len(sys.argv) > 4 else 'google_cloud'
        result = generate_audio(text, output, preferred)
        print(json.dumps(result, ensure_ascii=False))

    elif command == 'batch':
        segments = json.loads(sys.argv[2]) if len(sys.argv) > 2 else []
        output_dir = sys.argv[3] if len(sys.argv) > 3 else './audio'
        os.makedirs(output_dir, exist_ok=True)
        results = []
        for i, seg in enumerate(segments):
            out = os.path.join(output_dir, f'segment_{i:03d}.mp3')
            r = generate_audio(seg['text'], out, seg.get('method', 'auto'))
            results.append(r)
        print(json.dumps(results, ensure_ascii=False))

    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))


if __name__ == '__main__':
    main()
