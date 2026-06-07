import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { API_KEYS } from "@/config/apiKeys";
import { useState } from "react";

export default function ApiSettingsPanel() {
  const { settings, updateApiKey } = useSystemConfig();
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const testKey = async (provider: string) => {
    setTestResults((prev) => ({ ...prev, [provider]: "Testing..." }));
    try {
      const res = await fetch("http://localhost:3002/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: settings.apiKeys[provider] }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: data.success ? "OK" : data.error || "Failed",
      }));
    } catch (e: any) {
      setTestResults((prev) => ({ ...prev, [provider]: `Error: ${e.message}` }));
    }
  };

  return (
    <div className="space-y-4">
      {Object.keys(API_KEYS).map((provider) => (
        <Card key={provider}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium capitalize">{provider}</CardTitle>
            {testResults[provider] && (
              <Badge variant={testResults[provider] === "OK" ? "default" : "destructive"}>
                {testResults[provider]}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="password"
              placeholder={`${provider} API Key`}
              value={settings.apiKeys[provider] || ""}
              onChange={(e) => updateApiKey(provider, e.target.value)}
            />
            <Button size="sm" variant="outline" onClick={() => testKey(provider)}>
              Test Key
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
