import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface OutputChannelConfig {
  telegram: boolean;
  email: boolean;
  dashboard: boolean;
}

interface OutputConfigProps {
  sections: { id: string; name: string; enabled: boolean }[];
  channels: Record<string, OutputChannelConfig>;
  onToggle: (sectionId: string, channel: keyof OutputChannelConfig) => void;
}

export default function OutputConfig({ sections, channels, onToggle }: OutputConfigProps) {
  const enabledSections = sections.filter((s) => s.enabled);

  return (
    <Card className="border">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold">Output Channels</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Section</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500">Telegram</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500">Email</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500">Dashboard</th>
              </tr>
            </thead>
            <tbody>
              {enabledSections.map((section) => {
                const cfg = channels[section.id] || { telegram: false, email: false, dashboard: false };
                return (
                  <tr key={section.id} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-medium">{section.name}</td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="checkbox"
                        checked={cfg.telegram}
                        onChange={() => onToggle(section.id, "telegram")}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="checkbox"
                        checked={cfg.email}
                        onChange={() => onToggle(section.id, "email")}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="checkbox"
                        checked={cfg.dashboard}
                        onChange={() => onToggle(section.id, "dashboard")}
                        className="rounded border-gray-300"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
