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
    let sourceHandle, targetHandle;
    
    if (isHorizontal) {
      if (isBackwardFlow) {
        // Backward flow: use bottom connections to avoid visual conflicts
        sourceHandle = 'bottom-source';
        targetHandle = 'bottom-target';
      } else {
        // Normal forward flow: left-to-right
        sourceHandle = 'right-source';
        targetHandle = 'left-target';
      }
    } else {
      if (isBackwardFlow) {
        // Backward flow in vertical layout: use right connections
        sourceHandle = 'right-source';
        targetHandle = 'right-target';
      } else {
        // Normal vertical flow: top-to-bottom
        sourceHandle = 'bottom-source';
        targetHandle = 'top-target';
      }
    }
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle,
      targetHandle,
      label: edge.label,
      style: {
        stroke: '#94a3b8',
        strokeWidth: 2,
        // Add subtle animation for backward flows to highlight them
        ...(isBackwardFlow && {
          strokeDasharray: '5,5',
          animation: 'dash 1s linear infinite',
        }),
      },
      markerEnd: {
        type: 'arrowclosed',
        width: 20,
        height: 20,
        color: '#94a3b8',
      },
      type: isBackwardFlow ? 'smoothstep' : 'default',
    };
  }).filter(Boolean) as Edge[];
  
  console.log('✅ Generated edges:', generatedEdges.length);
  return generatedEdges;
};

/**
 * Converts workflow data into positioned React Flow nodes
 * This bridges our data format with React Flow's expected format
 */
export const generateReactFlowNodes = (
  workflowData: WorkflowData,
  layout: ReturnType<typeof calculateSmartLayout>,
  isHorizontal: boolean
): Node[] => {
  const { positions } = layout;
  
  console.log('🎨 Generating React Flow nodes for', workflowData.nodes.length, 'workflow nodes');
  
  const reactFlowNodes = workflowData.nodes.map((workflowNode) => {
    const position = positions.get(workflowNode.id);
    
    if (!position) {
      console.error(`❌ No position found for node ${workflowNode.id}`);
      return null;
    }
    
    return {
      id: workflowNode.id,
      type: workflowNode.type,
      position: { x: position.x, y: position.y },
      data: {
        label: workflowNode.label,
        originalType: workflowNode.type,
      },
    };
  }).filter(Boolean) as Node[];
  
  console.log('✅ Generated React Flow nodes:', reactFlowNodes.length);
  return reactFlowNodes;
};

/**
 * ============= VISUAL REACT FLOW COMPONENTS =============
 * Custom node components that render in the workflow canvas
 */

/**
 * Status Node Component (Circular nodes representing states/statuses)
 * These represent points in time or conditions in the workflow
 */
const StatusNode = memo(({ data, selected }: NodeProps) => {
  console.log('🟢 Rendering Status Node:', data);
  
  return (
    <div 
      className={`
        relative w-24 h-24 rounded-full border-2 
        ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
        ${data.isHighlighted ? 'ring-4 ring-yellow-400 ring-opacity-70' : ''}
        bg-amber-50 border-amber-300 
        flex items-center justify-center
        cursor-pointer hover:shadow-lg transition-all duration-200
        shadow-md
      `}
    >
      {/* Connection handles - invisible but functional with proper IDs */}
      <Handle 
        id="left-target"
        type="target" 
        position={Position.Left} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="right-source"
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="top-target"
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="bottom-source"
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="right-target"
        type="target" 
        position={Position.Right} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="bottom-target"
        type="target" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      
      {/* Node content */}
      <div className="text-center">
        <div className="text-xs font-medium text-amber-800 leading-tight">
          {data.label as string}
        </div>
        {data.secondaryLabel && (
          <div className="text-xs text-amber-600 mt-1">
            {data.secondaryLabel as string}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Event Node Component (Rectangular nodes representing actions/events)
 * These represent actions that can be taken or events that occur
 */
const EventNode = memo(({ data, selected }: NodeProps) => {
  console.log('📦 Rendering Event Node:', data);
  
  return (
    <div 
      className={`
        relative px-4 py-3 min-w-[120px] h-16
        rounded-lg border-2
        ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
        ${data.isHighlighted ? 'ring-4 ring-yellow-400 ring-opacity-70' : ''}
        bg-slate-50 border-slate-300
        flex items-center justify-center
        cursor-pointer hover:shadow-lg transition-all duration-200
        shadow-md
      `}
    >
      {/* Connection handles - invisible but functional with proper IDs */}
      <Handle 
        id="left-target"
        type="target" 
        position={Position.Left} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="right-source"
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="top-target"
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="bottom-source"
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="right-target"
        type="target" 
        position={Position.Right} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      <Handle 
        id="bottom-target"
        type="target" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-transparent !border-transparent opacity-0" 
      />
      
      {/* Node content */}
      <div className="text-center">
        <div className="text-sm font-medium text-slate-700">
          {data.label as string}
        </div>
        {data.secondaryLabel && (
          <div className="text-xs text-slate-500 mt-1">
            {data.secondaryLabel as string}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * ============= NODE TYPE REGISTRY =============
 * Maps node types to their respective React components
 */
const nodeTypes = {
  status: StatusNode,  // Circular status nodes
  event: EventNode,    // Rectangular event nodes
};

/**
 * ============= MAIN WORKFLOW MANAGER COMPONENT =============
 * The primary component that orchestrates the entire workflow visualization
 */
export const WorkflowManager = () => {
  // ========== STATE MANAGEMENT ==========
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(defaultWorkflow);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // ========== WORKFLOW DATA PROCESSING ==========
  
  /**
   * Transform the selected workflow data for React Flow
   * This runs whenever the selected workflow or layout orientation changes
   */
  const currentWorkflowData = useMemo(() => {
    console.log('🔄 Processing workflow data for:', selectedWorkflow);
    
    const rawWorkflow = mockWorkflows[selectedWorkflow];
    if (!rawWorkflow) {
      console.error('❌ Workflow not found:', selectedWorkflow);
      return null;
    }

    const transformedData = transformWorkflowData(rawWorkflow);
    const validatedData = validateWorkflowData(transformedData);
    
    console.log('✅ Workflow data processed:', validatedData);
    return validatedData;
  }, [selectedWorkflow]);

  /**
   * Calculate layout and generate positioned nodes/edges
   * This handles the visual positioning and routing logic
   */
  const { processedNodes, processedEdges } = useMemo(() => {
    console.log('📐 Calculating layout for workflow visualization...');
    
    if (!currentWorkflowData) {
      return { processedNodes: [], processedEdges: [] };
    }

    // Use our smart layout algorithm
    const layoutConfig = { ...defaultLayoutConfig, isHorizontal };
    const layout = calculateSmartLayout(currentWorkflowData, layoutConfig);
    
    // Generate React Flow nodes with proper positioning
    const reactFlowNodes = generateReactFlowNodes(currentWorkflowData, layout, isHorizontal);
    const reactFlowEdges = generateSmartEdges(currentWorkflowData, layout, isHorizontal);
    
    console.log('✅ Layout calculated:', {
      nodes: reactFlowNodes.length,
      edges: reactFlowEdges.length,
      isHorizontal
    });
    
    return {
      processedNodes: reactFlowNodes,
      processedEdges: reactFlowEdges
    };
  }, [currentWorkflowData, isHorizontal]);

  /**
   * Update React Flow state when processed data changes
   * This ensures the visualization stays in sync
   */
  useEffect(() => {
    console.log('🔄 Updating React Flow state...');
    
    if (processedNodes.length > 0) {
      setNodes(processedNodes);
      setIsInitialized(true);
    }
    
    if (processedEdges.length > 0) {
      setEdges(processedEdges);
    }
  }, [processedNodes, processedEdges, setNodes, setEdges]);

  // ========== EVENT HANDLERS ==========

  /**
   * Handle new connections between nodes (user-created edges)
   */
  const onConnect = useCallback((params: Connection) => {
    console.log('🔗 Creating new connection:', params);
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  /**
   * Handle workflow selection changes
   */
  const handleWorkflowChange = useCallback((workflowId: string) => {
    console.log('🔄 Changing workflow to:', workflowId);
    setSelectedWorkflow(workflowId);
    setIsInitialized(false);
  }, []);

  /**
   * Handle layout orientation changes
   */
  const handleLayoutChange = useCallback(() => {
    console.log('🔄 Toggling layout orientation from', isHorizontal ? 'horizontal' : 'vertical');
    setIsHorizontal(!isHorizontal);
    setIsInitialized(false);
  }, [isHorizontal]);

  // ========== RENDER ==========
  
  // Loading state while data is being processed
  if (!currentWorkflowData || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading workflow visualization...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50">
      {/* Workflow Header Section */}
      <div className="bg-black text-white px-6 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-white"></div>
        <h1 className="text-lg font-semibold">
          {currentWorkflowData.name}
        </h1>
      </div>

      {/* Controls Section */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Workflow Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Workflow:</label>
            <select 
              value={selectedWorkflow}
              onChange={(e) => handleWorkflowChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(mockWorkflows).map(([id, workflow]) => (
                <option key={id} value={id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Toggle */}
          <Button
            onClick={handleLayoutChange}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <span>⚡</span>
            {isHorizontal ? 'Switch to Vertical' : 'Switch to Horizontal'}
          </Button>
        </div>

        {/* Modified Entity Section */}
        <div className="text-sm text-gray-600">
          Modified Entity: <span className="font-medium text-gray-900">Workflow Definition</span>
        </div>
      </div>

      {/* Main Workflow Canvas with Border */}
      <div className="p-4">
        <div className="relative w-full h-[calc(100vh-200px)] border-2 border-gray-300 bg-white rounded-lg shadow-sm">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionLineStyle={{
              stroke: '#94a3b8',
              strokeWidth: 2,
            }}
            defaultEdgeOptions={{
              style: {
                stroke: '#94a3b8',
                strokeWidth: 2,
              },
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#94a3b8',
              },
            }}
            fitView
            fitViewOptions={{
              padding: 0.2,
              maxZoom: 1.5,
              minZoom: 0.1,
            }}
            minZoom={0.1}
            maxZoom={2}
            attributionPosition="top-right"
          >
            {/* Background Pattern */}
            <Background
              color="#e2e8f0"
              gap={20}
              size={1}
            />
            
            {/* React Flow Controls - Must be inside ReactFlow component */}
            <Controls
              position="bottom-right"
              className="bg-white border border-gray-300 rounded-lg shadow-lg"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};