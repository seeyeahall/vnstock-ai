import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown, FileText } from "lucide-react";

export interface SectionItem {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

interface SectionSelectorProps {
  sections: SectionItem[];
  onToggle: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

const sectionIcons: Record<string, React.ElementType> = {
  macro: FileText,
  sector: FileText,
  stock: FileText,
  chart: FileText,
  sentiment: FileText,
  insight: FileText,
  watchlist: FileText,
  audio: FileText,
  "3d": FileText,
};

export default function SectionSelector({ sections, onToggle, onMove }: SectionSelectorProps) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <Card className="border">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold">Sections</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {sorted.map((section) => {
          const Icon = sectionIcons[section.id] || FileText;
          return (
            <div
              key={section.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  disabled={section.order === 1}
                  onClick={() => onMove(section.id, "up")}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  disabled={section.order === sorted.length}
                  onClick={() => onMove(section.id, "down")}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="flex-1 text-sm font-medium">{section.name}</span>
              <Switch checked={section.enabled} onCheckedChange={() => onToggle(section.id)} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
