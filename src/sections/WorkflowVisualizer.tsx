import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/services/api";

interface NodeStatus {
  id: string;
  status: "pending" | "running" | "success" | "failed";
  label: string;
  category: string;
  x: number;
  y: number;
  fill: string;
}

const baseNodes: NodeStatus[] = [
  { id: "youtube", label: "YouTube\nIngestion", category: "input", x: 80, y: 40, fill: "#3b82f6", status: "pending" },
  { id: "stock", label: "Stock\nMarket", category: "input", x: 240, y: 40, fill: "#3b82f6", status: "pending" },
  { id: "news", label: "RSS\nNews", category: "input", x: 400, y: 40, fill: "#3b82f6", status: "pending" },
  { id: "health", label: "Health\nCheck", category: "validation", x: 160, y: 120, fill: "#f43f5e", status: "pending" },
  { id: "quota", label: "Quota\nPredictor", category: "validation", x: 320, y: 120, fill: "#f43f5e", status: "pending" },
  { id: "gemini", label: "Gemini\nAnalysis", category: "ai", x: 240, y: 200, fill: "#8b5cf6", status: "pending" },
  { id: "postgres", label: "PostgreSQL", category: "memory", x: 80, y: 280, fill: "#f59e0b", status: "pending" },
  { id: "qdrant", label: "Qdrant\nVector", category: "memory", x: 400, y: 280, fill: "#f59e0b", status: "pending" },
  { id: "fallback", label: "AI\nFallback", category: "recovery", x: 80, y: 200, fill: "#f97316", status: "pending" },
  { id: "telegram", label: "Telegram", category: "output", x: 160, y: 360, fill: "#10b981", status: "pending" },
  { id: "notion", label: "Notion", category: "output", x: 320, y: 360, fill: "#10b981", status: "pending" },
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

const statusColors: Record<string, string> = {
  pending: "#9ca3af",
  running: "#22c55e",
  success: "#10b981",
  failed: "#ef4444",
};

export default function WorkflowVisualizer() {
  const [nodes, setNodes] = useState<NodeStatus[]>(baseNodes);
  const [selectedNode, setSelectedNode] = useState<NodeStatus | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workflow/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.node_status) {
          setNodes((prev) =>
            prev.map((n) => ({
              ...n,
              status: data.node_status[n.id] || n.status,
              fill: statusColors[data.node_status[n.id] || n.status] || n.fill,
            }))
          );
        }
      }
    } catch {
      // Fallback: simulate animation
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // Data flow animation
  useEffect(() => {
    const id = setInterval(() => setAnimationFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(id);
  }, []);

  const getEdgeDashOffset = (from: string, _to: string) => {
    const fromNode = nodes.find((n) => n.id === from);
    if (fromNode?.status === "running" || fromNode?.status === "success") {
      return -animationFrame * 2;
    }
    return 0;
  };

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
              const isActive = from.status === "running" || from.status === "success";
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x + 50}
                  y1={from.y + 20}
                  x2={to.x + 50}
                  y2={to.y + 20}
                  stroke={isActive ? "#3b82f6" : "#9ca3af"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={isActive ? "8 4" : "4 2"}
                  strokeDashoffset={getEdgeDashOffset(edge.from, edge.to)}
                  opacity={isActive ? 0.9 : 0.5}
                />
              );
            })}
            {/* Nodes */}
            {nodes.map((node) => (
              <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: "pointer" }}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={100}
                  height={40}
                  rx={8}
                  fill={node.fill}
                  opacity={0.9}
                  stroke={node.status === "running" ? "#22c55e" : node.status === "failed" ? "#ef4444" : "transparent"}
                  strokeWidth={2}
                >
                  {node.status === "running" && (
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
                  )}
                </rect>
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
                {/* Status dot */}
                <circle
                  cx={node.x + 90}
                  cy={node.y + 8}
                  r={4}
                  fill={node.status === "running" ? "#22c55e" : node.status === "success" ? "#10b981" : node.status === "failed" ? "#ef4444" : "#9ca3af"}
                >
                  {node.status === "running" && (
                    <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
                  )}
                </circle>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>

      {/* Node Detail */}
      {selectedNode && (
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{selectedNode.label.replace("\n", " ")}</div>
                <div className="text-xs text-gray-500">Category: {selectedNode.category}</div>
              </div>
              <Badge
                variant="outline"
                className={
                  selectedNode.status === "running"
                    ? "bg-green-50 text-green-700 border-green-300"
                    : selectedNode.status === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : selectedNode.status === "failed"
                    ? "bg-red-50 text-red-700 border-red-300"
                    : "bg-gray-50 text-gray-600 border-gray-300"
                }
              >
                {selectedNode.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
