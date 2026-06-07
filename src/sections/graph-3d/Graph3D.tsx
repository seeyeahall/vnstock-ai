import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Move,
  Plus,
  Box,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import * as d3 from "d3";

interface GraphNode {
  id: string;
  name: string;
  sector: string;
  sentiment: "bullish" | "bearish" | "neutral";
  marketCap: number;
}

interface GraphLink {
  source: string;
  target: string;
  correlation: number;
  type: "sector" | "correlation";
}

const DEMO_NODES: GraphNode[] = [
  { id: "FPT", name: "FPT Corp", sector: "Technology", sentiment: "bullish", marketCap: 120 },
  { id: "VCB", name: "Vietcombank", sector: "Banking", sentiment: "bullish", marketCap: 200 },
  { id: "HPG", name: "Hoa Phat", sector: "Steel", sentiment: "bearish", marketCap: 80 },
  { id: "GAS", name: "PV Gas", sector: "Energy", sentiment: "neutral", marketCap: 150 },
  { id: "VHM", name: "Vinhomes", sector: "Real Estate", sentiment: "bullish", marketCap: 180 },
  { id: "MWG", name: "Mobile World", sector: "Retail", sentiment: "bearish", marketCap: 60 },
  { id: "SSI", name: "SSI Securities", sector: "Finance", sentiment: "bullish", marketCap: 50 },
  { id: "PLX", name: "Petrolimex", sector: "Energy", sentiment: "neutral", marketCap: 70 },
  { id: "NVL", name: "Novaland", sector: "Real Estate", sentiment: "bearish", marketCap: 40 },
  { id: "TCB", name: "Techcombank", sector: "Banking", sentiment: "bullish", marketCap: 110 },
];

const DEMO_LINKS: GraphLink[] = [
  { source: "FPT", target: "SSI", correlation: 0.7, type: "sector" },
  { source: "VCB", target: "TCB", correlation: 0.8, type: "sector" },
  { source: "HPG", target: "GAS", correlation: 0.3, type: "correlation" },
  { source: "VHM", target: "NVL", correlation: 0.6, type: "sector" },
  { source: "MWG", target: "FPT", correlation: 0.4, type: "correlation" },
  { source: "GAS", target: "PLX", correlation: 0.75, type: "sector" },
  { source: "SSI", target: "VCB", correlation: 0.5, type: "correlation" },
  { source: "TCB", target: "VHM", correlation: 0.35, type: "correlation" },
  { source: "HPG", target: "MWG", correlation: 0.2, type: "correlation" },
  { source: "NVL", target: "VCB", correlation: 0.45, type: "correlation" },
];

const sentimentColors: Record<string, string> = {
  bullish: "#10b981",
  bearish: "#ef4444",
  neutral: "#9ca3af",
};

export default function Graph3D() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);

  const width = 800;
  const height = 500;

  const initGraph = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    // Links
    const link = g
      .append("g")
      .selectAll("line")
      .data(DEMO_LINKS)
      .join("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.abs(d.correlation) * 3);

    // Nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(DEMO_NODES)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<any, any>()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (_event, d) => setSelectedNode(d));

    node
      .append("circle")
      .attr("r", (d) => 8 + d.marketCap / 20)
      .attr("fill", (d) => sentimentColors[d.sentiment])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dx", (d) => 12 + d.marketCap / 20)
      .attr("dy", 4)
      .text((d) => d.id)
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("fill", "#374151");

    // Simulation
    const simulation = d3
      .forceSimulation(DEMO_NODES as any)
      .force(
        "link",
        d3
          .forceLink(DEMO_LINKS as any)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => 20 + d.marketCap / 20));

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;
  }, []);

  useEffect(() => {
    initGraph();
    return () => {
      simulationRef.current?.stop();
    };
  }, [initGraph]);

  const addToReport = () => {
    const config = { nodes: DEMO_NODES, links: DEMO_LINKS };
    localStorage.setItem("vnstock-3d-graph", JSON.stringify(config));
    alert("3D Graph added to report!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">3D Market Graph</h2>
          <p className="text-sm text-gray-500">Force-directed stock correlation network</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={initGraph}>
            <Move className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
          <Button size="sm" onClick={addToReport}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add to Report
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600">Bullish</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600">Bearish</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-600">Neutral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-600">Same Sector</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-blue-300" />
          <span className="text-xs text-gray-600">Correlation</span>
        </div>
        <div className="ml-auto text-xs text-gray-400">Zoom: {Math.round(zoomLevel * 100)}%</div>
      </div>

      {/* Graph */}
      <Card className="border">
        <CardContent className="p-0">
          <div ref={containerRef} className="relative w-full overflow-hidden">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto bg-gray-50 rounded-lg"
              style={{ maxHeight: 500 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Node Detail */}
      {selectedNode && (
        <Card className="border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Box className="w-3.5 h-3.5" />
              Node Detail
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedNode.name}</span>
              <Badge
                variant="outline"
                className={
                  selectedNode.sentiment === "bullish"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : selectedNode.sentiment === "bearish"
                    ? "bg-red-50 text-red-700 border-red-300"
                    : "bg-gray-50 text-gray-600 border-gray-300"
                }
              >
                {selectedNode.sentiment === "bullish" && <TrendingUp className="w-3 h-3 mr-0.5" />}
                {selectedNode.sentiment === "bearish" && <TrendingDown className="w-3 h-3 mr-0.5" />}
                {selectedNode.sentiment}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <span className="text-gray-400">Sector:</span> {selectedNode.sector}
              </div>
              <div>
                <span className="text-gray-400">Market Cap:</span> {selectedNode.marketCap}T VND
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Connected to:{" "}
              {DEMO_LINKS.filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                .map((l) => (l.source === selectedNode.id ? l.target : l.source))
                .join(", ")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
