import { HashRouter, Routes, Route } from "react-router-dom";
import Header from "@/sections/Header";
import OutputSettingsPanel from "@/sections/OutputSettingsPanel";
import HealthCheckPanel from "@/sections/HealthCheckPanel";
import WorkflowVisualizer from "@/sections/WorkflowVisualizer";
import ExecutiveBrainConsole from "@/sections/ExecutiveBrainConsole";
import { ModuleSelector } from "@/sections/ModuleSelector";
import { SystemConfigPanel } from "@/sections/SystemConfigPanel";
import ChatPanel from "@/sections/ChatPanel";
import ReportBuilder from "@/sections/report-builder/ReportBuilder";
import CollectionPanel from "@/sections/data-collection/CollectionPanel";
import ChartViewer from "@/sections/chart-viewer/ChartViewer";
import AudioPlayer from "@/sections/audio-player/AudioPlayer";
import Graph3D from "@/sections/graph-3d/Graph3D";
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

function ReportBuilderPage() {
  return (
    <div className="space-y-4">
      <ReportBuilder />
    </div>
  );
}

function DataCollectionPage() {
  return (
    <div className="space-y-4">
      <CollectionPanel />
    </div>
  );
}

function ChartsPage() {
  return (
    <div className="space-y-4">
      <ChartViewer />
    </div>
  );
}

function AudioPage() {
  return (
    <div className="space-y-4">
      <AudioPlayer />
    </div>
  );
}

function Graph3DPage() {
  return (
    <div className="space-y-4">
      <Graph3D />
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
            <Route path="/report-builder" element={<ReportBuilderPage />} />
            <Route path="/data-collection" element={<DataCollectionPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/audio" element={<AudioPage />} />
            <Route path="/graph-3d" element={<Graph3DPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
