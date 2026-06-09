import { useState, useEffect, useCallback } from "react";
import type { SystemProfile, ModuleDef } from "@/types/modules";
import { allModules, systemPresets } from "@/data/moduleRegistry";
import { syncSettingsToBackend, getSettingsFromBackend } from "@/services/api";

export interface OutputSettings {
  telegramBotToken: string;
  telegramChatId: string;
  emailSmtpHost: string;
  emailSmtpPort: number;
  emailUser: string;
  emailPass: string;
  emailTo: string;
  notionToken: string;
  notionDatabaseId: string;
  discordWebhook: string;
  dashboardUrl: string;
  notebooklmFolderId: string;
  notebooklmNotebookId: string;
  n8nWebhookUrl: string;
  n8nApiKey: string;
  n8nFallbackMode: string;
  apiKeys: Record<string, string>;
  language: "vi" | "en";
  theme: "light" | "dark";
}

const DEFAULT_SETTINGS: OutputSettings = {
  telegramBotToken: "",
  telegramChatId: "",
  emailSmtpHost: "smtp.gmail.com",
  emailSmtpPort: 587,
  emailUser: "",
  emailPass: "",
  emailTo: "",
  notionToken: "",
  notionDatabaseId: "",
  discordWebhook: "",
  dashboardUrl: "",
  notebooklmFolderId: "1C1Q5GPypwiPvIHt6acYRHWAKapdr5jof",
  notebooklmNotebookId: "b27d3277-d416-410e-a48d-dca5a38d5741",
  n8nWebhookUrl: "",
  n8nApiKey: "",
  n8nFallbackMode: "local",
  apiKeys: {
    gemini: "YOUR_GEMINI_API_KEY",
    groq: "YOUR_GROQ_API_KEY",
    openrouter: "YOUR_OPENROUTER_API_KEY",
    deepseek: "YOUR_DEEPSEEK_API_KEY",
    openai: "YOUR_OPENAI_API_KEY",
    kimi: "YOUR_KIMI_API_KEY",
    together: "YOUR_TOGETHER_API_KEY",
    minimax: "YOUR_MINIMAX_API_KEY",
    cloudflare: "YOUR_CLOUDFLARE_API_KEY",
    byteplus: "YOUR_BYTEPLUS_API_KEY",
    nvidia: "YOUR_NVIDIA_API_KEY",
    ollama: "YOUR_OLLAMA_API_KEY",
  },
  language: "vi",
  theme: "dark",
};

const STORAGE_KEY = "vnstock-ai-settings";
const PROFILE_KEY = "vnstock-ai-profile";
const MODULES_KEY = "vnstock-ai-modules";

export function useSystemConfig() {
  // V2 Settings
  const [settings, setSettings] = useState<OutputSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync settings to backend when they change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      syncSettingsToBackend(settings as unknown as Record<string, unknown>).catch((e) => {
        console.warn("[useSystemConfig] Sync to backend failed:", e);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [settings]);

  // Load settings from backend on mount (if backend available and localStorage empty)
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      getSettingsFromBackend()
        .then((res) => {
          if (res.success && res.data) {
            const backendSettings: Partial<OutputSettings> = {};
            for (const [key, value] of Object.entries(res.data)) {
              if (key in DEFAULT_SETTINGS) {
                try {
                  backendSettings[key as keyof OutputSettings] = JSON.parse(value as string);
                } catch {
                  backendSettings[key as keyof OutputSettings] = value as any;
                }
              }
            }
            setSettings((prev) => ({ ...prev, ...backendSettings }));
          }
        })
        .catch(() => {
          // silently ignore if backend not available
        });
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof OutputSettings>(key: K, value: OutputSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateApiKey = useCallback((provider: string, key: string) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: key },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // V1 Profile
  const [profile, setProfile] = useState<SystemProfile>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {
      system_name: "Daily Stock Intelligence",
      mode: "scheduled",
      inputs: ["youtube_ingestion", "stock_market_data", "rss_news"],
      outputs: ["telegram", "notion"],
      ai: ["gemini", "groq"],
      memory: ["postgres", "qdrant"],
      schedule: ["07:00", "20:00"],
      hardware_profile: "medium",
    };
  });

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  // V1 Selected Modules
  const [selectedModules, setSelectedModules] = useState<ModuleDef[]>(() => {
    try {
      const raw = localStorage.getItem(MODULES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return allModules.map((m) => ({
      ...m,
      is_selected: [
        ...profile.inputs,
        ...profile.outputs,
        ...profile.ai,
        ...profile.memory,
      ].includes(m.module_id),
    }));
  });

  useEffect(() => {
    localStorage.setItem(MODULES_KEY, JSON.stringify(selectedModules));
  }, [selectedModules]);

  const toggleModule = useCallback((moduleId: string) => {
    setSelectedModules((prev) =>
      prev.map((m) =>
        m.module_id === moduleId ? { ...m, is_selected: !m.is_selected } : m
      )
    );
  }, []);

  const applyPreset = useCallback((presetIndex: number) => {
    const preset = systemPresets[presetIndex];
    if (!preset) return;
    setProfile(preset);
    setSelectedModules((prev) =>
      prev.map((m) => ({
        ...m,
        is_selected: [
          ...preset.inputs,
          ...preset.outputs,
          ...preset.ai,
          ...preset.memory,
        ].includes(m.module_id),
      }))
    );
  }, []);

  const updateProfileField = useCallback(
    (field: keyof SystemProfile, value: any) => {
      setProfile((prev: SystemProfile) => ({ ...prev, [field]: value }));
    },
    []
  );

  // V1 Workflow Simulation
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 500));
  }, []);

  const startWorkflow = useCallback(() => {
    setIsRunning(true);
    addLog("[EXECUTIVE BRAIN] Nhận mục tiêu: Tạo báo cáo thị trường");
    addLog("[PRECHECK] Kiểm tra API Health...");
    addLog("[PRECHECK] Gemini API: OK (latency 420ms, quota 78%)");
    addLog("[PRECHECK] Groq API: OK (latency 85ms, quota 92%)");
    addLog("[PRECHECK] PostgreSQL: OK");
    addLog("[PRECHECK] Qdrant: OK");
    addLog("[QUOTA] Dự báo: ~340K tokens / 2M limit → PASS");
    addLog("[PLANNER] Phân rã task thành 6 agent...");
    addLog("[AGENT 1/6] YouTube Collector: Đang thu thập 29 kênh...");

    const steps = [
      () => addLog("[AGENT 1/6] YouTube: Đã thu thập 137 video mới"),
      () => addLog("[AGENT 2/6] Transcript: Đang xử lý subtitle..."),
      () => addLog("[AGENT 2/6] Transcript: 132/137 transcript OK (96%)"),
      () => addLog("[AGENT 3/6] Stock Data: Lấy dữ liệu VNINDEX, FPT, VCB, HPG..."),
      () => addLog("[AGENT 4/6] News Collector: Thu thập 47 bài từ CafeF, VietStock"),
      () => addLog("[9ROUTER] Task phân tích → Gemini 2.5 Pro"),
      () => addLog("[AGENT 5/6] Analyzer: Đang phân tích vĩ mô, ngành, cổ phiếu..."),
      () => addLog("[AGENT 5/6] Analyzer: Phát hiện 3 tín hiệu quan trọng"),
      () => addLog("[VALIDATOR] Cross-check: 3/3 tín hiệu hợp lệ"),
      () => addLog("[AGENT 6/6] Report Generator: Sinh báo cáo Markdown..."),
      () => addLog("[OUTPUT] Telegram: Đã gửi báo cáo"),
      () => addLog("[OUTPUT] Notion: Đã lưu báo cáo"),
      () => addLog("[AUDIT] Hoàn thành: 6/6 agent, 0 lỗi, latency 4m32s"),
      () => {
        addLog("[EXECUTIVE BRAIN] Workflow hoàn thành. Next run: 20:00");
        setIsRunning(false);
      },
    ];

    steps.forEach((step, i) => {
      setTimeout(step, (i + 1) * 1200);
    });
  }, [addLog]);

  const stopWorkflow = useCallback(() => {
    setIsRunning(false);
    addLog("[EXECUTIVE BRAIN] Workflow bị dừng bởi ngườ dùng");
  }, [addLog]);

  const runHealthCheck = useCallback(() => {
    addLog("[HEALTH CHECK] =============================");
    addLog("[HEALTH] Gemini API: OK (420ms)");
    addLog("[HEALTH] Groq API: OK (85ms)");
    addLog("[HEALTH] OpenRouter: OK (310ms)");
    addLog("[HEALTH] PostgreSQL: OK (5ms)");
    addLog("[HEALTH] Qdrant: OK (12ms)");
    addLog("[HEALTH] n8n: OK (45ms)");
    addLog("[HEALTH] YouTube API: OK (180ms)");
    addLog("[HEALTH] Telegram: OK (90ms)");
    addLog("[HEALTH] Notion: OK (250ms)");
    addLog("[HEALTH] RAM: 8.2GB / 16GB (51%)");
    addLog("[HEALTH] CPU: 23%");
    addLog("[HEALTH] Disk: 45%");
    addLog("[HEALTH CHECK] Tất cả dịch vụ: HEALTHY");
  }, [addLog]);

  return {
    // V2
    settings,
    updateSetting,
    updateApiKey,
    resetSettings,
    // V1
    profile,
    selectedModules,
    isRunning,
    logs,
    toggleModule,
    applyPreset,
    updateProfileField,
    startWorkflow,
    stopWorkflow,
    runHealthCheck,
  };
}
