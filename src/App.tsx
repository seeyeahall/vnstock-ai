import { HashRouter, Routes, Route } from "react-router-dom";
import Header from "@/sections/Header";
import OutputSettingsPanel from "@/sections/OutputSettingsPanel";
import HealthCheckPanel from "@/sections/HealthCheckPanel";
import WorkflowVisualizer from "@/sections/WorkflowVisualizer";
import ExecutiveBrainConsole from "@/sections/ExecutiveBrainConsole";
import { ModuleSelector } from "@/sections/ModuleSelector";
import { SystemConfigPanel } from "@/sections/SystemConfigPanel";
import ChatPanel from "@/sections/ChatPanel";
import { useSystemConfig } from "@/hooks/useSystemConfig";

function SystemConfigPage() {
  const {
    profile,
    applyPreset,
    updateProfileField,
  } = useSystemConfig();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: System Config */}
        <div className="xl:col-span-2 space-y-6">
          <SystemConfigPanel
            profile={profile}
            onUpdateField={updateProfileField}
            onApplyPreset={applyPreset}
          />
        </div>
        {/* Right: Chat AI */}
        <div className="xl:col-span-1">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}

function ModuleRegistryPage() {
  const { selectedModules, toggleModule } = useSystemConfig();

  return (
    <div className="space-y-4">
      <ModuleSelector modules={selectedModules} onToggle={toggleModule} />
    </div>
  );
}

function WorkflowGraphPage() {
  return (
    <div className="space-y-4">
      <WorkflowVisualizer />
    </div>
  );
}

function ExecutiveBrainPage() {
  return (
    <div className="space-y-4">
      <ExecutiveBrainConsole />
    </div>
  );
}

function HealthCheckPage() {
  return (
    <div className="space-y-4">
      <HealthCheckPanel />
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-4">
      <OutputSettingsPanel />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-[1600px] mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<SystemConfigPage />} />
            <Route path="/modules" element={<ModuleRegistryPage />} />
            <Route path="/workflow" element={<WorkflowGraphPage />} />
            <Route path="/brain" element={<ExecutiveBrainPage />} />
            <Route path="/health" element={<HealthCheckPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
