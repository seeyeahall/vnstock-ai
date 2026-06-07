import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const nodes = [
  // Input Layer
  { id: "youtube", label: "YouTube\nIngestion", category: "input", x: 80, y: 40, fill: "#3b82f6" },
  { id: "stock", label: "Stock\nMarket", category: "input", x: 240, y: 40, fill: "#3b82f6" },
  { id: "news", label: "RSS\nNews", category: "input", x: 400, y: 40, fill: "#3b82f6" },
  // Validation Layer
  { id: "health", label: "Health\nCheck", category: "validation", x: 160, y: 120, fill: "#f43f5e" },
  { id: "quota", label: "Quota\nPredictor", category: "validation", x: 320, y: 120, fill: "#f43f5e" },
  // AI Layer
  { id: "gemini", label: "Gemini\nAnalysis", category: "ai", x: 240, y: 200, fill: "#8b5cf6" },
  // Memory Layer
  { id: "postgres", label: "PostgreSQL", category: "memory", x: 80, y: 280, fill: "#f59e0b" },
  { id: "qdrant", label: "Qdrant\nVector", category: "memory", x: 400, y: 280, fill: "#f59e0b" },
  // Recovery Layer
  { id: "fallback", label: "AI\nFallback", category: "recovery", x: 80, y: 200, fill: "#f97316" },
  // Output Layer
  { id: "telegram", label: "Telegram", category: "output", x: 160, y: 360, fill: "#10b981" },
  { id: "notion", label: "Notion", category: "output", x: 320, y: 360, fill: "#10b981" },
];

const edges = [
  { from: "youtube", to: "health" },
  { from: "stock", to: "health" },
  { from: "news", to: "health" },
  { from: "health", to: "quota" },
  { from: "quota", to: "gemini" },
  { from: "gemini", to: "fallback" },
  { from: "fallback", to: "gemini" },
  { from: "gemini", to: "postgres" },
  { from: "gemini", to: "qdrant" },
  { from: "postgres", to: "telegram" },
  { from: "postgres", to: "notion" },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  input: { label: "Input Collection", color: "bg-blue-50 text-blue-700 border-blue-200" },
  validation: { label: "Validation", color: "bg-rose-50 text-rose-700 border-rose-200" },
  ai: { label: "AI Analysis", color: "bg-purple-50 text-purple-700 border-purple-200" },
  memory: { label: "Memory", color: "bg-amber-50 text-amber-700 border-amber-200" },
  recovery: { label: "Recovery", color: "bg-orange-50 text-orange-700 border-orange-200" },
  output: { label: "Delivery", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function WorkflowVisualizer() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Workflow Graph</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {nodes.length} nodes · {edges.length} edges
          </Badge>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 520 420" className="w-full h-auto border rounded-lg bg-gray-50">
            {/* Edges */}
            {edges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.from)!;
              const to = nodes.find((n) => n.id === edge.to)!;
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x + 50}
                  y1={from.y + 20}
                  x2={to.x + 50}
                  y2={to.y + 20}
                  stroke="#9ca3af"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  opacity={0.6}
                />
              );
            })}
            {/* Nodes */}
            {nodes.map((node) => (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={100}
                  height={40}
                  rx={8}
                  fill={node.fill}
                  opacity={0.9}
                />
                <text
                  x={node.x + 50}
                  y={node.y + 16}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight={600}
                >
                  {node.label.split("\n")[0]}
                </text>
                <text
                  x={node.x + 50}
                  y={node.y + 30}
                  textAnchor="middle"
                  fill="white"
                  fontSize={9}
                  opacity={0.9}
                >
                  {node.label.split("\n")[1] || ""}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>

      {/* Category Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(categoryLabels).map(([key, { label, color }]) => (
          <div key={key} className={`border rounded-lg p-2 ${color}`}>
            <div className="text-[10px] font-medium">{label}</div>
            <div className="text-[9px] opacity-70">
              {nodes.filter((n) => n.category === key).length} modules
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
