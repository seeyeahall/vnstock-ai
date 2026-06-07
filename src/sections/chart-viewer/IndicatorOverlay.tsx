import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const INDICATOR_LIST = [
  { id: "ma", name: "MA (5,20,50)" },
  { id: "ema", name: "EMA (12,26)" },
  { id: "rsi", name: "RSI (14)" },
  { id: "macd", name: "MACD" },
  { id: "bollinger", name: "Bollinger Bands" },
  { id: "ichimoku_standard", name: "Ichimoku Standard" },
  { id: "ichimoku_longterm", name: "Ichimoku Long-term" },
  { id: "volume_ma", name: "Volume MA" },
  { id: "obv", name: "OBV" },
  { id: "stochastic", name: "Stochastic" },
];

interface IndicatorOverlayProps {
  enabled: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export default function IndicatorOverlay({ enabled, onToggle }: IndicatorOverlayProps) {
  return (
    <Card className="border">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Indicators
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {INDICATOR_LIST.map((ind) => (
            <button
              key={ind.id}
              onClick={() => onToggle(ind.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                enabled[ind.id]
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {enabled[ind.id] && "✓ "}
              {ind.name}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
