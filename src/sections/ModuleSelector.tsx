import { useState } from "react";
import type { ModuleDef } from "@/types/modules";
import { categoryLabels, categoryColors } from "@/data/moduleRegistry";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Youtube,
  TrendingUp,
  Newspaper,
  Globe,
  FileText,
  Bitcoin,
  Brain,
  Zap,
  Router,
  Cpu,
  Database,
  Search,
  BookOpen,
  Send,
  Mail,
  FilePlus,
  MessageCircle,
  LayoutDashboard,
  HeartPulse,
  Gauge,
  HardHat,
  CheckCircle,
  RefreshCw,
  GitBranch,
  PlayCircle,
  Check,
  Plus,
  Settings2,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  youtube: Youtube,
  "trending-up": TrendingUp,
  newspaper: Newspaper,
  globe: Globe,
  "file-text": FileText,
  bitcoin: Bitcoin,
  brain: Brain,
  zap: Zap,
  router: Router,
  cpu: Cpu,
  database: Database,
  search: Search,
  "book-open": BookOpen,
  send: Send,
  mail: Mail,
  "file-plus": FilePlus,
  "message-circle": MessageCircle,
  "layout-dashboard": LayoutDashboard,
  "heart-pulse": HeartPulse,
  gauge: Gauge,
  "hard-hat": HardHat,
  "check-circle": CheckCircle,
  "refresh-cw": RefreshCw,
  "git-branch": GitBranch,
  "play-circle": PlayCircle,
};

interface ModuleSelectorProps {
  modules: ModuleDef[];
  onToggle: (moduleId: string) => void;
}

export function ModuleSelector({ modules, onToggle }: ModuleSelectorProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [, setSelectedModule] = useState<ModuleDef | null>(null);

  const categories = [...new Set(modules.map((m) => m.category))];

  const filteredModules = modules.filter((m) => {
    const matchCategory = filter === "all" || m.category === filter;
    const matchSearch =
      search === "" ||
      m.module_name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const selectedCount = modules.filter((m) => m.is_selected).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Available Modules
          </h2>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 text-[10px]"
          >
            {selectedCount} selected
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 text-xs"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          className={`h-7 text-[11px] px-2.5 ${
            filter === "all" ? "bg-gray-800" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          All ({modules.length})
        </Button>
        {categories.map((cat) => {
          const count = modules.filter((m) => m.category === cat).length;
          const colors = categoryColors[cat];
          const isActive = filter === cat;
          return (
            <Button
              key={cat}
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={`h-7 text-[11px] px-2.5 ${
                isActive ? `${colors.bg} ${colors.text} ${colors.border}` : ""
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                    }
                  : {}
              }
              onClick={() => setFilter(isActive ? "all" : cat)}
            >
              {categoryLabels[cat] || cat} ({count})
            </Button>
          );
        })}
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredModules.map((mod) => {
          const Icon = iconMap[mod.icon] || Settings2;
          const colors = categoryColors[mod.category];
          return (
            <Card
              key={mod.module_id}
              className={`relative border transition-all hover:shadow-md ${
                mod.is_selected
                  ? `${colors.border} ring-1 ${colors.bg}`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Selected indicator */}
              {mod.is_selected && (
                <div
                  className={`absolute top-2 right-2 w-5 h-5 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}
                >
                  <Check className={`w-3 h-3 ${colors.text}`} />
                </div>
              )}

              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <div className="min-w-0 pr-6">
                    <CardTitle className="text-sm font-semibold leading-tight">
                      {mod.module_name}
                    </CardTitle>
                    <CardDescription className="text-[10px] mt-0.5">
                      v{mod.version} · {mod.module_id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-3 space-y-2">
                <p className="text-xs text-gray-600 line-clamp-2">
                  {mod.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {mod.inputs.slice(0, 2).map((i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[9px] h-4 px-1 bg-gray-50"
                    >
                      in: {i}
                    </Badge>
                  ))}
                  {mod.outputs.slice(0, 2).map((o) => (
                    <Badge
                      key={o}
                      variant="outline"
                      className="text-[9px] h-4 px-1 bg-gray-50"
                    >
                      out: {o}
                    </Badge>
                  ))}
                </div>

                {/* Dependencies */}
                {mod.dependencies.length > 0 && (
                  <div className="text-[10px] text-gray-400">
                    deps: {mod.dependencies.join(", ")}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={mod.is_selected ? "default" : "outline"}
                    className={`h-7 text-xs flex-1 ${
                      mod.is_selected
                        ? "bg-gray-800 hover:bg-gray-900"
                        : ""
                    }`}
                    onClick={() => onToggle(mod.module_id)}
                  >
                    {mod.is_selected ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        Select
                      </>
                    )}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setSelectedModule(mod)}
                      >
                        <Settings2 className="w-3.5 h-3.5 text-gray-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                          {mod.module_name}
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                          >
                            v{mod.version}
                          </Badge>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 mt-2">
                        <p className="text-sm text-gray-600">
                          {mod.description}
                        </p>
                        <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
                          <div className="text-xs font-medium text-gray-700">
                            Module Info
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <span className="text-gray-500">Category:</span>
                            <span>{mod.category}</span>
                            <span className="text-gray-500">Module ID:</span>
                            <span className="font-mono">{mod.module_id}</span>
                            <span className="text-gray-500">Inputs:</span>
                            <span>{mod.inputs.join(", ")}</span>
                            <span className="text-gray-500">Outputs:</span>
                            <span>{mod.outputs.join(", ")}</span>
                            <span className="text-gray-500">
                              Dependencies:
                            </span>
                            <span>
                              {mod.dependencies.length > 0
                                ? mod.dependencies.join(", ")
                                : "None"}
                            </span>
                          </div>
                        </div>
                        {mod.config_schema.length > 0 && (
                          <div className="border rounded-lg p-3 space-y-2">
                            <div className="text-xs font-medium text-gray-700">
                              Configuration
                            </div>
                            {mod.config_schema.map((field) => (
                              <div key={field.key} className="space-y-1">
                                <label className="text-xs font-medium">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500 ml-0.5">
                                      *
                                    </span>
                                  )}
                                </label>
                                <Input
                                  placeholder={
                                    field.placeholder ||
                                    String(field.default || "")
                                  }
                                  type={
                                    field.type === "password"
                                      ? "password"
                                      : "text"
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
