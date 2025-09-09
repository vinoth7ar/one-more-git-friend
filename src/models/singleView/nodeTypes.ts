/**
 * Core workflow data structure - represents a single workflow step
 */
export interface WorkflowNode {
  id: string;
  type: 'status' | 'event';  // Status = circular nodes, Event = rectangular nodes
  label: string;
}

/**
 * Connection between workflow nodes
 */
export interface WorkflowEdge {
  id: string;
  source: string;  // ID of source node
  target: string;  // ID of target node
  label: string;
}

/**
 * Complete workflow definition
 */
export interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Raw data that might come from backend APIs (flexible structure)
 */
export interface RawWorkflowData {
  [key: string]: any;
}

/**
 * Layout configuration for positioning nodes
 */
export interface LayoutConfig {
  workflowWidth: number;
  workflowHeight: number;
  stageWidth: number;
  stageHeight: number;
  circleSize: number;
  padding: number;
  spacing: number;
  isHorizontal: boolean;
}