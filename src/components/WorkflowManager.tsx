import { useCallback, useState, useEffect, memo, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Layout } from 'lucide-react';

/**
 * ============= CORE TYPES & INTERFACES =============
 * These define the shape of our workflow data and nodes
 */

// Core workflow data structure - represents a single workflow step
export interface WorkflowNode {
  id: string;
  type: 'status' | 'event';  // Status = circular nodes, Event = rectangular nodes
  label: string;
}

// Connection between workflow nodes
export interface WorkflowEdge {
  id: string;
  source: string;  // ID of source node
  target: string;  // ID of target node
  label: string;
}

// Complete workflow definition
export interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// Raw data that might come from backend APIs (flexible structure)
export interface RawWorkflowData {
  [key: string]: any;
}

// Layout configuration for positioning nodes
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

/**
 * ============= MOCK DATA FOR DEMONSTRATION =============
 * Real-world examples showing how the workflow visualizer handles different scenarios
 */

export const mockWorkflows: Record<string, WorkflowData> = {
  'ebm-version': {
    id: "f564cd67-2502-46a1-8494-4f61df616811",
    name: "EBM Version",
    description: "Workflow definition for grouping a set of applications",
    nodes: [
      { id: "s1", type: "status", label: "Start" },
      { id: "s2", type: "status", label: "Created" },
      { id: "ev1", type: "event", label: "Link" },
      { id: "s3", type: "status", label: "Locked" },
      { id: "ev2", type: "event", label: "Approve" },
      { id: "s4", type: "status", label: "Deployed" },
      { id: "ev3", type: "event", label: "Deploy" },
      { id: "s5", type: "status", label: "Canceled" },
      { id: "ev4", type: "event", label: "Cancel" }
    ],
    edges: [
      { id: "e1", source: "s1", target: "ev1", label: "" },
      { id: "e2", source: "ev1", target: "s2", label: "" },
      { id: "e3", source: "s2", target: "ev2", label: "" },
      { id: "e4", source: "ev2", target: "s3", label: "" },
      { id: "e5", source: "s3", target: "ev3", label: "" },
      { id: "e6", source: "ev3", target: "s4", label: "" },
      { id: "e7", source: "s2", target: "ev4", label: "" },
      { id: "e8", source: "ev4", target: "s5", label: "" }
    ]
  },
  'mortgage-origination': {
    id: "mortgage-origination-001",
    name: "Mortgage Origination Workflow",
    description: "Complete mortgage loan origination process from application to funding",
    nodes: [
      { id: "app-start", type: "status", label: "Application Start" },
      { id: "collect-docs", type: "event", label: "Document Collection" },
      { id: "doc-review", type: "status", label: "Document Review" },
      { id: "credit-check", type: "event", label: "Credit Verification" },
      { id: "income-verify", type: "event", label: "Income Verification" },
      { id: "property-appraisal", type: "event", label: "Property Appraisal" },
      { id: "underwriting", type: "status", label: "Underwriting Review" },
      { id: "approval-decision", type: "event", label: "Approval Decision" },
      { id: "approved", type: "status", label: "Approved" },
      { id: "rejected", type: "status", label: "Rejected" },
      { id: "conditions", type: "status", label: "Conditional Approval" },
      { id: "fulfill-conditions", type: "event", label: "Fulfill Conditions" },
      { id: "final-approval", type: "event", label: "Final Approval" },
      { id: "closing", type: "status", label: "Closing Process" },
      { id: "funding", type: "status", label: "Loan Funded" }
    ],
    edges: [
      { id: "e1", source: "app-start", target: "collect-docs", label: "" },
      { id: "e2", source: "collect-docs", target: "doc-review", label: "" },
      { id: "e3", source: "doc-review", target: "credit-check", label: "" },
      { id: "e4", source: "credit-check", target: "income-verify", label: "" },
      { id: "e5", source: "income-verify", target: "property-appraisal", label: "" },
      { id: "e6", source: "property-appraisal", target: "underwriting", label: "" },
      { id: "e7", source: "underwriting", target: "approval-decision", label: "" },
      { id: "e8", source: "approval-decision", target: "approved", label: "" },
      { id: "e9", source: "approval-decision", target: "rejected", label: "" },
      { id: "e10", source: "approval-decision", target: "conditions", label: "" },
      { id: "e11", source: "conditions", target: "fulfill-conditions", label: "" },
      { id: "e12", source: "fulfill-conditions", target: "final-approval", label: "" },
      { id: "e13", source: "final-approval", target: "approved", label: "" },
      { id: "e14", source: "approved", target: "closing", label: "" },
      { id: "e15", source: "closing", target: "funding", label: "" }
    ]
  }
};

export const defaultWorkflow = 'ebm-version';

/**
 * ============= DATA TRANSFORMATION UTILITIES =============
 * These functions handle converting various backend data formats into our standard format
 */

/**
 * Transforms raw workflow data from backend APIs into our standardized format
 * Handles various possible field names and structures
 */
export const transformWorkflowData = (rawData: RawWorkflowData): WorkflowData => {
  console.log('🔄 Transforming raw workflow data:', rawData);
  
  // Extract workflow data from various possible structures
  const workflowData = rawData.workflow || rawData.data || rawData;
  
  // Extract basic properties with multiple fallback options
  const id = workflowData.id || 
             workflowData.workflowId || 
             workflowData.workflow_id || 
             workflowData.uuid || 
             `workflow-${Date.now()}`;
             
  const name = workflowData.name || 
               workflowData.title || 
               workflowData.workflow_name || 
               workflowData.workflowName || 
               'Unnamed Workflow';
               
  const description = workflowData.description || 
                      workflowData.desc || 
                      workflowData.summary || 
                      'No description available';

  /**
   * Transform nodes from various possible formats
   * Handles different field naming conventions
   */
  const transformNodes = (rawNodes: any[]): WorkflowNode[] => {
    if (!Array.isArray(rawNodes)) return [];
    
    return rawNodes.map((node, index) => ({
      id: node.id || node.nodeId || node.node_id || `node-${index}`,
      type: (node.type?.toLowerCase() === 'status' || 
             node.nodeType?.toLowerCase() === 'status' || 
             node.node_type?.toLowerCase() === 'status') ? 'status' : 'event',
      label: node.label || node.name || node.title || node.text || `Node ${index + 1}`
    }));
  };

  /**
   * Transform edges from various possible formats
   * Handles different field naming conventions for connections
   */
  const transformEdges = (rawEdges: any[]): WorkflowEdge[] => {
    if (!Array.isArray(rawEdges)) return [];
    
    return rawEdges.map((edge, index) => ({
      id: edge.id || edge.edgeId || edge.edge_id || `edge-${index}`,
      source: edge.source || edge.from || edge.sourceId || edge.source_id || '',
      target: edge.target || edge.to || edge.targetId || edge.target_id || '',
      label: edge.label || edge.name || edge.title || edge.text || ''
    }));
  };

  // Extract nodes and edges with various fallback strategies
  let nodes: WorkflowNode[] = [];
  let edges: WorkflowEdge[] = [];

  // Try to find nodes in various possible field names
  if (workflowData.nodes) {
    nodes = transformNodes(workflowData.nodes);
  } else if (workflowData.vertices) {
    nodes = transformNodes(workflowData.vertices);
  } else if (workflowData.states) {
    nodes = transformNodes(workflowData.states);
  } else if (workflowData.steps) {
    nodes = transformNodes(workflowData.steps);
  }

  // Try to find edges in various possible field names
  if (workflowData.edges) {
    edges = transformEdges(workflowData.edges);
  } else if (workflowData.connections) {
    edges = transformEdges(workflowData.connections);
  } else if (workflowData.transitions) {
    edges = transformEdges(workflowData.transitions);
  } else if (workflowData.links) {
    edges = transformEdges(workflowData.links);
  }

  console.log('✅ Transformed workflow data:', { id, name, description, nodes: nodes.length, edges: edges.length });

  return { id, name, description, nodes, edges };
};

/**
 * Validates transformed data and provides sensible defaults
 * Ensures we always have a workable workflow even with incomplete data
 */
export const validateWorkflowData = (data: WorkflowData): WorkflowData => {
  const validatedData = { ...data };
  
  // Ensure we have at least some nodes for a meaningful workflow
  if (!validatedData.nodes || validatedData.nodes.length === 0) {
    validatedData.nodes = [
      { id: 'default-start', type: 'status', label: 'Start' },
      { id: 'default-end', type: 'status', label: 'End' }
    ];
  }
  
  // Initialize edges array if missing
  if (!validatedData.edges) {
    validatedData.edges = [];
  }
  
  // Remove any edges that reference non-existent nodes (data integrity)
  const nodeIds = new Set(validatedData.nodes.map(node => node.id));
  validatedData.edges = validatedData.edges.filter(edge => 
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  
  return validatedData;
};

/**
 * ============= LAYOUT & POSITIONING ALGORITHMS =============
 * These handle the automatic positioning of nodes for optimal visual layout
 */

// Default configuration for layout calculations
export const defaultLayoutConfig: LayoutConfig = {
  workflowWidth: 1800,
  workflowHeight: 1200,
  stageWidth: 200,
  stageHeight: 120,
  circleSize: 80,
  padding: 150,
  spacing: 350,
  isHorizontal: true,
};

/**
 * Analyzes the graph structure to understand connections and hierarchy
 * This helps us position nodes intelligently
 */
export const analyzeGraphStructure = (workflowData: WorkflowData) => {
  const { nodes, edges } = workflowData;
  
  // Create adjacency maps for efficient graph traversal
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  
  // Initialize maps for all nodes
  nodes.forEach(node => {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  });
  
  // Build adjacency lists from edges
  edges.forEach(edge => {
    if (outgoing.has(edge.source) && incoming.has(edge.target)) {
      outgoing.get(edge.source)!.push(edge.target);
      incoming.get(edge.target)!.push(edge.source);
    }
  });
  
  // Find root nodes (no incoming edges) - these are natural starting points
  const rootNodes = nodes.filter(node => 
    incoming.get(node.id)?.length === 0
  );
  
  // Find leaf nodes (no outgoing edges) - these are natural end points
  const leafNodes = nodes.filter(node => 
    outgoing.get(node.id)?.length === 0
  );
  
  // If no clear root exists, use nodes with most outgoing connections as start points
  const startNodes = rootNodes.length > 0 ? rootNodes : 
    nodes.sort((a, b) => 
      (outgoing.get(b.id)?.length || 0) - (outgoing.get(a.id)?.length || 0)
    ).slice(0, 1);
  
  return {
    nodes,
    edges,
    outgoing,
    incoming,
    rootNodes,
    leafNodes,
    startNodes,
    nodeCount: nodes.length,
    edgeCount: edges.length
  };
};

/**
 * Calculates optimal node positions using hierarchical layout
 * Uses BFS to assign levels and arranges nodes for minimal edge crossings
 */
export const calculateSmartLayout = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
) => {
  const analysis = analyzeGraphStructure(workflowData);
  const { nodes, outgoing, startNodes } = analysis;
  const { padding, stageWidth, stageHeight, isHorizontal } = config;
  
  // Use BFS to calculate hierarchical levels
  const levels = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number; level: number; row: number }>();
  const visited = new Set<string>();
  
  // Initialize BFS queue with start nodes at level 0
  const queue: Array<{ nodeId: string; level: number }> = [];
  
  startNodes.forEach(node => {
    queue.push({ nodeId: node.id, level: 0 });
    levels.set(node.id, 0);
  });
  
  // BFS traversal to assign levels (hierarchical positioning)
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    // Process all children of current node
    const children = outgoing.get(nodeId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        const newLevel = level + 1;
        // Assign to the earliest possible level (closest to root)
        if (!levels.has(childId) || levels.get(childId)! > newLevel) {
          levels.set(childId, newLevel);
          queue.push({ nodeId: childId, level: newLevel });
        }
      }
    });
  }
  
  // Handle any orphaned nodes (not connected to main graph)
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  // Group nodes by level for organized positioning
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  });
  
  const maxLevel = Math.max(...Array.from(levels.values()));
  
  // Enhanced spacing for clean, professional appearance
  const levelSpacing = 350; // Distance between hierarchy levels
  const nodeSpacing = 150;  // Distance between nodes in same level
  
  // Calculate actual positions based on layout orientation
  if (isHorizontal) {
    // Horizontal layout: left-to-right flow
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const x = padding + level * levelSpacing;
      
      // Center nodes vertically within level
      const totalHeight = nodesInLevel.length * stageHeight + (nodesInLevel.length - 1) * nodeSpacing;
      const startY = padding + Math.max(100, (1000 - totalHeight) / 2);
      
      nodesInLevel.forEach((nodeId, index) => {
        const y = startY + index * (stageHeight + nodeSpacing);
        positions.set(nodeId, { x, y, level, row: index });
      });
    }
  } else {
    // Vertical layout: top-to-bottom flow
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const y = padding + level * levelSpacing;
      
      // Center nodes horizontally within level
      const totalWidth = nodesInLevel.length * stageWidth + (nodesInLevel.length - 1) * nodeSpacing;
      const startX = padding + Math.max(100, (1800 - totalWidth) / 2);
      
      nodesInLevel.forEach((nodeId, index) => {
        const x = startX + index * (stageWidth + nodeSpacing);
        positions.set(nodeId, { x, y, level, row: index });
      });
    }
  }
  
  // Calculate canvas dimensions to fit all nodes
  let canvasWidth, canvasHeight;
  if (isHorizontal) {
    canvasWidth = Math.max((maxLevel + 1) * levelSpacing + 2 * padding + stageWidth, 1800);
    canvasHeight = 1200;
  } else {
    canvasWidth = 2000;
    canvasHeight = Math.max((maxLevel + 1) * levelSpacing + 2 * padding + stageHeight, 1200);
  }
  
  return {
    positions,
    levels,
    levelGroups,
    canvasWidth,
    canvasHeight,
    maxLevel,
    analysis
  };
};

/**
 * Generates React Flow edges with smart routing and styling
 * Handles different connection patterns based on layout and flow direction
 */
export const generateSmartEdges = (
  workflowData: WorkflowData,
  layout: ReturnType<typeof calculateSmartLayout>,
  isHorizontal: boolean = true
): Edge[] => {
  const { positions, levels } = layout;
  console.log('🔗 Generating smart edges for', workflowData.edges.length, 'edge definitions');
  
  if (!workflowData.edges || workflowData.edges.length === 0) {
    console.warn('⚠️ No edges found in workflow data');
    return [];
  }
  
  const generatedEdges = workflowData.edges.map((edge, index) => {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    
    // Validate that both nodes exist in the layout
    if (!sourcePos || !targetPos) {
      console.error(`❌ Edge ${edge.id} references invalid nodes - source: ${edge.source}, target: ${edge.target}`);
      return null;
    }
    
    const sourceLevel = levels.get(edge.source) || 0;
    const targetLevel = levels.get(edge.target) || 0;
    
    // Detect backward flow (connections that go against main hierarchy)
    const isBackwardFlow = targetLevel <= sourceLevel && sourceLevel > 0;
    
    console.log(`✅ Processing edge ${edge.id}: ${edge.source} → ${edge.target} (levels: ${sourceLevel} → ${targetLevel})`);
    
    // Determine connection points based on layout orientation and flow direction
    let sourceHandle: string | undefined;
    let targetHandle: string | undefined;
    
    if (isHorizontal) {
      // Horizontal layout: standard left-to-right, bottom connections for backward flows
      if (isBackwardFlow) {
        sourceHandle = 'bottom-source';
        targetHandle = 'bottom-target';
      } else {
        sourceHandle = 'right-source';
        targetHandle = 'left-target';
      }
    } else {
      // Vertical layout: standard top-to-bottom, right connections for backward flows
      if (isBackwardFlow) {
        sourceHandle = 'right-source';
        targetHandle = 'right-target';
      } else {
        sourceHandle = 'bottom-source';
        targetHandle = 'top-target';
      }
    }
    
    // Professional styling inspired by Figma design systems
    const edgeStyle = {
      stroke: isBackwardFlow ? '#94a3b8' : '#475569', // Subtle gray colors
      strokeWidth: 2,
      strokeDasharray: isBackwardFlow ? '6,6' : undefined, // Dashed lines for backward flow
    };
    
    const generatedEdge: Edge = {
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',  // Smooth curved connections
      animated: false,     // Static lines for professional appearance
      style: edgeStyle,
      markerEnd: {
        type: 'arrowclosed',
        color: isBackwardFlow ? '#94a3b8' : '#475569',
        width: 20,
        height: 20,
      },
      zIndex: 1,
    };
    
    return generatedEdge;
  }).filter(Boolean) as Edge[];
  
  console.log('🎯 Successfully generated', generatedEdges.length, 'edges');
  return generatedEdges;
};

/**
 * ============= REACT FLOW NODE COMPONENTS =============
 * Custom node components for different workflow element types
 */

// Data interface for rectangular workflow nodes
export interface WorkflowNodeData extends Record<string, unknown> {
  title: string;
  description?: string;
  type: 'workflow' | 'stage' | 'data' | 'process' | 'pmf-tag' | 'entities-group';
  items?: string[];
  entities?: Array<{ id: string; title: string; color?: string }>;
  onClick?: () => void;
  entitiesExpanded?: boolean;
  onToggleEntities?: () => void;
  isSelected?: boolean;
  color?: string;
}

/**
 * WorkflowNode Component - Rectangular nodes for events/processes
 * Styled to match Figma design with context-appropriate colors
 */
const WorkflowNode = ({ data }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  
  // Dynamic styling based on node type and context
  const getNodeStyles = () => {
    switch (nodeData.type) {
      case 'stage':
        return 'bg-slate-100 border-2 border-slate-300 rounded-lg p-4 min-w-[180px] min-h-[100px] cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm';
      case 'data':
        // Amber nodes for data collection/input steps (inspired by Figma "Accept Price" nodes)
        return 'bg-amber-200 border-2 border-amber-400 rounded-lg p-3 min-w-[140px] min-h-[80px] cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm';
      case 'process':
        // Gray nodes for processing/decision steps
        return 'bg-gray-200 border-2 border-gray-400 rounded-lg p-4 min-w-[200px] min-h-[120px] cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm';
      default:
        return 'bg-white border-2 border-gray-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow min-w-[160px] min-h-[80px] shadow-sm';
    }
  };

  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log(`🖱️ Clicked ${nodeData.type} node:`, nodeData.title);
  };

  return (
    <div className={getNodeStyles()} onClick={handleClick}>
      {/* Connection handles for all possible orientations and flow directions */}
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 12,
          height: 12,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 12,
          height: 12,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 12,
          height: 12,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 12,
          height: 12,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 12,
          height: 12,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 12,
          height: 12,
          borderRadius: '50%',
        }}
      />
      
      <div className="text-sm font-semibold text-gray-800 text-center">
        {nodeData.title}
      </div>
    </div>
  );
};

// Data interface for circular status nodes
export interface CircularNodeData extends Record<string, unknown> {
  label: string;
  onClick?: () => void;
  color?: string;
}

/**
 * CircularNode Component - Circular nodes for status/states
 * Uses semantic colors based on status type (start, success, error, etc.)
 */
const CircularNode = ({ data }: NodeProps) => {
  const nodeData = data as CircularNodeData;
  
  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log('🖱️ Clicked status node:', nodeData.label);
  };

  // Semantic color assignment based on status meaning
  const getCircleColor = () => {
    const label = nodeData.label.toLowerCase();
    if (label.includes('start')) return 'bg-emerald-100 border-emerald-400';
    if (label.includes('cancel') || label.includes('reject')) return 'bg-gray-300 border-gray-500';
    if (label.includes('accept') || label.includes('approv') || label.includes('fund')) return 'bg-blue-100 border-blue-400';
    if (label.includes('lock')) return 'bg-purple-100 border-purple-400';
    return 'bg-slate-100 border-slate-400'; // default neutral state
  };

  return (
    <div 
      className={`w-20 h-20 rounded-full ${getCircleColor()} border-2 flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all duration-200`}
      onClick={handleClick}
    >
      {/* Connection handles matching rectangular nodes */}
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 10,
          height: 10,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 10,
          height: 10,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 10,
          height: 10,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 10,
          height: 10,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 10,
          height: 10,
          borderRadius: '50%',
        }}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        style={{
          background: '#64748b',
          border: '2px solid #475569',
          width: 10,
          height: 10,
          borderRadius: '50%',
        }}
      />
      
      <div className="text-xs font-bold text-center text-gray-700 px-1 leading-tight">
        {nodeData.label}
      </div>
    </div>
  );
};

/**
 * ============= WORKFLOW SELECTOR COMPONENT =============
 * Dropdown for switching between different workflow examples
 */

interface WorkflowSelectorProps {
  selectedWorkflow: string;
  onWorkflowSelect: (workflowId: string) => void;
}

const WorkflowSelector = ({ selectedWorkflow, onWorkflowSelect }: WorkflowSelectorProps) => {
  const workflows = [
    { id: 'ebm-version', name: 'EBM Version' },
    { id: 'mortgage-origination', name: 'Mortgage Origination' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Workflow:</span>
      <select 
        value={selectedWorkflow}
        onChange={(e) => onWorkflowSelect(e.target.value)}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {workflows.map((workflow) => (
          <option key={workflow.id} value={workflow.id}>
            {workflow.name}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * ============= NODE CREATION UTILITIES =============
 * Functions to convert workflow data into positioned React Flow nodes
 */

/**
 * Creates React Flow nodes with intelligent positioning and styling
 * Assigns appropriate visual types based on workflow node types and labels
 */
export const createAdvancedNodes = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
): Node[] => {
  console.log('🏗️ Creating positioned nodes for workflow:', workflowData.name);
  
  const layout = calculateSmartLayout(workflowData, config);
  const { positions } = layout;
  
  const nodes: Node[] = [];

  // Transform each workflow node into a positioned React Flow node
  workflowData.nodes.forEach((workflowNode) => {
    const position = positions.get(workflowNode.id);
    
    if (!position) {
      console.warn(`⚠️ No position calculated for node ${workflowNode.id}`);
      return;
    }

    // Determine visual node type and styling based on workflow semantics
    let nodeType = 'workflow';
    let nodeData: WorkflowNodeData | CircularNodeData;
    
    if (workflowNode.type === 'status') {
      // Status nodes are circular
      nodeType = 'circular';
      nodeData = {
        label: workflowNode.label,
      } as CircularNodeData;
    } else {
      // Event nodes are rectangular with context-appropriate styling
      let subType = 'stage';
      
      // Intelligent sub-type detection based on label content
      if (workflowNode.label.toLowerCase().includes('price') || 
          workflowNode.label.toLowerCase().includes('collect') ||
          workflowNode.label.toLowerCase().includes('link')) {
        subType = 'data'; // Data collection steps get amber styling
      } else if (workflowNode.label.toLowerCase().includes('decision') ||
                 workflowNode.label.toLowerCase().includes('process') ||
                 workflowNode.label.toLowerCase().includes('review')) {
        subType = 'process'; // Processing steps get gray styling
      }
      
      nodeData = {
        title: workflowNode.label,
        type: subType,
      } as WorkflowNodeData;
    }

    nodes.push({
      id: workflowNode.id,
      type: nodeType,
      position: { x: position.x, y: position.y },
      data: nodeData,
      draggable: true, // Allow manual repositioning
    });
  });

  console.log(`✅ Created ${nodes.length} positioned nodes`);
  return nodes;
};

/**
 * ============= DATA PROCESSING UTILITIES =============
 * High-level functions for preparing workflow data for visualization
 */

/**
 * Processes raw workflow data through the full transformation and validation pipeline
 * This is the main entry point for converting any workflow data format
 */
export const processWorkflowData = (inputData: WorkflowData | RawWorkflowData): WorkflowData => {
  // Check if data is already in the correct format (optimization)
  if (inputData && 
      typeof inputData === 'object' && 
      'nodes' in inputData && 
      'edges' in inputData &&
      Array.isArray(inputData.nodes) &&
      Array.isArray(inputData.edges)) {
    console.log('📋 Data already in correct format, validating...');
    return validateWorkflowData(inputData as WorkflowData);
  }
  
  // Transform and validate the data through the full pipeline
  console.log('🔄 Raw data detected, processing through transformation pipeline...');
  const transformedData = transformWorkflowData(inputData as RawWorkflowData);
  return validateWorkflowData(transformedData);
};

/**
 * ============= REACT FLOW NODE TYPE REGISTRY =============
 * Registers our custom node components with React Flow
 */

const nodeTypes = {
  workflow: memo(WorkflowNode),
  circular: memo(CircularNode),
  stage: memo(WorkflowNode),
  data: memo(WorkflowNode),
  'pmf-tag': memo(WorkflowNode),
  'entities-group': memo(WorkflowNode),
};

/**
 * ============= MAIN WORKFLOW MANAGER COMPONENT =============
 * The primary component that orchestrates the entire workflow visualization
 */

interface WorkflowManagerProps {
  layoutConfig?: typeof defaultLayoutConfig;
  selectedWorkflowId?: string;
  workflowData?: WorkflowData | RawWorkflowData;
  onWorkflowSelect?: (workflowId: string) => void;
  onDataLoad?: (data: RawWorkflowData) => void;
  apiEndpoint?: string;
}

/**
 * WorkflowManager - Complete workflow visualization component
 * 
 * Features:
 * - Automatic layout with hierarchical positioning
 * - Support for horizontal and vertical orientations
 * - Mock data examples for demonstration
 * - Flexible data input (supports various backend formats)
 * - Professional Figma-inspired styling
 * - Interactive node selection and manipulation
 */
const WorkflowManager = ({ 
  layoutConfig = defaultLayoutConfig,
  selectedWorkflowId: externalWorkflowId,
  workflowData: externalWorkflowData,
  onWorkflowSelect: externalOnWorkflowSelect,
  apiEndpoint,
  onDataLoad
}: WorkflowManagerProps = {}) => {
  // State management for workflow selection and layout orientation
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(externalWorkflowId || defaultWorkflow);
  const [isHorizontal, setIsHorizontal] = useState(true);
  
  // Dynamic layout configuration based on current orientation
  const currentLayoutConfig = useMemo(() => ({
    ...layoutConfig,
    isHorizontal
  }), [layoutConfig, isHorizontal]);
  
  // Memoized workflow data processing to prevent unnecessary recalculations
  const currentWorkflowData = useMemo(() => {
    const rawData = externalWorkflowData || 
                    mockWorkflows[selectedWorkflowId] || 
                    mockWorkflows[defaultWorkflow];
    
    console.log('📊 Processing workflow data for visualization:', rawData.name || 'Unknown');
    return processWorkflowData(rawData);
  }, [externalWorkflowData, selectedWorkflowId]);
  
  // Memoized node generation with smart positioning
  const initialNodes = useMemo(() => {
    return createAdvancedNodes(currentWorkflowData, currentLayoutConfig);
  }, [currentWorkflowData, currentLayoutConfig]);
  
  // Memoized edge generation with intelligent routing
  const initialEdges = useMemo(() => {
    console.log('🔗 Generating edges for workflow visualization');
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    const edges = generateSmartEdges(currentWorkflowData, layout, isHorizontal);
    console.log('✅ Generated', edges.length, 'edges with smart routing');
    return edges;
  }, [currentWorkflowData, currentLayoutConfig, isHorizontal]);

  // React Flow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle new connections created by user interaction
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle workflow selection from dropdown
  const handleWorkflowSelect = (workflowId: string) => {
    if (externalOnWorkflowSelect) {
      externalOnWorkflowSelect(workflowId);
    } else {
      if (mockWorkflows[workflowId]) {
        setSelectedWorkflowId(workflowId);
      }
    }
  };

  // Update nodes when workflow or layout changes
  useEffect(() => {
    const updatedNodes = createAdvancedNodes(currentWorkflowData, currentLayoutConfig);
    setNodes(updatedNodes);
  }, [currentWorkflowData, currentLayoutConfig, setNodes]);

  // Update edges when workflow or layout changes
  useEffect(() => {
    console.log('🔄 Updating edge layout due to configuration change');
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    const updatedEdges = generateSmartEdges(currentWorkflowData, layout, isHorizontal);
    setEdges(updatedEdges);
  }, [currentWorkflowData, currentLayoutConfig, setEdges, isHorizontal]);

  // Toggle between horizontal and vertical layouts
  const toggleLayout = () => {
    console.log('🔄 Switching layout orientation from', isHorizontal ? 'horizontal' : 'vertical', 'to', !isHorizontal ? 'horizontal' : 'vertical');
    setIsHorizontal(!isHorizontal);
  };

  return (
    // Main container with professional background
    <div className="h-screen w-full" style={{ backgroundColor: '#f8fafc' }}>
      {/* Control header with workflow selection and layout toggle */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <WorkflowSelector 
              selectedWorkflow={selectedWorkflowId}
              onWorkflowSelect={handleWorkflowSelect}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLayout}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
              title={`Switch to ${isHorizontal ? 'vertical' : 'horizontal'} layout`}
            >
              <Layout className="h-4 w-4" />
              {isHorizontal ? 'Vertical' : 'Horizontal'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main visualization canvas with border container */}
      <div className="h-[calc(100vh-80px)] w-full p-6">
        {/* Professional border container inspired by Figma design */}
        <div 
          className="h-full w-full rounded-lg shadow-lg overflow-hidden"
          style={{ 
            backgroundColor: '#ffffff',
            border: '3px solid #4285f4', // Distinctive blue border
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Professional drop shadow
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="w-full h-full"
            defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            minZoom={0.1}
            maxZoom={2}
            connectionLineStyle={{ stroke: '#475569', strokeWidth: 2 }}
            snapToGrid={true}
            snapGrid={[15, 15]}
          >
            {/* Subtle grid background for professional appearance */}
            <Background 
              color="#e2e8f0" 
              gap={20}
              size={1}
              style={{ backgroundColor: '#ffffff' }}
            />
            
            {/* Clean control panel */}
            <Controls 
              className="bg-white/95 border border-gray-300 shadow-md rounded-lg"
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;