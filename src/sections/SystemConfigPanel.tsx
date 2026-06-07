import type { SystemProfile } from "@/types/modules";
import { systemPresets } from "@/data/moduleRegistry";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  HardDrive,
  Zap,
  Clock,
  Server,
  Database,
  Bot,
} from "lucide-react";

interface SystemConfigPanelProps {
  profile: SystemProfile;
  onUpdateField: (field: keyof SystemProfile, value: any) => void;
  onApplyPreset: (index: number) => void;
}

const hardwareOptions = [
  { value: "low_end", label: "Low End (8GB RAM, i3)", icon: HardDrive },
  { value: "medium", label: "Medium (16GB RAM, i5)", icon: Cpu },
  { value: "high_end", label: "High End (32GB+ RAM, i7+)", icon: Zap },
];

const modeOptions = [
  { value: "autonomous", label: "Autonomous", desc: "Tự chạy, tự sửa lỗi" },
  { value: "scheduled", label: "Scheduled", desc: "Chạy theo lịch" },
  { value: "manual", label: "Manual", desc: "Chạy thủ công" },
];

export function SystemConfigPanel({
  profile,
  onUpdateField,
  onApplyPreset,
}: SystemConfigPanelProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Presets */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">System Presets</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Chọn cấu hình có sẵn hoặc tùy chỉnh
        </p>

        <div className="space-y-2">
          {systemPresets.map((preset, idx) => (
            <Button
              key={idx}
              variant="outline"
              className={`w-full justify-start h-auto py-3 px-3 text-left border ${
                profile.system_name === preset.system_name
                  ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onApplyPreset(idx)}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{preset.system_name}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5"
                  >
                    {preset.mode}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {preset.inputs.length} inputs
                  </span>
                  <span className="flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    {preset.outputs.length} outputs
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {preset.hardware_profile}
                  </span>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="border rounded-lg p-4 bg-gray-50 mt-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">
            Current Config Summary
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Inputs</span>
              <div className="flex gap-1">
                {profile.inputs.map((i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] h-4 bg-blue-50"
                  >
                    {i}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">AI Providers</span>
              <div className="flex gap-1">
                {profile.ai.map((a) => (
                  <Badge
                    key={a}
                    variant="outline"
                    className="text-[10px] h-4 bg-purple-50"
                  >
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Memory</span>
              <div className="flex gap-1">
                {profile.memory.map((m) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="text-[10px] h-4 bg-amber-50"
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outputs</span>
              <div className="flex gap-1">
                {profile.outputs.map((o) => (
                  <Badge
                    key={o}
                    variant="outline"
                    className="text-[10px] h-4 bg-emerald-50"
                  >
                    {o}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Config Form */}
      <div className="col-span-12 lg:col-span-8 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            Configuration Details
          </h2>
        </div>

        {/* System Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">System Name</label>
          <Input
            value={profile.system_name}
            onChange={(e) => onUpdateField("system_name", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Mode + Hardware */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Operation Mode</label>
            <select
              value={profile.mode}
              onChange={(e) => onUpdateField("mode", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {modeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} - {opt.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Hardware Profile</label>
            <select
              value={profile.hardware_profile}
              onChange={(e) => onUpdateField("hardware_profile", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {hardwareOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule */}
        {profile.mode !== "manual" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Schedule
            </label>
            <div className="flex flex-wrap gap-2">
              {["06:00", "07:00", "08:00", "09:00", "12:00", "18:00", "20:00", "21:00"].map(
                (time) => (
                  <Button
                    key={time}
                    size="sm"
                    variant={profile.schedule.includes(time) ? "default" : "outline"}
                    className={`h-7 text-xs px-2.5 ${
                      profile.schedule.includes(time)
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }`}
                    onClick={() => {
                      const newSchedule = profile.schedule.includes(time)
                        ? profile.schedule.filter((t) => t !== time)
                        : [...profile.schedule, time].sort();
                      onUpdateField("schedule", newSchedule);
                    }}
                  >
                    {time}
                  </Button>
                )
              )}
            </div>
          </div>
        )}

        {/* Architecture Diagram Mini */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">
            Architecture Overview
          </h3>
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex flex-col items-center">
              <div className="w-16 h-8 bg-blue-100 border border-blue-300 rounded flex items-center justify-center text-blue-700 font-medium">
                Inputs
              </div>
              <span className="text-gray-500 mt-1">{profile.inputs.length} modules</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-8 bg-purple-100 border border-purple-300 rounded flex items-center justify-center text-purple-700 font-medium">
                AI
              </div>
              <span className="text-gray-500 mt-1">{profile.ai.length} providers</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-8 bg-amber-100 border border-amber-300 rounded flex items-center justify-center text-amber-700 font-medium">
                Memory
              </div>
              <span className="text-gray-500 mt-1">{profile.memory.length} stores</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-8 bg-emerald-100 border border-emerald-300 rounded flex items-center justify-center text-emerald-700 font-medium">
                Outputs
              </div>
              <span className="text-gray-500 mt-1">{profile.outputs.length} channels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
