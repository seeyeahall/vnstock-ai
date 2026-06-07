import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Brain,
  Settings,
  Workflow,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSystemConfig } from "@/hooks/useSystemConfig";

const tabs = [
  { path: "/", label: "System Config", icon: Settings },
  { path: "/modules", label: "Module Registry", icon: Workflow },
  { path: "/workflow", label: "Workflow Graph", icon: Activity },
  { path: "/brain", label: "Executive Brain", icon: Brain },
  { path: "/health", label: "Health Check", icon: Shield },
  { path: "/settings", label: "Output Settings", icon: Settings },
];

export default function Header() {
  const location = useLocation();
  const {
    isRunning,
    startWorkflow,
    stopWorkflow,
    runHealthCheck,
  } = useSystemConfig();

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                VNStock Adaptive Intelligence System
              </h1>
              <p className="text-xs text-gray-500">
                Modular Hybrid Blueprint Architecture v1.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                  Running
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopWorkflow}
                  className="h-8"
                >
                  Stop
                </Button>
              </>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  Ready
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runHealthCheck}
                  className="h-8"
                >
                  Health Check
                </Button>
                <Button
                  size="sm"
                  onClick={startWorkflow}
                  className="h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Activity className="w-3.5 h-3.5 mr-1" />
                  Run Workflow
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
