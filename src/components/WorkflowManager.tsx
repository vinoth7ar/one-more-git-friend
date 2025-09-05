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
import { Input } from '@/components/ui/input';
import { RotateCcw, Layout } from 'lucide-react';

// ============= TYPES (from types.ts) =============
export interface WorkflowNode {
  id: string;
  type: 'status' | 'event';
  label: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// ============= DATA TRANSFORMATION UTILITIES =============
export interface RawWorkflowData {
  [key: string]: any;
}

// Flexible data transformer that can handle various backend response formats
export const transformWorkflowData = (rawData: RawWorkflowData): WorkflowData => {
  console.log('Transforming raw data:', rawData);
  
  // Try to extract workflow data from various possible structures
  const workflowData = rawData.workflow || rawData.data || rawData;
  
  // Extract basic properties with fallbacks
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

  // Transform nodes from various possible formats
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

  // Transform edges from various possible formats
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

  // Try to find nodes in various possible locations
  if (workflowData.nodes) {
    nodes = transformNodes(workflowData.nodes);
  } else if (workflowData.vertices) {
    nodes = transformNodes(workflowData.vertices);
  } else if (workflowData.states) {
    nodes = transformNodes(workflowData.states);
  } else if (workflowData.steps) {
    nodes = transformNodes(workflowData.steps);
  }

  // Try to find edges in various possible locations
  if (workflowData.edges) {
    edges = transformEdges(workflowData.edges);
  } else if (workflowData.connections) {
    edges = transformEdges(workflowData.connections);
  } else if (workflowData.transitions) {
    edges = transformEdges(workflowData.transitions);
  } else if (workflowData.links) {
    edges = transformEdges(workflowData.links);
  }

  console.log('Transformed workflow data:', { id, name, description, nodes, edges });

  return {
    id,
    name,
    description,
    nodes,
    edges
  };
};

// Validate transformed data and provide defaults if needed
export const validateWorkflowData = (data: WorkflowData): WorkflowData => {
  const validatedData = { ...data };
  
  // Ensure we have at least some nodes
  if (!validatedData.nodes || validatedData.nodes.length === 0) {
    validatedData.nodes = [
      { id: 'default-start', type: 'status', label: 'Start' },
      { id: 'default-end', type: 'status', label: 'End' }
    ];
  }
  
  // Ensure we have valid edges
  if (!validatedData.edges) {
    validatedData.edges = [];
  }
  
  // Remove any edges that reference non-existent nodes
  const nodeIds = new Set(validatedData.nodes.map(node => node.id));
  validatedData.edges = validatedData.edges.filter(edge => 
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  
  return validatedData;
};

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

// ============= MOCK DATA (from mock-data.ts) =============
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

// ============= ADVANCED LAYOUT UTILITIES =============
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

// Graph analysis utilities
export const analyzeGraphStructure = (workflowData: WorkflowData) => {
  const { nodes, edges } = workflowData;
  
  // Create adjacency maps
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  
  // Initialize maps
  nodes.forEach(node => {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  });
  
  // Build adjacency lists
  edges.forEach(edge => {
    if (outgoing.has(edge.source) && incoming.has(edge.target)) {
      outgoing.get(edge.source)!.push(edge.target);
      incoming.get(edge.target)!.push(edge.source);
    }
  });
  
  // Find root nodes (no incoming edges)
  const rootNodes = nodes.filter(node => 
    incoming.get(node.id)?.length === 0
  );
  
  // Find leaf nodes (no outgoing edges)
  const leafNodes = nodes.filter(node => 
    outgoing.get(node.id)?.length === 0
  );
  
  // If no clear root, find nodes with most outgoing connections
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

// Advanced layout algorithm with clean edge patterns
export const calculateSmartLayout = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
) => {
  const analysis = analyzeGraphStructure(workflowData);
  const { nodes, outgoing, incoming, startNodes } = analysis;
  const { padding, stageWidth, stageHeight, isHorizontal } = config;
  
  // Calculate levels using BFS for clean hierarchy
  const levels = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number; level: number; row: number }>();
  const visited = new Set<string>();
  
  // Start BFS from identified start nodes
  const queue: Array<{ nodeId: string; level: number }> = [];
  
  startNodes.forEach(node => {
    queue.push({ nodeId: node.id, level: 0 });
    levels.set(node.id, 0);
  });
  
  // BFS to assign levels
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const children = outgoing.get(nodeId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        const newLevel = level + 1;
        if (!levels.has(childId) || levels.get(childId)! > newLevel) {
          levels.set(childId, newLevel);
          queue.push({ nodeId: childId, level: newLevel });
        }
      }
    });
  }
  
  // Handle orphaned nodes
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  // Group nodes by level and arrange in rows for clean layout
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  });
  
  const maxLevel = Math.max(...Array.from(levels.values()));
  
  // Enhanced spacing for clean appearance
  const levelSpacing = 350; // Increased space between levels
  const nodeSpacing = 150;  // Clean spacing between nodes in same level
  
  // Calculate positions with optimized layout
  if (isHorizontal) {
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const x = padding + level * levelSpacing;
      
      // Arrange nodes in clean rows
      const totalHeight = nodesInLevel.length * stageHeight + (nodesInLevel.length - 1) * nodeSpacing;
      const startY = padding + Math.max(100, (1000 - totalHeight) / 2);
      
      nodesInLevel.forEach((nodeId, index) => {
        const y = startY + index * (stageHeight + nodeSpacing);
        positions.set(nodeId, { x, y, level, row: index });
      });
    }
  } else {
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const y = padding + level * levelSpacing;
      
      const totalWidth = nodesInLevel.length * stageWidth + (nodesInLevel.length - 1) * nodeSpacing;
      const startX = padding + Math.max(100, (1800 - totalWidth) / 2);
      
      nodesInLevel.forEach((nodeId, index) => {
        const x = startX + index * (stageWidth + nodeSpacing);
        positions.set(nodeId, { x, y, level, row: index });
      });
    }
  }
  
  // Calculate canvas dimensions
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

// Clean edge routing with proper connection points and enhanced debugging
export const generateSmartEdges = (
  workflowData: WorkflowData,
  layout: ReturnType<typeof calculateSmartLayout>
): Edge[] => {
  const { positions, levels } = layout;
  console.log('🔗 Generating edges for workflow:', workflowData.edges.length, 'edges');
  
  if (!workflowData.edges || workflowData.edges.length === 0) {
    console.warn('⚠️ No edges found in workflow data!');
    return [];
  }
  
  const generatedEdges = workflowData.edges.map((edge, index) => {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    
    if (!sourcePos || !targetPos) {
      console.error(`❌ Edge ${edge.id} references non-existent nodes - source: ${edge.source}, target: ${edge.target}`);
      return null;
    }
    
    const sourceLevel = levels.get(edge.source) || 0;
    const targetLevel = levels.get(edge.target) || 0;
    const isBackwardFlow = targetLevel <= sourceLevel && sourceLevel > 0;
    
    console.log(`✅ Edge ${edge.id}: ${edge.source} (level ${sourceLevel}) -> ${edge.target} (level ${targetLevel}), backward: ${isBackwardFlow}`);
    
    // Enhanced styling for visibility with bright colors
    const edgeStyle = {
      stroke: isBackwardFlow ? '#ff0000' : '#0066ff', // Bright red for backward, bright blue for forward
      strokeWidth: 4, // Increased stroke width
      strokeDasharray: isBackwardFlow ? '10,10' : undefined,
    };
    
    const generatedEdge: Edge = {
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true, // Make all edges animated for visibility
      style: edgeStyle,
      markerEnd: {
        type: 'arrowclosed',
        color: isBackwardFlow ? '#ff0000' : '#0066ff',
        width: 30,
        height: 30,
      },
      zIndex: 1000, // Ensure edges are above other elements
    };
    
    console.log('📍 Generated edge details:', generatedEdge);
    return generatedEdge;
  }).filter(Boolean) as Edge[];
  
  console.log('🎯 Total generated edges:', generatedEdges.length);
  console.log('📋 All edges:', generatedEdges);
  return generatedEdges;
};

// ============= NODE COMPONENTS =============

// WorkflowNode Data Interface (from WorkflowNode.tsx)
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

// WorkflowNode Component (from WorkflowNode.tsx)
const WorkflowNode = ({ data }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  
  const getNodeStyles = () => {
    switch (nodeData.type) {
      case 'stage':
        return 'bg-blue-100 border-2 border-blue-300 rounded-md p-6 min-w-[200px] min-h-[120px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md';
      default:
        return 'bg-gray-100 border-gray-300 border rounded p-3 cursor-pointer hover:shadow-md transition-shadow min-w-[180px] min-h-[100px]';
    }
  };

  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log(`Clicked ${nodeData.type} node:`, nodeData.title);
  };

  return (
    <div className={getNodeStyles()} onClick={handleClick}>
      {/* Connection handles for edge routing */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#3b82f6',
          border: '2px solid #1d4ed8',
          width: 16,
          height: 16,
          zIndex: 1001,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#3b82f6',
          border: '2px solid #1d4ed8',
          width: 16,
          height: 16,
          zIndex: 1001,
        }}
      />
      
      <div className="text-lg font-bold text-gray-800 text-center">
        {nodeData.title}
      </div>
    </div>
  );
};

// CircularNode Data Interface (from CircularNode.tsx)
export interface CircularNodeData extends Record<string, unknown> {
  label: string;
  onClick?: () => void;
  color?: string;
}

// CircularNode Component (from CircularNode.tsx)
const CircularNode = ({ data }: NodeProps) => {
  const nodeData = data as CircularNodeData;
  
  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log('Clicked status node:', nodeData.label);
  };

  const getCircleStyles = () => {
    return 'w-20 h-20 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200';
  };

  return (
    <div 
      className={getCircleStyles()}
      onClick={handleClick}
    >
      {/* Connection handles for circular nodes */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#22c55e',
          border: '2px solid #16a34a',
          width: 16,
          height: 16,
          zIndex: 1001,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#22c55e',
          border: '2px solid #16a34a',
          width: 16,
          height: 16,
          zIndex: 1001,
        }}
      />
      
      <div className="text-xs font-bold text-center text-gray-800 px-2 leading-tight">
        {nodeData.label}
      </div>
    </div>
  );
};

// ============= WORKFLOW SELECTOR COMPONENT =============
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

// ============= NODE CREATION UTILITIES =============
export const createAdvancedNodes = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
): Node[] => {
  console.log('Creating nodes with hierarchical layout for:', workflowData);
  
  const layout = calculateSmartLayout(workflowData, config);
  const { positions, canvasWidth, canvasHeight, analysis } = layout;
  
  const nodes: Node[] = [];

  // Create nodes based on hierarchical layout positions
  workflowData.nodes.forEach((workflowNode) => {
    const position = positions.get(workflowNode.id);
    
    if (!position) {
      console.warn(`No position found for node ${workflowNode.id}`);
      return;
    }

    // Determine node style based on type
    const nodeStyle = workflowNode.type === 'status' ? 
      { 
        width: config.circleSize, 
        height: config.circleSize,
        borderRadius: '50%'
      } : 
      { 
        width: config.stageWidth, 
        height: config.stageHeight 
      };

    nodes.push({
      id: workflowNode.id,
      type: workflowNode.type === 'status' ? 'circular' : 'workflow',
      position: { x: position.x, y: position.y },
      data: workflowNode.type === 'status' ? 
        {
          label: workflowNode.label,
        } as CircularNodeData :
        {
          title: workflowNode.label,
          type: 'stage',
        } as WorkflowNodeData,
      style: nodeStyle,
      draggable: true,
    });
  });

  console.log(`Created ${nodes.length} nodes with positions:`, nodes.map(n => ({ id: n.id, pos: n.position })));
  return nodes;
};

// ============= MAIN WORKFLOW MANAGER COMPONENT =============
interface WorkflowManagerProps {
  layoutConfig?: typeof defaultLayoutConfig;
  selectedWorkflowId?: string;
  workflowData?: WorkflowData | RawWorkflowData;
  onWorkflowSelect?: (workflowId: string) => void;
  onDataLoad?: (data: RawWorkflowData) => void;
  apiEndpoint?: string;
}

export const processWorkflowData = (inputData: WorkflowData | RawWorkflowData): WorkflowData => {
  // Check if data is already in the correct format
  if (inputData && 
      typeof inputData === 'object' && 
      'nodes' in inputData && 
      'edges' in inputData &&
      Array.isArray(inputData.nodes) &&
      Array.isArray(inputData.edges)) {
    console.log('Data appears to be in correct format, validating...');
    return validateWorkflowData(inputData as WorkflowData);
  }
  
  // Transform and validate the data
  console.log('Data needs transformation, processing...');
  const transformedData = transformWorkflowData(inputData as RawWorkflowData);
  return validateWorkflowData(transformedData);
};

const nodeTypes = {
  workflow: memo(WorkflowNode),
  circular: memo(CircularNode),
  stage: memo(WorkflowNode),
  data: memo(WorkflowNode),
  'pmf-tag': memo(WorkflowNode),
  'entities-group': memo(WorkflowNode),
};

const WorkflowManager = ({ 
  layoutConfig = defaultLayoutConfig,
  selectedWorkflowId: externalWorkflowId,
  workflowData: externalWorkflowData,
  onWorkflowSelect: externalOnWorkflowSelect,
  apiEndpoint,
  onDataLoad
}: WorkflowManagerProps = {}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(externalWorkflowId || defaultWorkflow);
  const [isHorizontal, setIsHorizontal] = useState(true);
  
  // Dynamic layout config based on orientation
  const currentLayoutConfig = useMemo(() => ({
    ...layoutConfig,
    isHorizontal
  }), [layoutConfig, isHorizontal]);
  
  // Memoize the processed workflow data to prevent infinite re-renders
  const currentWorkflowData = useMemo(() => {
    const rawData = externalWorkflowData || 
                    mockWorkflows[selectedWorkflowId] || 
                    mockWorkflows[defaultWorkflow];
    
    console.log('Processing workflow data once:', rawData);
    return processWorkflowData(rawData);
  }, [externalWorkflowData, selectedWorkflowId]);
  
  // Memoize initial nodes and edges using smart layout
  const initialNodes = useMemo(() => {
    return createAdvancedNodes(currentWorkflowData, currentLayoutConfig);
  }, [currentWorkflowData, currentLayoutConfig]);
  
  const initialEdges = useMemo(() => {
    console.log('Creating initial edges for workflow:', currentWorkflowData.name);
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    const edges = generateSmartEdges(currentWorkflowData, layout);
    console.log('Initial edges created:', edges.length);
    return edges;
  }, [currentWorkflowData, currentLayoutConfig]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle workflow selection
  const handleWorkflowSelect = (workflowId: string) => {
    if (externalOnWorkflowSelect) {
      externalOnWorkflowSelect(workflowId);
    } else {
      if (mockWorkflows[workflowId]) {
        setSelectedWorkflowId(workflowId);
      }
    }
  };

  // Update nodes when workflow data or layout changes
  useEffect(() => {
    const updatedNodes = createAdvancedNodes(currentWorkflowData, currentLayoutConfig);
    setNodes(updatedNodes);
  }, [currentWorkflowData, currentLayoutConfig, setNodes]);

  // Update edges when workflow data or layout changes
  useEffect(() => {
    console.log('Updating edges due to workflow or layout change');
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    const updatedEdges = generateSmartEdges(currentWorkflowData, layout);
    console.log('Setting updated edges:', updatedEdges.length);
    setEdges(updatedEdges);
  }, [currentWorkflowData, currentLayoutConfig, setEdges]);

  // Toggle layout orientation
  const toggleLayout = () => {
    setIsHorizontal(!isHorizontal);
  };

  return (
    <div className="h-screen w-full bg-gray-50">
      {/* Simplified Header - Only Essential Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
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
              className="flex items-center gap-2"
            >
              <Layout className="h-4 w-4" />
              {isHorizontal ? 'Vertical' : 'Horizontal'}
            </Button>
          </div>
        </div>
      </div>

      {/* Full Screen Canvas */}
      <div className="h-[calc(100vh-80px)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="w-full h-full"
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          minZoom={0.1}
          maxZoom={2}
          connectionLineStyle={{ stroke: '#0066ff', strokeWidth: 3 }}
          snapToGrid={true}
          snapGrid={[15, 15]}
        >
          <Background 
            color="#e5e7eb" 
            gap={20}
            size={1}
          />
          <Controls 
            className="bg-white/90 border border-gray-300 shadow-lg rounded-lg"
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowManager;