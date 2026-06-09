import { useState, useEffect, useCallback } from "react";

const getApiBase = (): string => {
  const stored = localStorage.getItem("vnstock-api-base");
  if (stored) return stored;
  const env = (import.meta as any).env;
  if (env && env.VITE_API_BASE) return env.VITE_API_BASE;
  return "http://localhost:3004";
};

export const API_BASE = getApiBase();

export function setApiBase(base: string) {
  localStorage.setItem("vnstock-api-base", base);
}

export function getApiBaseUrl(): string {
  return getApiBase();
}

export async function sendTelegramMessage(
  _botToken: string,
  _chatId: string,
  message: string
) {
  const res = await fetch(`${API_BASE}/api/send-telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: _chatId, text: message, parse_mode: "HTML" }),
  });
  return res.json();
}

export async function sendEmail(
  _smtpHost: string,
  _smtpPort: number,
  _user: string,
  _pass: string,
  to: string,
  subject: string,
  html: string
) {
  const res = await fetch(`${API_BASE}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, body: html.replace(/<[^>]*>/g, ' '), html }),
  });
  return res.json();
}

export async function saveToNotion(
  token: string,
  databaseId: string,
  data: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}/api/save-notion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, databaseId, data }),
  });
  return res.json();
}

export async function runWorkflow(payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/workflow/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getYouTubeData(channelId: string) {
  const res = await fetch(`${API_BASE}/api/youtube/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channels: [channelId], days: 7, max_videos: 10 }),
  });
  return res.json();
}

export async function healthCheck() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export function useApiStatus() {
  const [online, setOnline] = useState(false);

  const check = useCallback(async () => {
    const ok = await healthCheck();
    setOnline(ok);
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [check]);

  return { online, check };
}

export async function syncSettingsToBackend(settings: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/settings/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function getSettingsFromBackend() {
  const res = await fetch(`${API_BASE}/api/settings/all`);
  return res.json();
}

// ===== CHAT APIs =====

export async function sendChatMessage(sessionId: string, message: string) {
  const res = await fetch(`${API_BASE}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
  return res.json();
}

export async function getChatHistory(sessionId: string, limit = 50) {
  const res = await fetch(
    `${API_BASE}/api/chat/history?sessionId=${sessionId}&limit=${limit}`
  );
  return res.json();
}

export async function deleteChatHistory(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/chat/history/${sessionId}`, {
    method: "DELETE",
  });
  return res.json();
}

// ===== DB APIs =====

export async function dbGetChat() {
  const res = await fetch(`${API_BASE}/api/db/chat`);
  return res.json();
}

export async function dbInsertChat(data: {
  sessionId: string;
  role: string;
  content: string;
  intent?: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${API_BASE}/api/db/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function dbGetReports() {
  const res = await fetch(`${API_BASE}/api/db/reports`);
  return res.json();
}

export async function dbGetSettings() {
  const res = await fetch(`${API_BASE}/api/db/settings`);
  return res.json();
}

export async function dbUpdateSetting(key: string, value: string) {
  const res = await fetch(`${API_BASE}/api/db/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  return res.json();
}

export async function dbGetSchedules() {
  const res = await fetch(`${API_BASE}/api/db/schedules`);
  return res.json();
}

export async function dbDeleteSchedule(id: string) {
  const res = await fetch(`${API_BASE}/api/db/schedules/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function dbGetApiKeys() {
  const res = await fetch(`${API_BASE}/api/db/keys`);
  return res.json();
}

export async function dbUpdateApiKey(data: {
  provider: string;
  apiKey: string;
  status?: string;
  latencyMs?: number;
}) {
  const res = await fetch(`${API_BASE}/api/db/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ===== SYNC APIs =====

export async function syncPush(tables: string[], since?: string) {
  const res = await fetch(`${API_BASE}/api/sync/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tables, since }),
  });
  return res.json();
}

export async function syncPull(tables: string[], since?: string) {
  const res = await fetch(`${API_BASE}/api/sync/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tables, since }),
  });
  return res.json();
}

export async function syncStatus() {
  const res = await fetch(`${API_BASE}/api/sync/status`);
  return res.json();
}
