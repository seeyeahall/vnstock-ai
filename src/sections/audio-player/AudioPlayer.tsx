import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Volume2,
  Radio,
} from "lucide-react";

interface AudioPlayerProps {
  src?: string;
  transcript?: { time: number; text: string }[];
  title?: string;
}

export default function AudioPlayer({ src, transcript, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSegment, setActiveSegment] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (transcript) {
        const idx = transcript.findIndex((t, i) => {
          const next = transcript[i + 1];
          return audio.currentTime >= t.time && (!next || audio.currentTime < next.time);
        });
        if (idx !== -1) setActiveSegment(idx);
      }
    };
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [transcript]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  };

  const changeRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (t: number) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const demoSrc = src || "/data/audio/report.mp3";
  const demoTranscript = transcript || [
    { time: 0, text: "Chào mừng đến với báo cáo thị trường hôm nay." },
    { time: 5, text: "VNINDEX đóng cửa tăng 2.3% so với tuần trước." },
    { time: 12, text: "Ngành bất động sản dẫn dắt đà tăng với khối lượng giao dịch bùng nổ." },
    { time: 20, text: "Cổ phiếu FPT và VCB tiếp tục duy trì xu hướng tăng." },
    { time: 28, text: "Cảnh báo: Chỉ báo RSI đang ở vùng quá mua 72." },
    { time: 35, text: "Watchlist tuần tới: HPG, GAS, VHM." },
    { time: 42, text: "Kết thúc báo cáo. Chúc bạn đầu tư thành công!" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Audio Player</h2>
          <p className="text-sm text-gray-500">TTS Report Playback</p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
          <Radio className="w-3 h-3 mr-1" />
          TTS
        </Badge>
      </div>

      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold">{title || "Daily Market Report"}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <audio ref={audioRef} src={demoSrc} preload="metadata" className="hidden" />

          {/* Progress */}
          <div className="space-y-1">
            <Progress value={duration ? (currentTime / duration) * 100 : 0} className="h-2" />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => seek(-10)}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={togglePlay} className="bg-blue-600 hover:bg-blue-700">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => seek(10)}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={changeRate}>
              {playbackRate}x
            </Button>
          </div>

          {/* Volume hint */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <Volume2 className="w-3 h-3" />
            Use system volume control
          </div>

          {/* Transcript */}
          {demoTranscript && (
            <div className="border rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-1">
              {demoTranscript.map((seg, i) => (
                <div
                  key={i}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    i === activeSegment ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-600"
                  }`}
                >
                  <span className="text-[10px] text-gray-400 mr-2">{formatTime(seg.time)}</span>
                  {seg.text}
                </div>
              ))}
            </div>
          )}

          {/* Download */}
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => window.open(demoSrc, "_blank")}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Download MP3
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
