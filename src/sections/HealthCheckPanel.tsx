import { useState } from "react";
import type { HealthCheckResult } from "@/types/modules";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Shield,
  HeartPulse,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Brain,
  Zap,
  Router,
  Database,
  Globe,
  Send,
  FilePlus,
  Activity,
  Server,
} from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";

const initialServices: HealthCheckResult[] = [
  { service: "Gemini API", status: "healthy", latency_ms: 420, message: "OK - quota 78%", last_checked: "2m ago" },
  { service: "Groq API", status: "healthy", latency_ms: 85, message: "OK - quota 92%", last_checked: "2m ago" },
  { service: "OpenRouter API", status: "healthy", latency_ms: 310, message: "OK - quota 65%", last_checked: "2m ago" },
  { service: "Ollama (Local)", status: "warning", latency_ms: 2500, message: "Slow response", last_checked: "5m ago" },
  { service: "PostgreSQL", status: "healthy", latency_ms: 5, message: "OK - 142MB data", last_checked: "1m ago" },
  { service: "Qdrant", status: "healthy", latency_ms: 12, message: "OK - 2.3K vectors", last_checked: "1m ago" },
  { service: "SQLite", status: "healthy", latency_ms: 2, message: "OK", last_checked: "3m ago" },
  { service: "n8n", status: "healthy", latency_ms: 45, message: "OK - 12 workflows", last_checked: "2m ago" },
  { service: "Docker", status: "healthy", latency_ms: 30, message: "OK - 8 containers", last_checked: "4m ago" },
  { service: "YouTube API", status: "healthy", latency_ms: 180, message: "OK - 127 requests today", last_checked: "1m ago" },
  { service: "Telegram Bot", status: "healthy", latency_ms: 90, message: "OK - last send 4h ago", last_checked: "2m ago" },
  { service: "Notion API", status: "healthy", latency_ms: 250, message: "OK - 47 pages", last_checked: "3m ago" },
];

const serviceIcons: Record<string, React.ElementType> = {
  "Gemini API": Brain,
  "Groq API": Zap,
  "OpenRouter API": Router,
  "Ollama (Local)": Cpu,
  "PostgreSQL": Database,
  "Qdrant": Database,
  "SQLite": Database,
  "n8n": Activity,
  "Docker": Server,
  "YouTube API": Globe,
  "Telegram Bot": Send,
  "Notion API": FilePlus,
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  healthy: { color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  warning: { color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
  unhealthy: { color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
};

export default function HealthCheckPanel() {
  const [services] = useState<HealthCheckResult[]>(initialServices);
  const { isRunning, runHealthCheck } = useSystemConfig();

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const warningCount = services.filter((s) => s.status === "warning").length;
  const unhealthyCount = services.filter((s) => s.status === "unhealthy").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            System Health Monitor
          </h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={runHealthCheck}
          disabled={isRunning}
          className="h-8 text-xs"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRunning ? "animate-spin" : ""}`}
          />
          Run Check
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-emerald-200 bg-emerald-50/50 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-lg font-bold text-emerald-700">
                {healthyCount}
              </div>
              <div className="text-[10px] text-emerald-600">Healthy</div>
            </div>
          </div>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-lg font-bold text-amber-700">
                {warningCount}
              </div>
              <div className="text-[10px] text-amber-600">Warning</div>
            </div>
          </div>
        </Card>
        <Card className="border-red-200 bg-red-50/50 p-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-lg font-bold text-red-700">
                {unhealthyCount}
              </div>
              <div className="text-[10px] text-red-600">Unhealthy</div>
            </div>
          </div>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 p-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-lg font-bold text-blue-700">
                {services.length}
              </div>
              <div className="text-[10px] text-blue-600">Total</div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Resources */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            System Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-gray-500" />
                CPU Usage
              </span>
              <span className="font-medium">23%</span>
            </div>
            <Progress value={23} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-gray-500" />
                RAM Usage
              </span>
              <span className="font-medium">8.2 / 16 GB (51%)</span>
            </div>
            <Progress value={51} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-gray-500" />
                Disk Usage
              </span>
              <span className="font-medium">45%</span>
            </div>
            <Progress value={45} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-gray-500" />
                Network
              </span>
              <span className="font-medium">12.4 Mbps ↓ / 3.2 Mbps ↑</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service List */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {services.map((service) => {
              const Icon = serviceIcons[service.service] || Activity;
              const config = statusConfig[service.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={service.service}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {service.service}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] h-4 px-1.5 ${config.bg} ${config.color}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-gray-500">
                        {service.message}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {service.latency_ms}ms · {service.last_checked}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quota Predictor */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            API Quota Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[
            { api: "Gemini", used: 340000, limit: 2000000, unit: "tokens" },
            { api: "Groq", used: 125000, limit: 500000, unit: "tokens" },
            { api: "YouTube API", used: 127, limit: 10000, unit: "reqs" },
          ].map((quota) => {
            const pct = Math.round((quota.used / quota.limit) * 100);
            return (
              <div key={quota.api} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{quota.api}</span>
                  <span className="text-gray-500">
                    {quota.used.toLocaleString()} /{" "}
                    {quota.limit.toLocaleString()} {quota.unit} ({pct}%)
                  </span>
                </div>
                <Progress
                  value={pct}
                  className="h-1.5"
                />
              </div>
            );
          })}
          <div className="border rounded-lg p-2.5 bg-blue-50/30 border-blue-200 mt-2">
            <div className="text-[10px] text-blue-700">
              <span className="font-medium">Dự báo:</span> Hôm nay sẽ xử lý ~340K
              tokens. Gemini limit 2M → còn dư 1.66M. Không cần chia batch.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
