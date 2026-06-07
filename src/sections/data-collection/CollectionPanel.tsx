import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  BarChart3,
  FileText,
} from "lucide-react";
import { API_BASE } from "@/services/api";

interface AgentTask {
  id: string;
  agent_name: string;
  status: "pending" | "running" | "success" | "failed";
  progress: number;
  current_item?: number;
  total_items?: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

const AGENT_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  youtube: { icon: Radio, color: "text-red-500", label: "YouTube Collector" },
  stock: { icon: BarChart3, color: "text-blue-500", label: "Stock Data Fetcher" },
  news: { icon: FileText, color: "text-amber-500", label: "RSS News Collector" },
  web: { icon: Globe, color: "text-emerald-500", label: "Web Scraper" },
};

const statusConfig: Record<string, { badge: string; icon: React.ElementType }> = {
  pending: { badge: "bg-gray-50 text-gray-600 border-gray-300", icon: Clock },
  running: { badge: "bg-blue-50 text-blue-600 border-blue-300 animate-pulse", icon: RefreshCw },
  success: { badge: "bg-emerald-50 text-emerald-600 border-emerald-300", icon: CheckCircle2 },
  failed: { badge: "bg-red-50 text-red-600 border-red-300", icon: AlertTriangle },
};

export default function CollectionPanel() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent-tasks`);
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          setTasks(data.tasks);
          setError(null);
        }
      } else {
        // Fallback mock data for development
        setTasks([
          { id: "1", agent_name: "youtube", status: "running", progress: 65, current_item: 38, total_items: 58, started_at: "07:00:02" },
          { id: "2", agent_name: "stock", status: "success", progress: 100, current_item: 10, total_items: 10, started_at: "07:00:02", completed_at: "07:00:15" },
          { id: "3", agent_name: "news", status: "running", progress: 45, current_item: 22, total_items: 50, started_at: "07:00:02" },
          { id: "4", agent_name: "web", status: "pending", progress: 0, started_at: "07:00:02" },
        ]);
      }
    } catch {
      setError("Cannot connect to API. Showing mock data.");
      setTasks([
        { id: "1", agent_name: "youtube", status: "running", progress: 65, current_item: 38, total_items: 58, started_at: "07:00:02" },
        { id: "2", agent_name: "stock", status: "success", progress: 100, current_item: 10, total_items: 10, started_at: "07:00:02", completed_at: "07:00:15" },
        { id: "3", agent_name: "news", status: "running", progress: 45, current_item: 22, total_items: 50, started_at: "07:00:02" },
        { id: "4", agent_name: "web", status: "pending", progress: 0, started_at: "07:00:02" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(() => {
      if (!paused) fetchTasks();
    }, 2000);
    return () => clearInterval(id);
  }, [fetchTasks, paused]);

  const controlAgent = async (action: "pause" | "resume" | "cancel") => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent-tasks/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === "pause") setPaused(true);
        if (action === "resume") setPaused(false);
      }
    } catch {
      // Local state only
      if (action === "pause") setPaused(true);
      if (action === "resume") setPaused(false);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Data Collection Panel</h2>
          <p className="text-sm text-gray-500">Real-time Agent Swarm progress</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => controlAgent("pause")} disabled={loading || paused}>
            <Pause className="w-3.5 h-3.5 mr-1" />
            Pause
          </Button>
          <Button size="sm" variant="outline" onClick={() => controlAgent("resume")} disabled={loading || !paused}>
            <Play className="w-3.5 h-3.5 mr-1" />
            Resume
          </Button>
          <Button size="sm" variant="destructive" onClick={() => controlAgent("cancel")} disabled={loading}>
            <Square className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
        </div>
      </div>

      {error && (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {error}
        </Badge>
      )}

      {paused && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          <Pause className="w-3 h-3 mr-1" />
          Paused
        </Badge>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const meta = AGENT_META[task.agent_name] || { icon: Globe, color: "text-gray-500", label: task.agent_name };
          const Icon = meta.icon;
          const cfg = statusConfig[task.status];
          const StatusIcon = cfg.icon;

          return (
            <Card key={task.id} className="border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{meta.label}</div>
                      <div className="text-[10px] text-gray-400">
                        {task.started_at}
                        {task.completed_at && ` → ${task.completed_at}`}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${cfg.badge}`}>
                    <StatusIcon className={`w-3 h-3 mr-0.5 ${task.status === "running" ? "animate-spin" : ""}`} />
                    {task.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      {task.current_item !== undefined && task.total_items !== undefined
                        ? `${task.current_item} / ${task.total_items} items`
                        : "Processing..."}
                    </span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                </div>

                {task.error && (
                  <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {task.error}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
