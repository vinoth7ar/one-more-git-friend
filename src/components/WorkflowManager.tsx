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
      { id: "e1", source: "s1", target: "ev1", label: "Link" },
      { id: "e2", source: "ev1", target: "s2", label: "Created" },
      { id: "e3", source: "s2", target: "ev2", label: "Approve" },
      { id: "e4", source: "ev2", target: "s3", label: "Locked" },
      { id: "e5", source: "s3", target: "ev3", label: "Deploy EBM version" },
      { id: "e6", source: "ev3", target: "s4", label: "Deployed" },
      { id: "e7", source: "s3", target: "ev3", label: "Deploy EBM version" },
      { id: "e8", source: "ev3", target: "s4", label: "Deployed" },
      { id: "e9", source: "s4", target: "ev3", label: "Deploy EBM version" },
      { id: "e10", source: "ev3", target: "s4", label: "Deployed" },
      { id: "e11", source: "s2", target: "ev4", label: "Deploy EBM version" },
      { id: "e12", source: "ev4", target: "s5", label: "Canceled" }
    ]
  },
  'test-workflow': {
    id: "test-workflow-id",
    name: "Test Workflow",
    description: "Simple test workflow with two nodes",
    nodes: [
      { id: "test-event-1", type: "event", label: "Start" },
      { id: "test-event-2", type: "event", label: "Finish" },
      { id: "test-status-1", type: "status", label: "pending" },
      { id: "test-status-2", type: "status", label: "completed" }
    ],
    edges: [
      { id: "test-edge-1", source: "test-event-1", target: "test-status-1", label: "" },
      { id: "test-edge-2", source: "test-status-1", target: "test-event-2", label: "" },
      { id: "test-edge-3", source: "test-event-2", target: "test-status-2", label: "" }
    ]
  }
};

export const defaultWorkflow = 'ebm-version';

// ============= ADVANCED LAYOUT UTILITIES =============
export const defaultLayoutConfig: LayoutConfig = {
  workflowWidth: 1400,
  workflowHeight: 800,
  stageWidth: 160,
  stageHeight: 80,
  circleSize: 60,
  padding: 80,
  spacing: 200,
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

// Advanced layout algorithm with horizontal/vertical support
export const calculateSmartLayout = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
) => {
  const analysis = analyzeGraphStructure(workflowData);
  const { nodes, outgoing, startNodes } = analysis;
  const { padding, stageWidth, stageHeight, spacing, isHorizontal } = config;
  
  // Calculate levels using BFS
  const levels = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number; level: number }>();
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
  
  // Group nodes by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  });
  
  const maxLevel = Math.max(...Array.from(levels.values()));
  const levelCount = maxLevel + 1;
  
  // Calculate positions based on layout orientation
  if (isHorizontal) {
    // Horizontal layout: levels go left to right
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const x = padding + level * spacing;
      
      // Center nodes vertically within the level
      const totalHeight = nodesInLevel.length * stageHeight + (nodesInLevel.length - 1) * 60;
      const startY = padding + (800 - totalHeight) / 2; // Center in canvas
      
      nodesInLevel.forEach((nodeId, index) => {
        const y = startY + index * (stageHeight + 60);
        positions.set(nodeId, { x, y, level });
      });
    }
  } else {
    // Vertical layout: levels go top to bottom
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const y = padding + level * spacing;
      
      // Center nodes horizontally within the level
      const totalWidth = nodesInLevel.length * stageWidth + (nodesInLevel.length - 1) * 60;
      const startX = padding + (1200 - totalWidth) / 2; // Center in canvas
      
      nodesInLevel.forEach((nodeId, index) => {
        const x = startX + index * (stageWidth + 60);
        positions.set(nodeId, { x, y, level });
      });
    }
  }
  
  // Calculate canvas dimensions
  let canvasWidth, canvasHeight;
  if (isHorizontal) {
    canvasWidth = Math.max(levelCount * spacing + 2 * padding, 1200);
    canvasHeight = 800;
  } else {
    canvasWidth = 1200;
    canvasHeight = Math.max(levelCount * spacing + 2 * padding, 800);
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

// Smart edge routing to avoid overlaps
export const generateSmartEdges = (
  workflowData: WorkflowData,
  layout: ReturnType<typeof calculateSmartLayout>
): Edge[] => {
  const { positions } = layout;
  
  return workflowData.edges.map((edge, index) => {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    
    if (!sourcePos || !targetPos) {
      console.warn(`Edge ${edge.id} references non-existent nodes`);
      return null;
    }
    
    // Determine edge type based on layout
    let edgeType = 'smoothstep';
    let animated = false;
    
    // If nodes are on different levels, use different edge styling
    if (Math.abs(sourcePos.level - targetPos.level) > 1) {
      edgeType = 'smoothstep';
      animated = true;
    }
    
    return {
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: edgeType,
      animated,
      label: edge.label,
      style: {
        stroke: 'hsl(var(--primary))',
        strokeWidth: 2,
      },
      labelStyle: {
        fill: 'hsl(var(--foreground))',
        fontWeight: 600,
        fontSize: 12,
      },
      labelBgStyle: {
        fill: 'hsl(var(--background))',
        fillOpacity: 0.9,
        rx: 4,
        ry: 4,
      },
    };
  }).filter(Boolean) as Edge[];
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
      case 'workflow':
        return 'bg-workflow-canvas border-2 border-dashed border-workflow-border rounded-lg min-w-[900px] min-h-[500px] p-8 relative shadow-lg';
      case 'stage':
        return 'bg-workflow-node-bg border-2 border-workflow-stage-border rounded-md p-6 min-w-[200px] min-h-[120px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md';
      case 'data':
        let bgColor = 'bg-workflow-data-bg';
        if (nodeData.color === 'yellow') {
          bgColor = 'bg-workflow-data-bg';
        }
        return `${bgColor} border border-workflow-data-border px-4 py-2 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow transform rotate-[-2deg] shadow-sm rounded`;
      case 'pmf-tag':
        return 'bg-workflow-pmf-bg text-workflow-pmf-text px-4 py-2 text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity rounded shadow-md';
      case 'process':
        return 'bg-workflow-process-bg text-workflow-process-text border-workflow-stage-border border rounded px-3 py-1 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow';
      case 'entities-group':
        return 'bg-workflow-node-bg border border-workflow-stage-border rounded-md p-6 min-w-[600px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md';
      default:
        return 'bg-workflow-node-bg border-workflow-node-border border rounded p-3 cursor-pointer hover:shadow-md transition-shadow';
    }
  };

  const getWrapperStyles = () => {
    return 'border-4 border-workflow-border rounded-lg p-4 bg-workflow-canvas shadow-xl';
  };

  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log(`Clicked ${nodeData.type} node:`, nodeData.title);
  };

  if (nodeData.type === 'pmf-tag') {
    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="font-bold">
          {nodeData.title}
        </div>
      </div>
    );
  }

  if (nodeData.type === 'data') {
    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="flex items-center gap-2">
          <span className="font-medium">{nodeData.title}</span>
          <span className="text-xs font-bold">⋮</span>
        </div>
      </div>
    );
  }

  if (nodeData.type === 'entities-group') {
    const handleIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nodeData.onToggleEntities) {
        nodeData.onToggleEntities();
      }
    };

    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <span 
            className="cursor-pointer select-none text-lg leading-none"
            onClick={handleIconClick}
          >
            {nodeData.entitiesExpanded ? '▼' : '▲'}
          </span>
          <span>Modified Data Entities</span>
        </div>
        {nodeData.entitiesExpanded && (
          <div className="flex flex-wrap gap-3">
            {nodeData.entities?.map((entity) => {
              const bgColor = entity.color === 'yellow' ? 'bg-workflow-data-bg' : 'bg-muted';
              const borderColor = entity.color === 'yellow' ? 'border-workflow-data-border' : 'border-border';
              return (
                <div
                  key={entity.id}
                  className={`${bgColor} ${borderColor} border px-3 py-2 text-sm font-medium transform rotate-[-2deg] shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <div className="flex items-center gap-1">
                    <span>{entity.title}</span>
                    <span className="text-xs font-bold">⋮</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.type === 'workflow') {
    return (
      <div className={getWrapperStyles()}>
        <div className={getNodeStyles()}>        
          <div className="text-2xl font-bold text-foreground mb-2">
            {nodeData.title}
          </div>
          
          {nodeData.description && (
            <div className="text-base text-muted-foreground mb-8">
              {nodeData.description}
            </div>
          )}

          <div className="space-y-4">
            {/* Stage and Enrich boxes will be positioned inside */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={getNodeStyles()} onClick={handleClick}>
      <div className="text-lg font-bold text-foreground text-center">
        {nodeData.title}
      </div>
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border" />
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
    return 'w-20 h-20 rounded-full bg-workflow-circular border-2 border-workflow-circular-border flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200';
  };

  return (
    <div 
      className={getCircleStyles()}
      onClick={handleClick}
    >
      <div className="text-xs font-bold text-center text-foreground px-2 leading-tight">
        {nodeData.label}
      </div>
      
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border" />
    </div>
  );
};

// ============= HEADER COMPONENT (from WorkflowHeader.tsx) =============
const WorkflowHeader = () => {
  return (
    <div>
      <header className="bg-workflow-node-bg border-b border-workflow-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">EBM Studio</span>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <Input 
            placeholder="Search" 
            className="w-full border-primary/50 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-primary font-medium">Data Journeys</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Lineage</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">FDE</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Editor</a>
          </nav>
        </div>
      </header>

      <div className="bg-black text-white px-6 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">PMF</span>
        <div className="text-sm">...</div>
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
    { id: 'test-workflow', name: 'Test Workflow' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Workflow:</span>
      <select 
        value={selectedWorkflow}
        onChange={(e) => onWorkflowSelect(e.target.value)}
        className="px-3 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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

// Data loading utilities
export const loadWorkflowFromAPI = async (endpoint: string): Promise<WorkflowData> => {
  try {
    console.log('Loading workflow from API:', endpoint);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const rawData = await response.json();
    console.log('Raw API response:', rawData);
    
    const transformedData = transformWorkflowData(rawData);
    const validatedData = validateWorkflowData(transformedData);
    
    console.log('Final processed workflow data:', validatedData);
    return validatedData;
    
  } catch (error) {
    console.error('Error loading workflow from API:', error);
    
    // Return a default workflow if API fails
    return validateWorkflowData({
      id: 'api-error-fallback',
      name: 'API Error - Fallback Workflow',
      description: 'Failed to load workflow from API, showing fallback',
      nodes: [
        { id: 'error-start', type: 'status', label: 'Error' },
        { id: 'error-retry', type: 'event', label: 'Retry' }
      ],
      edges: [
        { id: 'error-edge', source: 'error-start', target: 'error-retry', label: 'Retry Loading' }
      ]
    });
  }
};

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
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    return generateSmartEdges(currentWorkflowData, layout);
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
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    const updatedEdges = generateSmartEdges(currentWorkflowData, layout);
    setEdges(updatedEdges);
  }, [currentWorkflowData, currentLayoutConfig, setEdges]);

  // Toggle layout orientation
  const toggleLayout = () => {
    setIsHorizontal(!isHorizontal);
  };

  // Load data from API endpoint if provided
  useEffect(() => {
    if (apiEndpoint && !externalWorkflowData) {
      const loadData = async () => {
        try {
          const data = await loadWorkflowFromAPI(apiEndpoint);
          if (onDataLoad) {
            onDataLoad(data);
          }
          console.log('Loaded workflow from API:', data);
        } catch (error) {
          console.error('Failed to load workflow from API:', error);
        }
      };
      
      loadData();
    }
  }, [apiEndpoint, externalWorkflowData, onDataLoad]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background to-muted/30">
      <WorkflowHeader />
      
      {/* Layout Controls */}
      <div className="px-8 py-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">
              {currentWorkflowData.name}
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentWorkflowData.description}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <WorkflowSelector 
              selectedWorkflow={selectedWorkflowId}
              onWorkflowSelect={handleWorkflowSelect}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLayout}
              className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            >
              <Layout className="h-4 w-4" />
              {isHorizontal ? 'Switch to Vertical' : 'Switch to Horizontal'}
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span>{isHorizontal ? 'Horizontal Layout' : 'Vertical Layout'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas - Full Width */}
      <div className="h-[calc(100vh-200px)] w-full p-8">
        <div className="h-full w-full relative overflow-hidden rounded-xl border border-border/50 shadow-2xl bg-gradient-to-br from-card to-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="w-full h-full"
            defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            minZoom={0.1}
            maxZoom={2}
          >
            <Background 
              color="hsl(var(--muted-foreground))" 
              gap={24}
              size={1}
            />
            <Controls 
              className="bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg rounded-lg"
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;

// ============= USAGE EXAMPLES =============
/*
// Example 1: Using with API endpoint
<WorkflowManager 
  apiEndpoint="/api/workflows/123"
  onDataLoad={(data) => console.log('Loaded:', data)}
/>

// Example 2: Using with external data (backend format like your images)
const backendData = {
  id: "4bde0616-c450-42b2-9fab-8af9bcc66dfa",
  name: "App Version",
  description: "workflow definition for onboarding a version of an application into EBM",
  edges: [
    {id: "e1", source: "s1", target: "ev1", label: "Initial load"},
    {id: "e2", source: "ev1", target: "s2", label: "Loaded"},
    // ... more edges as shown in your images
  ],
  nodes: [
    {id: "s1", type: "status", label: "Start"},
    {id: "s2", type: "status", label: "Loaded"},
    {id: "ev1", type: "event", label: "Load"},
    // ... more nodes
  ]
};

<WorkflowManager workflowData={backendData} />

// Example 3: Using with alternative data format
const alternativeFormat = {
  workflow: {
    workflow_id: "xyz-123",
    title: "My Workflow",
    summary: "A test workflow",
    states: [
      {node_id: "start", nodeType: "status", name: "Beginning"},
      {node_id: "process", nodeType: "event", name: "Processing"}
    ],
    transitions: [
      {edge_id: "t1", from: "start", to: "process", text: "Begin Process"}
    ]
  }
};

<WorkflowManager workflowData={alternativeFormat} />

// Example 4: Handle data transformation manually
const handleDataLoad = (rawData) => {
  const processedData = processWorkflowData(rawData);
  console.log('Processed workflow:', processedData);
};

<WorkflowManager 
  onDataLoad={handleDataLoad}
  apiEndpoint="/api/workflows/current"
/>
*/