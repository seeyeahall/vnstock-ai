import { useState, useEffect, useCallback } from "react";
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
import { API_BASE } from "@/services/api";

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
  const [services, setServices] = useState<HealthCheckResult[]>([]);
  const [resources, setResources] = useState({ cpu: 23, ramUsed: 8.2, ramTotal: 16, disk: 45, networkDown: 12.4, networkUp: 3.2 });
  const [quotas, setQuotas] = useState([
    { api: "Gemini", used: 340000, limit: 2000000, unit: "tokens" },
    { api: "Groq", used: 125000, limit: 500000, unit: "tokens" },
    { api: "YouTube API", used: 127, limit: 10000, unit: "reqs" },
  ]);
  const [loading, setLoading] = useState(false);
  const { isRunning, runHealthCheck: runLocalHealthCheck } = useSystemConfig();

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      // Use new dashboard status API
      const res = await fetch(`${API_BASE}/api/dashboard/status`);
      if (res.ok) {
        const data = await res.json();
        
        // Transform API health data to service list format
        const apiHealth = data.api?.health || {};
        const apiStatus = data.api?.apiStatus || {};
        
        const transformedServices = Object.entries(apiHealth).map(([name, info]: [string, any]) => {
          const configured = apiStatus[name]?.configured || false;
          const dbStatus = apiStatus[name]?.status || 'unknown';
          const isHealthy = info.status === 'healthy';
          
          let message = info.message || '';
          if (!configured) {
            message = 'Not configured — add API key in Settings';
          } else if (!isHealthy) {
            message = info.error || info.message || 'Connection failed';
          }
          
          return {
            service: `${name.charAt(0).toUpperCase() + name.slice(1)} API`,
            status: isHealthy ? 'healthy' : configured ? 'unhealthy' : 'warning',
            latency_ms: info.latency_ms || 0,
            message,
            last_checked: 'just now',
            configured,
            provider: name
          };
        });
        
        setServices(transformedServices);
        
        // Update quotas from API data
        if (data.api?.quotas) {
          setQuotas(data.api.quotas);
        }
      } else {
        throw new Error("API error");
      }
    } catch {
      // Fallback to mock data if API not available
      setServices([
        { service: "Gemini API", status: "unhealthy", latency_ms: 0, message: "Not configured — add API key in Settings", last_checked: "now", configured: false, provider: "gemini" },
        { service: "Groq API", status: "warning", latency_ms: 0, message: "Not configured", last_checked: "now", configured: false, provider: "groq" },
        { service: "OpenRouter API", status: "healthy", latency_ms: 180, message: "OK", last_checked: "now", configured: false, provider: "openrouter" },
        { service: "Ollama (Local)", status: "healthy", latency_ms: 5, message: "Local server running", last_checked: "now", configured: true, provider: "ollama" },
        { service: "Telegram Bot", status: "healthy", latency_ms: 650, message: "OK", last_checked: "now", configured: true, provider: "telegram" },
        { service: "Email SMTP", status: "healthy", latency_ms: 55, message: "SMTP connection OK", last_checked: "now", configured: true, provider: "email" },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const warningCount = services.filter((s) => s.status === "warning").length;
  const unhealthyCount = services.filter((s) => s.status === "unhealthy").length;

  const handleRunCheck = () => {
    runLocalHealthCheck();
    fetchHealth();
  };

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
          onClick={handleRunCheck}
          disabled={isRunning || loading}
          className="h-8 text-xs"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRunning || loading ? "animate-spin" : ""}`}
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

      {/* Gemini Critical Warning */}
      {services.find(s => s.provider === 'gemini')?.status !== 'healthy' && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-red-700">⚠️ Gemini API Required</div>
                <div className="text-[10px] text-red-600 mt-0.5">
                  Gemini is the primary AI provider for workflow analysis. Without it, reports will run in local mode (no AI insights). 
                  <a href="#/settings" className="underline font-medium">Go to Settings → API Keys</a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Configuration Status */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            API Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {services.map((service) => (
              <div key={service.provider} className={`flex items-center gap-2 p-2 rounded-lg border ${service.configured ? (service.status === 'healthy' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-2 h-2 rounded-full ${service.configured ? (service.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-gray-300'}`} />
                <div className="text-[10px]">
                  <div className="font-medium">{service.service.replace(' API', '')}</div>
                  <div className={`${service.configured ? (service.status === 'healthy' ? 'text-emerald-600' : 'text-red-600') : 'text-gray-400'}`}>
                    {service.configured ? (service.status === 'healthy' ? '✅ Ready' : '❌ Failed') : '⚪ Not Set'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              <span className="font-medium">{resources.cpu}%</span>
            </div>
            <Progress value={resources.cpu} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-gray-500" />
                RAM Usage
              </span>
              <span className="font-medium">{resources.ramUsed} / {resources.ramTotal} GB ({Math.round((resources.ramUsed / resources.ramTotal) * 100)}%)</span>
            </div>
            <Progress value={(resources.ramUsed / resources.ramTotal) * 100} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-gray-500" />
                Disk Usage
              </span>
              <span className="font-medium">{resources.disk}%</span>
            </div>
            <Progress value={resources.disk} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-gray-500" />
                Network
              </span>
              <span className="font-medium">{resources.networkDown} Mbps ↓ / {resources.networkUp} Mbps ↑</span>
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
          {quotas.map((quota) => {
            const pct = Math.round((quota.used / quota.limit) * 100);
            const isLow = pct > 80;
            return (
              <div key={quota.api} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{quota.api}</span>
                  <span className={`${isLow ? "text-red-500 font-medium" : "text-gray-500"}`}>
                    {quota.used.toLocaleString()} /{" "}
                    {quota.limit.toLocaleString()} {quota.unit} ({pct}%)
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={`h-1.5 ${isLow ? "bg-red-100" : ""}`}
                />
                {isLow && (
                  <div className="text-[10px] text-red-600">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Quota running low! Consider batch splitting.
                  </div>
                )}
              </div>
            );
          })}
          <div className="border rounded-lg p-2.5 bg-blue-50/30 border-blue-200 mt-2">
            <div className="text-[10px] text-blue-700">
              <span className="font-medium">Forecast:</span> Today will process ~{quotas[0]?.used.toLocaleString() || "340K"} tokens. 
              {quotas[0] && quotas[0].used / quotas[0].limit > 0.8
                ? " Approaching limit — consider reducing batch size."
                : " Within safe limits."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
