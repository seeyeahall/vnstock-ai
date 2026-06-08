// ===== MODULE REGISTRY TYPES =====

export type ModuleCategory =
  | "input"
  | "output"
  | "ai"
  | "memory"
  | "validation"
  | "recovery"
  | "workflow";

export type ModuleStatus = "active" | "inactive" | "error" | "loading" | "disabled";

export interface ModuleDef {
  module_id: string;
  module_name: string;
  version: string;
  category: ModuleCategory;
  description: string;
  dependencies: string[];
  inputs: string[];
  outputs: string[];
  config_schema: ConfigSchemaField[];
  icon: string;
  status: ModuleStatus;
  is_selected?: boolean;
}

export interface ConfigSchemaField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select" | "multiselect" | "password";
  options?: string[];
  required: boolean;
  default?: any;
  placeholder?: string;
}

// ===== SYSTEM CONFIG TYPES =====

export interface SystemProfile {
  system_name: string;
  mode: "autonomous" | "manual" | "scheduled";
  inputs: string[];
  outputs: string[];
  ai: string[];
  memory: string[];
  schedule: string[];
  hardware_profile: "low_end" | "medium" | "high_end";
}

// ===== EXECUTIVE BRAIN TYPES =====

export interface AgentTask {
  id: string;
  agent_name: string;
  status: "pending" | "running" | "success" | "failed" | "retrying";
  progress: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
  fallback_used?: string;
}

export interface SystemState {
  current_phase: string;
  overall_progress: number;
  is_running: boolean;
  last_run?: string;
  next_run?: string;
  tasks: AgentTask[];
}

export interface HealthCheckResult {
  service: string;
  status: "healthy" | "unhealthy" | "warning";
  latency_ms: number;
  message: string;
  last_checked: string;
  configured?: boolean;
  provider?: string;
}

// ===== WORKFLOW GRAPH TYPES =====

export interface WorkflowNode {
  id: string;
  label: string;
  category: ModuleCategory;
  x: number;
  y: number;
  status: ModuleStatus;
  inputs: string[];
  outputs: string[];
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label: string;
}

// ===== EVENT BUS TYPES =====

export interface SystemEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: string;
}

// ===== RECOVERY TYPES =====

export interface RecoveryAction {
  id: string;
  error_source: string;
  error_message: string;
  fallback_chain: string[];
  current_fallback_index: number;
  status: "detected" | "analyzing" | "retrying" | "resolved" | "failed";
  timestamp: string;
}
