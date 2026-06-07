import { HashRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Header from "@/sections/Header";
import OutputSettingsPanel from "@/sections/OutputSettingsPanel";
import HealthCheckPanel from "@/sections/HealthCheckPanel";
import WorkflowVisualizer from "@/sections/WorkflowVisualizer";
import ExecutiveBrainConsole from "@/sections/ExecutiveBrainConsole";
import { ModuleSelector } from "@/sections/ModuleSelector";
import { SystemConfigPanel } from "@/sections/SystemConfigPanel";
import ChatPanel from "@/sections/ChatPanel";

// Lazy load V3 routes (heavy components)
const ReportBuilder = lazy(() => import("@/sections/report-builder/ReportBuilder"));
const CollectionPanel = lazy(() => import("@/sections/data-collection/CollectionPanel"));
const ChartViewer = lazy(() => import("@/sections/chart-viewer/ChartViewer"));
const AudioPlayer = lazy(() => import("@/sections/audio-player/AudioPlayer"));
const Graph3D = lazy(() => import("@/sections/graph-3d/Graph3D"));

import { useSystemConfig } from "@/hooks/useSystemConfig";

// Loading fallback for lazy routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    </div>
  );
}

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </main>
      </div>
    </HashRouter>
  );
}
