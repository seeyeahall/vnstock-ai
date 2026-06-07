import { useState, useEffect, useCallback } from "react";
import type { AgentTask, RecoveryAction } from "@/types/modules";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Target,
  Calendar,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Clock,
  Zap,
  Shield,
} from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { API_BASE } from "@/services/api";

const statusIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  failed: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  running: { icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50" },
  pending: { icon: Clock, color: "text-gray-500", bg: "bg-gray-50" },
  retrying: { icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
};

export default function ExecutiveBrainConsole() {
  const { isRunning, logs } = useSystemConfig();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [recovery, setRecovery] = useState<RecoveryAction[]>([]);
  const [provider, setProvider] = useState<string>("Gemini");
  const [systemStats, setSystemStats] = useState({ cpu: 23, ramUsed: 8.2, ramTotal: 16, goal: "Morning Report", schedule: "07:00, 20:00" });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workflow/status`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setRecovery(data.recovery || []);
        setProvider(data.current_provider || "Gemini");
        if (data.system) setSystemStats(data.system);
      }
    } catch {
      // Keep existing data or fallback to empty
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  return (
    <div className="space-y-4">
      {/* Executive Brain Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            Executive Brain Console
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-[10px]">
            <Zap className="w-2.5 h-2.5 mr-1" />
            9Router: {provider}
          </Badge>
          {isRunning && (
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-300 animate-pulse text-[10px]"
            >
              <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Goal</div>
              <div className="text-xs font-semibold">{systemStats.goal}</div>
            </div>
          </div>
        </Card>
        <Card className="border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Schedule</div>
              <div className="text-xs font-semibold">{systemStats.schedule}</div>
            </div>
          </div>
        </Card>
        <Card className="border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500">CPU</div>
              <div className="text-xs font-semibold">{systemStats.cpu}%</div>
            </div>
          </div>
        </Card>
        <Card className="border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500">RAM</div>
              <div className="text-xs font-semibold">{systemStats.ramUsed}/{systemStats.ramTotal} GB</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Tasks */}
        <Card className="border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Agent Swarm Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {tasks.length === 0 ? (
              <div className="text-xs text-gray-400 italic p-2">No active tasks. Start a workflow to see agents.</div>
            ) : (
              tasks.map((task) => {
                const status = statusIcons[task.status] || statusIcons.pending;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-full ${status.bg} flex items-center justify-center shrink-0`}
                    >
                      <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">
                          {task.agent_name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] h-4 px-1 ${status.bg} ${status.color}`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                      <Progress value={task.progress} className="h-1 mt-1" />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-gray-400">
                          {task.started_at}
                          {task.completed_at && ` → ${task.completed_at}`}
                        </span>
                        <span className="text-[9px] font-medium">
                          {task.progress}%
                        </span>
                      </div>
                      {task.error && (
                        <div className="text-[9px] text-red-500 mt-1">{task.error}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recovery Events */}
        <Card className="border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              Recovery Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recovery.length === 0 ? (
              <div className="text-xs text-gray-400 italic p-2">No recovery events. System is healthy.</div>
            ) : (
              recovery.map((rec) => (
                <div
                  key={rec.id}
                  className="border rounded-lg p-3 bg-amber-50/30 border-amber-200 mb-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        rec.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : rec.status === "failed"
                          ? "bg-red-50 text-red-700 border-red-300"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}
                    >
                      {rec.status}
                    </Badge>
                    <span className="text-[9px] text-gray-400">
                      {rec.timestamp}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-medium">Error:</span>{" "}
                    {rec.error_source}
                  </div>
                  <div className="text-[10px] text-gray-500 mb-2">
                    {rec.error_message}
                  </div>
                  <div className="text-[10px] text-gray-500 mb-1">Fallback chain:</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {rec.fallback_chain.map((fb, i) => (
                      <span key={fb} className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={`text-[9px] h-4 px-1 ${
                            i <= rec.current_fallback_index
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {fb}
                        </Badge>
                        {i < rec.fallback_chain.length - 1 && (
                          <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Fallback Chain Visualization */}
            <div className="mt-4 border rounded-lg p-3 bg-gray-50">
              <div className="text-[10px] font-medium text-gray-700 mb-2">
                AI Provider Fallback Chain
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {["Gemini", "Groq", "OpenRouter", "Ollama"].map(
                  (p, i) => (
                    <span key={p} className="flex items-center gap-1">
                      <div
                        className={`px-2 py-1 rounded text-[10px] font-medium border ${
                          p === provider
                            ? "bg-purple-50 border-purple-300 text-purple-700"
                            : "bg-gray-50 border-gray-200 text-gray-500"
                        }`}
                      >
                        {p}
                      </div>
                      {i < 3 && (
                        <span className="text-gray-400 text-[10px]">→</span>
                      )}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Self-Healing Status */}
            <div className="mt-3 border rounded-lg p-3 bg-emerald-50/30 border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-medium text-emerald-700">
                  Self-Healing Engine
                </span>
              </div>
              <div className="space-y-1 text-[10px] text-gray-600">
                <div className="flex justify-between">
                  <span>Auto-retry</span>
                  <span className="text-emerald-600 font-medium">ON</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Fallback</span>
                  <span className="text-emerald-600 font-medium">ON</span>
                </div>
                <div className="flex justify-between">
                  <span>State Resume</span>
                  <span className="text-emerald-600 font-medium">ON</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Prediction</span>
                  <span className="text-emerald-600 font-medium">ON</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Logs */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-green-600" />
            System Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="bg-gray-950 rounded-lg p-3 font-mono text-[11px] h-64 overflow-y-auto space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">Waiting for workflow execution...</div>
            ) : (
              logs.map((log, i) => {
                const isError = log.toLowerCase().includes("error") || log.toLowerCase().includes("fail");
                const isSuccess = log.toLowerCase().includes("ok") || log.toLowerCase().includes("pass");
                const isAgent = log.includes("AGENT");
                return (
                  <div
                    key={i}
                    className={`${
                      isError
                        ? "text-red-400"
                        : isSuccess
                        ? "text-emerald-400"
                        : isAgent
                        ? "text-blue-400"
                        : "text-gray-300"
                    }`}
                  >
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
