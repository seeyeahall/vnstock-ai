import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { sendTelegramMessage, sendEmail, saveToNotion } from "@/services/api";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import {
  Mail,
  MessageSquare,
  FileText,
  Globe,
  Activity,
  Save,
  TestTube,
  BookOpen,
  Workflow,
} from "lucide-react";
import { API_BASE } from "@/services/api";

export default function OutputSettingsPanel() {
  const { settings, updateSetting } = useSystemConfig();
  const [testStatus, setTestStatus] = useState<Record<string, { status: string; message: string }>>({});
  const [enabledChannels, setEnabledChannels] = useState<Record<string, boolean>>({
    telegram: true,
    email: true,
    notion: false,
    discord: false,
    dashboard: true,
    notebooklm: false,
    n8n: false,
  });
  const [notebooklmLoading, setNotebooklmLoading] = useState(false);
  const [n8nLoading, setN8nLoading] = useState(false);
  const [n8nLastTested, setN8nLastTested] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [notebooklmStatus, setNotebooklmStatus] = useState<any>(null);

  const setTest = (key: string, status: string, message: string) => {
    setTestStatus((prev) => ({ ...prev, [key]: { status, message } }));
  };

  const testTelegram = async () => {
    setTest("telegram", "loading", "Đang gửi...");
    try {
      const res = await sendTelegramMessage(
        settings.telegramBotToken || "7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc",
        settings.telegramChatId || "6226786681",
        "🧪 Test kênh Telegram từ VNStock AI v3.0"
      );
      setTest(
        "telegram",
        res.success ? "success" : "error",
        res.success ? "Gửi thành công!" : `Lỗi: ${res.error}`
      );
    } catch (e: any) {
      setTest("telegram", "error", `Lỗi: ${e.message}`);
    }
  };

  const testEmail = async () => {
    setTest("email", "loading", "Đang gửi...");
    try {
      const res = await sendEmail(
        settings.emailSmtpHost || "smtp.gmail.com",
        settings.emailSmtpPort || 587,
        settings.emailUser || "seeyeahall@gmail.com",
        settings.emailPass || "qialfxmpfedshqgn",
        settings.emailTo || "seeyeahall@gmail.com",
        "🧪 Test Email VNStock AI v3.0",
        "<h2>Test kênh Email</h2><p>Đây là email test từ VNStock AI v3.0</p><p>Nếu bạn nhận được email này, kênh Email đã hoạt động!</p>"
      );
      setTest(
        "email",
        res.success ? "success" : "error",
        res.success ? "Gửi thành công!" : `Lỗi: ${res.error}`
      );
    } catch (e: any) {
      setTest("email", "error", `Lỗi: ${e.message}`);
    }
  };

  const testNotion = async () => {
    setTest("notion", "loading", "Đang gửi...");
    try {
      const res = await saveToNotion(
        settings.notionToken,
        settings.notionDatabaseId,
        {
          title: "🧪 Test Notion VNStock AI",
          content: "Test từ VNStock AI v3.0",
        }
      );
      setTest(
        "notion",
        res.success ? "success" : "error",
        res.success ? "Gửi thành công!" : `Lỗi: ${res.error}`
      );
    } catch (e: any) {
      setTest("notion", "error", `Lỗi: ${e.message}`);
    }
  };

  const testDiscord = async () => {
    setTest("discord", "loading", "Đang gửi...");
    try {
      if (!settings.discordWebhook) {
        setTest("discord", "error", "Chưa cấu hình Webhook URL");
        return;
      }
      const res = await fetch(settings.discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "🧪 Test kênh Discord từ VNStock AI v3.0",
        }),
      });
      setTest(
        "discord",
        res.ok ? "success" : "error",
        res.ok ? "Gửi thành công!" : `Lỗi: ${res.status}`
      );
    } catch (e: any) {
      setTest("discord", "error", `Lỗi: ${e.message}`);
    }
  };

  const testNotebookLM = async () => {
    setNotebooklmLoading(true);
    setTest("notebooklm", "loading", "Đang sync...");
    try {
      const res = await fetch(`${API_BASE}/api/notebooklm/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName: "VNStock_Daily_Intelligence",
          megaContext: {
            stockData: { VNINDEX: { price: 1200, change: 1.2 } },
            news: [{ title: "Test News", source: "Test" }],
            sources: ["VNStock AI Test"],
          },
        }),
      });
      const data = await res.json();
      setTest(
        "notebooklm",
        data.success ? "success" : "error",
        data.success
          ? data.source === "local_fallback"
            ? `Fallback: ${data.message}`
            : "Sync thành công!"
          : `Lỗi: ${data.error || "Unknown"}`
      );
      // Refresh status
      const statusRes = await fetch(`${API_BASE}/api/notebooklm/status`);
      const statusData = await statusRes.json();
      if (statusData.success) setNotebooklmStatus(statusData.data);
    } catch (e: any) {
      setTest("notebooklm", "error", `Lỗi: ${e.message}`);
    }
    setNotebooklmLoading(false);
  };

  const requestAudioOverview = async () => {
    setAudioLoading(true);
    setTest("notebooklm_audio", "loading", "Đang yêu cầu Audio Overview...");
    try {
      const res = await fetch(`${API_BASE}/api/notebooklm/audio/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId: settings.notebooklmNotebookId || "default",
        }),
      });
      const data = await res.json();
      setTest(
        "notebooklm_audio",
        data.success ? "success" : "error",
        data.success
          ? `Đã gửi yêu cầu (Job: ${data.jobId}). ${data.message}`
          : `Lỗi: ${data.error || "Unknown"}`
      );
    } catch (e: any) {
      setTest("notebooklm_audio", "error", `Lỗi: ${e.message}`);
    }
    setAudioLoading(false);
  };

  // Fetch NotebookLM status on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/notebooklm/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setNotebooklmStatus(data.data);
      })
      .catch(() => {
        // silently ignore — status is optional
      });
  }, []);

  const testN8n = async () => {
    setN8nLoading(true);
    setTest("n8n", "loading", "Đang test connection...");
    try {
      const res = await fetch(`${API_BASE}/api/n8n/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: settings.n8nWebhookUrl,
          apiKey: settings.n8nApiKey,
        }),
      });
      const data = await res.json();
      setN8nLastTested(new Date().toLocaleString());
      setTest(
        "n8n",
        data.connected ? "success" : "error",
        data.connected ? `Kết nối thành công! (${data.latency}ms)` : `Lỗi: ${data.error || "Unknown"}`
      );
    } catch (e: any) {
      setTest("n8n", "error", `Lỗi: ${e.message}`);
    }
    setN8nLoading(false);
  };

  const toggleChannel = (channel: string) => {
    setEnabledChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  const getBadgeVariant = (key: string) => {
    const s = testStatus[key];
    if (!s) return "outline";
    if (s.status === "success") return "default";
    if (s.status === "error") return "destructive";
    return "secondary";
  };

  const getBadgeText = (key: string) => {
    const s = testStatus[key];
    if (!s) return "";
    return s.message;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cấu hình kênh Output</h2>
          <p className="text-sm text-gray-500">
            Thiết lập và kiểm tra các kênh gửi báo cáo
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            Object.keys(testStatus).forEach((k) => setTest(k, "", ""));
            alert("Đã xóa trạng thái test!");
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          Xóa trạng thái
        </Button>
      </div>

      {/* Telegram */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-base">Telegram Bot</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabledChannels.telegram}
                onCheckedChange={() => toggleChannel("telegram")}
              />
              <Label className="text-sm text-gray-500">
                {enabledChannels.telegram ? "Bật" : "Tắt"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Bot Token</Label>
              <Input
                placeholder="7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc"
                value={settings.telegramBotToken}
                onChange={(e) => updateSetting("telegramBotToken", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Chat ID</Label>
              <Input
                placeholder="6226786681"
                value={settings.telegramChatId}
                onChange={(e) => updateSetting("telegramChatId", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={testTelegram}
              disabled={!enabledChannels.telegram}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <TestTube className="w-4 h-4 mr-1" />
              Gửi thử
            </Button>
            {testStatus.telegram && (
              <Badge variant={getBadgeVariant("telegram") as any}>
                {getBadgeText("telegram")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-500" />
              <CardTitle className="text-base">Email SMTP</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabledChannels.email}
                onCheckedChange={() => toggleChannel("email")}
              />
              <Label className="text-sm text-gray-500">
                {enabledChannels.email ? "Bật" : "Tắt"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">SMTP Host</Label>
              <Input
                placeholder="smtp.gmail.com"
                value={settings.emailSmtpHost}
                onChange={(e) => updateSetting("emailSmtpHost", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">SMTP Port</Label>
              <Input
                type="number"
                placeholder="587"
                value={settings.emailSmtpPort}
                onChange={(e) => updateSetting("emailSmtpPort", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Email gửi</Label>
              <Input
                placeholder="seeyeahall@gmail.com"
                value={settings.emailUser}
                onChange={(e) => updateSetting("emailUser", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">App Password</Label>
              <Input
                type="password"
                placeholder="qialfxmpfedshqgn"
                value={settings.emailPass}
                onChange={(e) => updateSetting("emailPass", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500 mb-1 block">Email nhận</Label>
              <Input
                placeholder="seeyeahall@gmail.com"
                value={settings.emailTo}
                onChange={(e) => updateSetting("emailTo", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={testEmail}
              disabled={!enabledChannels.email}
              className="bg-red-500 hover:bg-red-600"
            >
              <TestTube className="w-4 h-4 mr-1" />
              Gửi thử
            </Button>
            {testStatus.email && (
              <Badge variant={getBadgeVariant("email") as any}>
                {getBadgeText("email")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notion */}
      <Card className="border-l-4 border-l-gray-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-base">Notion</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabledChannels.notion}
                onCheckedChange={() => toggleChannel("notion")}
              />
              <Label className="text-sm text-gray-500">
                {enabledChannels.notion ? "Bật" : "Tắt"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Integration Token</Label>
              <Input
                placeholder="secret_..."
                value={settings.notionToken}
                onChange={(e) => updateSetting("notionToken", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Database ID</Label>
              <Input
                placeholder="..."
                value={settings.notionDatabaseId}
                onChange={(e) => updateSetting("notionDatabaseId", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={testNotion}
              disabled={!enabledChannels.notion}
              variant="outline"
            >
              <TestTube className="w-4 h-4 mr-1" />
              Gửi thử
            </Button>
            {testStatus.notion && (
              <Badge variant={getBadgeVariant("notion") as any}>
                {getBadgeText("notion")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discord */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-base">Discord</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabledChannels.discord}
                onCheckedChange={() => toggleChannel("discord")}
              />
              <Label className="text-sm text-gray-500">
                {enabledChannels.discord ? "Bật" : "Tắt"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Webhook URL</Label>
            <Input
              placeholder="https://discord.com/api/webhooks/..."
              value={settings.discordWebhook}
              onChange={(e) => updateSetting("discordWebhook", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={testDiscord}
              disabled={!enabledChannels.discord}
              variant="outline"
            >
              <TestTube className="w-4 h-4 mr-1" />
              Gửi thử
            </Button>
            {testStatus.discord && (
              <Badge variant={getBadgeVariant("discord") as any}>
                {getBadgeText("discord")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Web Dashboard</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabledChannels.dashboard}
                onCheckedChange={() => toggleChannel("dashboard")}
              />
              <Label className="text-sm text-gray-500">
                {enabledChannels.dashboard ? "Bật" : "Tắt"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Dashboard URL</Label>
            <Input
              placeholder="https://seeyeahall.github.io/vnstock-ai/"
              value={settings.dashboardUrl}
              onChange={(e) => updateSetting("dashboardUrl", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = settings.dashboardUrl || "https://seeyeahall.github.io/vnstock-ai/";
                window.open(url, "_blank");
              }}
            >
              <Globe className="w-4 h-4 mr-1" />
              Mở Dashboard
            </Button>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              <Activity className="w-3 h-3 mr-1" />
              Luôn hoạt động
            </Badge>
          </div>
        </CardContent>
      </Card>

      // === NOTEBOOKLM SECTION ===
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-base">NotebookLM Integration</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabledChannels.notebooklm}
                onCheckedChange={() => toggleChannel("notebooklm")}
              />
              <Label className="text-sm text-gray-500">
                {enabledChannels.notebooklm ? "Bật" : "Tắt"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Google Drive Folder ID (optional)</Label>
              <Input
                placeholder="1A2B3C4D5E6F..."
                value={settings.notebooklmFolderId || ""}
                onChange={(e) => updateSetting("notebooklmFolderId", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Notebook ID (optional)</Label>
              <Input
                placeholder="notebook-xxx"
                value={settings.notebooklmNotebookId || ""}
                onChange={(e) => updateSetting("notebooklmNotebookId", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={testNotebookLM}
              disabled={!enabledChannels.notebooklm || notebooklmLoading}
              variant="outline"
            >
              <TestTube className="w-4 h-4 mr-1" />
              {notebooklmLoading ? "Syncing..." : "Test Sync"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={requestAudioOverview}
              disabled={!enabledChannels.notebooklm || audioLoading}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              {audioLoading ? "Requesting..." : "Request Audio Overview"}
            </Button>
            {testStatus.notebooklm && (
              <Badge variant={getBadgeVariant("notebooklm") as any}>
                {getBadgeText("notebooklm")}
              </Badge>
            )}
          </div>
          {notebooklmStatus && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span className="font-medium">Trạng thái:</span>{" "}
                <span
                  className={
                    notebooklmStatus.status === "success"
                      ? "text-emerald-600"
                      : notebooklmStatus.status === "error"
                      ? "text-red-600"
                      : notebooklmStatus.status === "fallback_local"
                      ? "text-amber-600"
                      : "text-gray-600"
                  }
                >
                  {notebooklmStatus.status || "idle"}
                </span>
              </div>
              {notebooklmStatus.lastSync && (
                <div className="mt-1">
                  <span className="font-medium">Last sync:</span>{" "}
                  {new Date(notebooklmStatus.lastSync).toLocaleString("vi-VN")}
                </div>
              )}
              {notebooklmStatus.googleDriveAvailable !== undefined && (
                <div className="mt-1">
                  <span className="font-medium">Google Drive API:</span>{" "}
                  {notebooklmStatus.googleDriveAvailable ? "Available" : "Not configured (using local fallback)"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* === N8N BRIDGE SECTION === */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-base">n8n External Worker</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabledChannels.n8n}
                onCheckedChange={() => toggleChannel("n8n")}
              />
              <Label className="text-sm text-gray-500">
                {enabledChannels.n8n ? "Bật" : "Tắt"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">n8n Webhook URL</Label>
              <Input
                placeholder="https://n8n.your-domain.com/webhook/vnstock"
                value={settings.n8nWebhookUrl || ""}
                onChange={(e) => updateSetting("n8nWebhookUrl", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">n8n API Key</Label>
              <Input
                type="password"
                placeholder="n8n_api_..."
                value={settings.n8nApiKey || ""}
                onChange={(e) => updateSetting("n8nApiKey", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={testN8n}
              disabled={!enabledChannels.n8n || n8nLoading}
              variant="outline"
            >
              <TestTube className="w-4 h-4 mr-1" />
              {n8nLoading ? "Testing..." : "Test Connection"}
            </Button>
            <Select
              value={settings.n8nFallbackMode || "local"}
              onChange={(e) => updateSetting("n8nFallbackMode", e.target.value)}
              className="w-40"
            >
              <option value="local">Fallback: Local</option>
              <option value="queue">Fallback: Queue</option>
              <option value="skip">Fallback: Skip</option>
            </Select>
            {testStatus.n8n && (
              <Badge variant={getBadgeVariant("n8n") as any}>
                {getBadgeText("n8n")}
              </Badge>
            )}
          </div>
          {n8nLastTested && (
            <div className="text-xs text-gray-400">
              Last tested: {n8nLastTested}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tóm tắt */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Tóm tắt kênh Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "telegram", label: "Telegram", color: "blue" },
              { key: "email", label: "Email", color: "red" },
              { key: "notion", label: "Notion", color: "gray" },
              { key: "discord", label: "Discord", color: "indigo" },
              { key: "dashboard", label: "Dashboard", color: "emerald" },
              { key: "notebooklm", label: "NotebookLM", color: "orange" },
              { key: "n8n", label: "n8n", color: "purple" },
            ].map((ch) => (
              <div
                key={ch.key}
                className={`p-3 rounded-lg border ${
                  enabledChannels[ch.key]
                    ? `bg-${ch.color}-50 border-${ch.color}-200`
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <div className="text-xs font-medium text-gray-600">{ch.label}</div>
                <div
                  className={`text-sm font-bold ${
                    enabledChannels[ch.key] ? `text-${ch.color}-600` : "text-gray-400"
                  }`}
                >
                  {enabledChannels[ch.key] ? "Đang bật" : "Đang tắt"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
