import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Save,
  Play,
  FileText,
  BarChart3,
  Radio,
  Box,
  Calendar,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  X,
} from "lucide-react";
import { API_BASE } from "@/services/api";

export interface ReportSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface OutputChannelConfig {
  telegram: boolean;
  email: boolean;
  dashboard: boolean;
}

export interface ReportTemplate {
  name: string;
  sections: ReportSection[];
  outputChannels: Record<string, OutputChannelConfig>;
  timeRange: "1d" | "1w" | "1m";
  sources: { youtube: boolean; stock: boolean; rss: boolean };
  schedule: "manual" | string[];
}

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: "macro", name: "Macro Overview", enabled: true, order: 1 },
  { id: "sector", name: "Sector Rotation", enabled: true, order: 2 },
  { id: "stock", name: "Stock Cards", enabled: true, order: 3 },
  { id: "chart", name: "Technical Chart", enabled: true, order: 4 },
  { id: "sentiment", name: "Sentiment Gauge", enabled: true, order: 5 },
  { id: "insight", name: "Insights", enabled: true, order: 6 },
  { id: "watchlist", name: "Watchlist Table", enabled: true, order: 7 },
  { id: "audio", name: "Audio Summary", enabled: false, order: 8 },
  { id: "3d", name: "3D Graph", enabled: false, order: 9 },
];

const PRESETS = {
  daily_brief: {
    name: "Daily Brief",
    sections: DEFAULT_SECTIONS.map((s) => ({
      ...s,
      enabled: ["macro", "sentiment", "watchlist"].includes(s.id),
    })),
    outputChannels: {
      macro: { telegram: true, email: true, dashboard: true },
      sentiment: { telegram: true, email: true, dashboard: true },
      watchlist: { telegram: false, email: true, dashboard: true },
    },
    timeRange: "1d" as const,
    sources: { youtube: true, stock: true, rss: true },
    schedule: ["07:00", "20:00"],
  },
  weekly_deep: {
    name: "Weekly Deep",
    sections: DEFAULT_SECTIONS.map((s) => ({
      ...s,
      enabled: ["macro", "sector", "stock", "chart", "sentiment", "insight", "watchlist"].includes(s.id),
    })),
    outputChannels: {
      macro: { telegram: false, email: true, dashboard: true },
      sector: { telegram: false, email: true, dashboard: true },
      stock: { telegram: false, email: true, dashboard: true },
      chart: { telegram: false, email: true, dashboard: true },
      sentiment: { telegram: false, email: true, dashboard: true },
      insight: { telegram: false, email: true, dashboard: true },
      watchlist: { telegram: false, email: true, dashboard: true },
    },
    timeRange: "1w" as const,
    sources: { youtube: true, stock: true, rss: true },
    schedule: "manual" as const,
  },
  youtube_only: {
    name: "YouTube Only",
    sections: DEFAULT_SECTIONS.map((s) => ({
      ...s,
      enabled: ["macro", "sentiment", "audio"].includes(s.id),
    })),
    outputChannels: {
      macro: { telegram: true, email: false, dashboard: true },
      sentiment: { telegram: true, email: false, dashboard: true },
      audio: { telegram: true, email: false, dashboard: true },
    },
    timeRange: "1d" as const,
    sources: { youtube: true, stock: false, rss: false },
    schedule: "manual" as const,
  },
};

const sectionIcons: Record<string, React.ElementType> = {
  macro: BarChart3,
  sector: BarChart3,
  stock: FileText,
  chart: BarChart3,
  sentiment: Radio,
  insight: FileText,
  watchlist: FileText,
  audio: Radio,
  "3d": Box,
};

export default function ReportBuilder() {
  const [template, setTemplate] = useState<ReportTemplate>({
    name: "",
    sections: [...DEFAULT_SECTIONS],
    outputChannels: {},
    timeRange: "1d",
    sources: { youtube: true, stock: true, rss: true },
    schedule: "manual",
  });
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

  const toggleSection = useCallback((id: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  }, []);

  const moveSection = useCallback((id: string, direction: "up" | "down") => {
    setTemplate((prev) => {
      const sections = [...prev.sections].sort((a, b) => a.order - b.order);
      const idx = sections.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === sections.length - 1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const temp = sections[idx].order;
      sections[idx].order = sections[swapIdx].order;
      sections[swapIdx].order = temp;
      return { ...prev, sections };
    });
  }, []);

  const toggleOutput = useCallback((sectionId: string, channel: keyof OutputChannelConfig) => {
    setTemplate((prev) => ({
      ...prev,
      outputChannels: {
        ...prev.outputChannels,
        [sectionId]: {
          ...prev.outputChannels[sectionId],
          [channel]: !prev.outputChannels[sectionId]?.[channel],
        },
      },
    }));
  }, []);

  const applyPreset = useCallback((presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setTemplate({
      name: preset.name,
      sections: preset.sections.map((s) => ({ ...s })),
      outputChannels: JSON.parse(JSON.stringify(preset.outputChannels)),
      timeRange: preset.timeRange,
      sources: { ...preset.sources },
      schedule: Array.isArray(preset.schedule) ? [...preset.schedule] : preset.schedule,
    });
    setMessage({ type: "success", text: `Applied preset: ${preset.name}` });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const saveTemplate = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/report-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: `tpl-${Date.now()}`,
          name: template.name || "Untitled Template",
          sections: JSON.stringify(template.sections),
          output_channels: JSON.stringify(template.outputChannels),
          time_range: template.timeRange,
          sources: JSON.stringify(Object.entries(template.sources).filter(([, v]) => v).map(([k]) => k)),
          schedule: JSON.stringify(template.schedule),
        }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Template saved successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to save template." });
      }
    } catch {
      setMessage({ type: "error", text: "API error. Template saved to localStorage only." });
      localStorage.setItem("vnstock-report-template", JSON.stringify(template));
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  }, [template]);

  const runNow = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/run-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: template.name || "custom",
          sections: template.sections.filter((s) => s.enabled).map((s) => s.id),
          time_range: template.timeRange,
          sources: Object.entries(template.sources).filter(([, v]) => v).map(([k]) => k),
        }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Workflow started!" });
      } else {
        setMessage({ type: "error", text: "Failed to start workflow." });
      }
    } catch {
      setMessage({ type: "error", text: "API error. Cannot start workflow." });
    }
    setRunning(false);
    setTimeout(() => setMessage(null), 3000);
  }, [template]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Report Builder</h2>
          <p className="text-sm text-gray-500">Configure report templates and output channels</p>
        </div>
        {message && (
          <Badge
            variant="outline"
            className={
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-red-50 text-red-700 border-red-300"
            }
          >
            {message.type === "success" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
            {message.text}
          </Badge>
        )}
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => applyPreset("daily_brief")}>
          <Calendar className="w-3.5 h-3.5 mr-1" />
          Daily Brief
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset("weekly_deep")}>
          <BarChart3 className="w-3.5 h-3.5 mr-1" />
          Weekly Deep
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset("youtube_only")}>
          <Radio className="w-3.5 h-3.5 mr-1" />
          YouTube Only
        </Button>
      </div>

      {/* Template Name */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold">Template Name</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Input
            placeholder="Enter template name..."
            value={template.name}
            onChange={(e) => setTemplate((prev) => ({ ...prev, name: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* Sections */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold">Sections (drag to reorder)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {sortedSections.map((section) => {
            const Icon = sectionIcons[section.id] || FileText;
            return (
              <div
                key={section.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    disabled={section.order === 1}
                    onClick={() => moveSection(section.id, "up")}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    disabled={section.order === sortedSections.length}
                    onClick={() => moveSection(section.id, "down")}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="flex-1 text-sm font-medium">{section.name}</span>
                <Switch
                  checked={section.enabled}
                  onCheckedChange={() => toggleSection(section.id)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Output Channel Matrix */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold">Output Channel Matrix</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Section</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">Telegram</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">Email</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">Dashboard</th>
                </tr>
              </thead>
              <tbody>
                {sortedSections
                  .filter((s) => s.enabled)
                  .map((section) => {
                    const cfg = template.outputChannels[section.id] || { telegram: false, email: false, dashboard: false };
                    return (
                      <tr key={section.id} className="border-b border-gray-50">
                        <td className="py-2 px-2 font-medium">{section.name}</td>
                        <td className="text-center py-2 px-2">
                          <input
                            type="checkbox"
                            checked={cfg.telegram}
                            onChange={() => toggleOutput(section.id, "telegram")}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="text-center py-2 px-2">
                          <input
                            type="checkbox"
                            checked={cfg.email}
                            onChange={() => toggleOutput(section.id, "email")}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="text-center py-2 px-2">
                          <input
                            type="checkbox"
                            checked={cfg.dashboard}
                            onChange={() => toggleOutput(section.id, "dashboard")}
                            className="rounded border-gray-300"
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Time Range & Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold">Time Range</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Select
              value={template.timeRange}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, timeRange: e.target.value as "1d" | "1w" | "1m" }))
              }
            >
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
              <option value="1m">1 Month</option>
            </Select>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold">Data Sources</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {(
              [
                ["youtube", "YouTube"] as const,
                ["stock", "Stock Data"] as const,
                ["rss", "RSS News"] as const,
              ]
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                <Switch
                  checked={template.sources[key]}
                  onCheckedChange={() =>
                    setTemplate((prev) => ({
                      ...prev,
                      sources: { ...prev.sources, [key]: !prev.sources[key] },
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card className="border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={template.schedule !== "manual"}
              onCheckedChange={(checked) =>
                setTemplate((prev) => ({
                  ...prev,
                  schedule: checked ? ["07:00", "20:00"] : "manual",
                }))
              }
            />
            <Label className="text-sm">{template.schedule === "manual" ? "Manual" : "Scheduled"}</Label>
          </div>
          {template.schedule !== "manual" && (
            <div className="flex gap-2">
              {template.schedule.map((time, i) => (
                <Input
                  key={i}
                  type="time"
                  value={time}
                  onChange={(e) => {
                    const newSchedule = [...template.schedule] as string[];
                    newSchedule[i] = e.target.value;
                    setTemplate((prev) => ({ ...prev, schedule: newSchedule }));
                  }}
                  className="w-32"
                />
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setTemplate((prev) => ({
                    ...prev,
                    schedule: [...(prev.schedule as string[]), "12:00"],
                  }))
                }
              >
                + Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={saveTemplate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Template"}
        </Button>
        <Button onClick={runNow} disabled={running} className="bg-emerald-600 hover:bg-emerald-700">
          <Play className="w-4 h-4 mr-2" />
          {running ? "Starting..." : "Run Now"}
        </Button>
      </div>
    </div>
  );
}
