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
  verticalSpacing: number;
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

// ============= LAYOUT UTILITIES (from layout-utils.ts) =============
export const defaultLayoutConfig: LayoutConfig = {
  workflowWidth: 800,
  workflowHeight: 450,
  stageWidth: 220,
  stageHeight: 90,
  circleSize: 64,
  padding: 30,
  verticalSpacing: 40,
};

export const calculateDynamicLayout = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
) => {
  const { nodes } = workflowData;
  const { stageWidth, padding, verticalSpacing, stageHeight, circleSize } = config;

  const statusNodes = nodes.filter(node => node.type === 'status');
  const eventNodes = nodes.filter(node => node.type === 'event');

  const maxNodes = Math.max(statusNodes.length, eventNodes.length);
  const minSpacing = 60;
  const dynamicWorkflowWidth = Math.max(600, (2 * padding) + (maxNodes * stageWidth) + ((maxNodes - 1) * minSpacing));
  const dynamicWorkflowHeight = Math.max(350, (2 * padding) + stageHeight + verticalSpacing + circleSize + 60);
  
  const availableWidth = dynamicWorkflowWidth - (2 * padding);
  const totalNodeWidth = maxNodes * stageWidth;
  const nodeSpacing = maxNodes > 1 ? Math.max(minSpacing, (availableWidth - totalNodeWidth) / (maxNodes - 1)) : 0;

  const eventY = 70;
  const statusY = eventY + stageHeight + verticalSpacing;

  return {
    dynamicWorkflowWidth,
    dynamicWorkflowHeight,
    nodeSpacing: Math.max(nodeSpacing, 60),
    eventY,
    statusY,
    getEventPosition: (index: number) => ({
      x: padding + (index * (stageWidth + nodeSpacing)),
      y: eventY,
    }),
    getStatusPosition: (index: number) => ({
      x: padding + (index * (stageWidth + nodeSpacing)) + (stageWidth / 2) - (circleSize / 2),
      y: statusY,
    }),
  };
};

// ============= CONNECTION UTILITIES (from connection-utils.ts) =============
export const generateIntelligentConnections = (workflowData: WorkflowData): Edge[] => {
  const edges: Edge[] = [];
  
  const eventNodes = workflowData.nodes.filter(node => node.type === 'event');
  const statusNodes = workflowData.nodes.filter(node => node.type === 'status');

  eventNodes.forEach((eventNode, index) => {
    if (statusNodes[index]) {
      edges.push({
        id: `event-to-status-${index}`,
        source: eventNode.id,
        target: statusNodes[index].id,
        style: { stroke: '#666', strokeWidth: 2 },
        type: 'smoothstep',
      });
    }
    
    if (statusNodes[index] && eventNodes[index + 1]) {
      edges.push({
        id: `status-to-event-${index}`,
        source: statusNodes[index].id,
        target: eventNodes[index + 1].id,
        style: { stroke: '#666', strokeWidth: 2 },
        type: 'smoothstep',
      });
    }
  });

  return edges;
};

export const updateConnectionsForWorkflow = (
  workflowData: WorkflowData,
  existingEdges: Edge[] = []
): Edge[] => {
  const newConnections = generateIntelligentConnections(workflowData);
  const customEdges = existingEdges.filter(edge => 
    !newConnections.some(newEdge => newEdge.id === edge.id)
  );
  return [...newConnections, ...customEdges];
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

// ============= SIDEBAR COMPONENT (from WorkflowSidebar.tsx) =============
interface WorkflowSidebarProps {
  selectedWorkflow: string;
  onWorkflowSelect: (workflowId: string) => void;
}

const WorkflowSidebar = ({ selectedWorkflow, onWorkflowSelect }: WorkflowSidebarProps) => {
  const legendItems = [
    { color: 'bg-primary', label: 'Application' },
    { color: 'bg-workflow-stage-bg border border-workflow-stage-border', label: 'Workflow' },
    { color: 'bg-muted', label: 'Business Goal' },
    { color: 'bg-workflow-data-bg border border-workflow-data-border', label: 'Data Entity' },
  ];

  const workflows = [
    { id: 'ebm-version', name: 'EBM Version' },
    { id: 'test-workflow', name: 'Test Workflow' },
  ];

  return (
    <div className="w-80 bg-workflow-bg border-l border-workflow-border p-4 space-y-4">
      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-medium mb-3">Customize View</h3>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" defaultChecked className="rounded" />
          Expand all data entities
        </label>
      </div>

      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-medium mb-3">Legend</h3>
        <div className="space-y-2">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-medium mb-3">Other Workflows</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Choose a different workflow to visualize
        </p>
        <div className="space-y-2">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`bg-workflow-stage-bg border rounded p-3 text-xs font-medium text-center cursor-pointer transition-colors ${
                selectedWorkflow === workflow.id 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-workflow-stage-border hover:bg-workflow-stage-border/20'
              }`}
              onClick={() => onWorkflowSelect(workflow.id)}
            >
              {workflow.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============= NODE CREATION UTILITIES =============
export const createDynamicNodes = (
  workflowData: WorkflowData,
  entitiesExpanded: boolean,
  onToggleEntities: () => void,
  config: LayoutConfig = defaultLayoutConfig
): Node[] => {
  const nodes: Node[] = [];
  const layout = calculateDynamicLayout(workflowData, config);

  // Main workflow container
  nodes.push({
    id: workflowData.id,
    type: 'workflow',
    position: { x: 20, y: 60 },
    data: {
      title: workflowData.name,
      description: workflowData.description,
      type: 'workflow',
    } as WorkflowNodeData,
    style: { width: layout.dynamicWorkflowWidth, height: layout.dynamicWorkflowHeight },
    draggable: true,
  });

  const statusNodes = workflowData.nodes.filter(node => node.type === 'status');
  const eventNodes = workflowData.nodes.filter(node => node.type === 'event');

  // Event nodes (rectangular, first row)
  eventNodes.forEach((event, index) => {
    const position = layout.getEventPosition(index);
    
    nodes.push({
      id: event.id,
      type: 'workflow',
      position,
      data: {
        title: event.label,
        type: 'stage',
      } as WorkflowNodeData,
      parentId: workflowData.id,
      extent: 'parent',
      style: { width: config.stageWidth, height: config.stageHeight },
      draggable: true,
    });
  });

  // Status nodes (circular, second row)
  statusNodes.forEach((status, index) => {
    const position = layout.getStatusPosition(index);
    
    nodes.push({
      id: status.id,
      type: 'circular',
      position,
      data: {
        label: status.label,
      } as CircularNodeData,
      parentId: workflowData.id,
      extent: 'parent',
      draggable: true,
    });
  });

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
  const [entitiesExpanded, setEntitiesExpanded] = useState(false);
  
  // Memoize the processed workflow data to prevent infinite re-renders
  const currentWorkflowData = useMemo(() => {
    const rawData = externalWorkflowData || 
                    mockWorkflows[selectedWorkflowId] || 
                    mockWorkflows[defaultWorkflow];
    
    console.log('Processing workflow data once:', rawData);
    return processWorkflowData(rawData);
  }, [externalWorkflowData, selectedWorkflowId]);
  
  // Memoize initial nodes and edges
  const initialNodes = useMemo(() => {
    return createDynamicNodes(
      currentWorkflowData, 
      entitiesExpanded, 
      () => setEntitiesExpanded(!entitiesExpanded),
      layoutConfig
    );
  }, [currentWorkflowData, entitiesExpanded, layoutConfig]);
  
  const initialEdges = useMemo(() => {
    return updateConnectionsForWorkflow(currentWorkflowData);
  }, [currentWorkflowData]);

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
        setEntitiesExpanded(false);
      }
    }
  };

  // Update nodes when entities expansion state changes or workflow changes
  useEffect(() => {
    const updatedNodes = createDynamicNodes(
      currentWorkflowData,
      entitiesExpanded,
      () => setEntitiesExpanded(!entitiesExpanded),
      layoutConfig
    );
    setNodes(updatedNodes);
  }, [entitiesExpanded, currentWorkflowData, layoutConfig, setNodes]);

  // Update connections when workflow data changes
  useEffect(() => {
    const updatedEdges = updateConnectionsForWorkflow(currentWorkflowData);
    setEdges(updatedEdges);
  }, [currentWorkflowData, setEdges]);

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
    <div className="h-screen w-full">
      <WorkflowHeader />
      
      <div className="flex h-[calc(100vh-120px)] w-full bg-workflow-bg">
        {/* Main Canvas */}
        <div className="flex-1 h-full p-8">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-workflow-canvas rounded-lg"
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
          >
            <Background 
              color="#999999" 
              gap={20}
              size={2}
            />
            <Controls className="bg-white border border-gray-300 shadow-lg rounded-lg" />
          </ReactFlow>
        </div>

        {/* Sidebar */}
        <WorkflowSidebar 
          selectedWorkflow={selectedWorkflowId}
          onWorkflowSelect={handleWorkflowSelect}
        />
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