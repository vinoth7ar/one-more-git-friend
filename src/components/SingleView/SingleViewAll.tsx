// ============================================================================
// SINGLE VIEW - ALL IN ONE FILE (Material UI Version - Fixed)
// ============================================================================
// This file contains the complete SingleView functionality using only Material UI components.
// It can be split into separate files later using the comment sections below.

import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Container,
  Box,
  Paper,
  Grid,
  IconButton,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Stack
} from '@mui/material';
import {
  Visibility,
  ArrowBack,
  Settings,
  ArrowForward
} from '@mui/icons-material';
// ============================================================================
// WORKFLOW BUILDER DEPENDENCIES SECTION (All Inlined)
// ============================================================================
// SPLIT SUGGESTION: Move to separate files as indicated in comments

// ===========================================
// WORKFLOW NODE DATA INTERFACE (from WorkflowNode.tsx)
// SPLIT TO: src/components/workflow/WorkflowNode.tsx
// ===========================================
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

// ===========================================
// CIRCULAR NODE DATA INTERFACE (from CircularNode.tsx)
// SPLIT TO: src/components/workflow/CircularNode.tsx
// ===========================================
export interface CircularNodeData extends Record<string, unknown> {
  label: string;
  onClick?: () => void;
  color?: string;
}

// ===========================================
// WORKFLOW NODE COMPONENT (from WorkflowNode.tsx)
// SPLIT TO: src/components/workflow/WorkflowNode.tsx
// ===========================================
const WorkflowNode = ({ data }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const getNodeStyles = () => {
    switch (nodeData.type) {
      case 'workflow':
        return 'bg-card border-2 border-dashed border-workflow-border rounded-lg min-w-[800px] min-h-[450px] p-6 relative shadow-sm';
      case 'stage':
        return 'bg-card border border-workflow-stage-border rounded-md p-4 min-w-[240px] min-h-[100px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-sm';
      case 'data':
        let bgColor = 'bg-workflow-data-bg';
        if (nodeData.color === 'yellow') {
          bgColor = 'bg-workflow-data-bg';
        }
        return `${bgColor} border border-workflow-data-border px-4 py-2 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow transform rotate-[-2deg] shadow-sm`;
      case 'pmf-tag':
        return 'bg-workflow-pmf-bg text-workflow-pmf-text px-3 py-1 text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity transform skew-x-[15deg] shadow-md';
      case 'process':
        return 'bg-workflow-process-bg text-workflow-process-text border-workflow-stage-border border rounded px-3 py-1 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow';
      case 'entities-group':
        return 'bg-primary text-primary-foreground border border-primary rounded-md p-4 min-w-[520px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-sm';
      default:
        return 'bg-workflow-node-bg border-workflow-node-border border rounded p-3 cursor-pointer hover:shadow-md transition-shadow';
    }
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
        <div className="text-sm font-bold text-primary-foreground mb-3 flex items-center gap-2">
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
      <div className={getNodeStyles()}>        
        <div className="text-xl font-bold text-foreground mb-2">
          {nodeData.title}
        </div>
        
        {nodeData.description && (
          <div className="text-sm text-muted-foreground mb-6">
            {nodeData.description}
          </div>
        )}

        <div className="space-y-4">
          {/* Stage and Enrich boxes will be positioned inside */}
        </div>
      </div>
    );
  }

  return (
    <div className={getNodeStyles()} onClick={handleClick}>
      <div className="text-sm font-bold text-foreground mb-2">
        {nodeData.title}
      </div>
      {nodeData.description && (
        <div className="text-xs text-muted-foreground leading-tight">
          {nodeData.description}
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
    </div>
  );
};

const MemoizedWorkflowNode = memo(WorkflowNode);

// ===========================================
// CIRCULAR NODE COMPONENT (from CircularNode.tsx)
// SPLIT TO: src/components/workflow/CircularNode.tsx
// ===========================================
const CircularNode = ({ data }: NodeProps) => {
  const nodeData = data as CircularNodeData;
  
  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log('Clicked status node:', nodeData.label);
  };

  const getCircleStyles = () => {
    return 'w-16 h-16 rounded-full bg-workflow-circular border border-workflow-circular-border flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-all duration-200';
  };

  return (
    <div 
      className={getCircleStyles()}
      onClick={handleClick}
    >
      <div className="text-[10px] font-bold text-center text-foreground px-1 leading-tight">
        {nodeData.label}
      </div>
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
    </div>
  );
};

const MemoizedCircularNode = memo(CircularNode);

// ===========================================
// LAYOUT UTILITIES (from layout-utils.ts)
// SPLIT TO: src/components/workflow/layout-utils.ts
// ===========================================
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
  const { stages, statusNodes, entities } = workflowData;
  const { workflowWidth, stageWidth, padding, verticalSpacing, stageHeight, circleSize } = config;

  // Calculate horizontal spacing based on number of stages
  const availableWidth = workflowWidth - (2 * padding);
  const totalStageWidth = stages.length * stageWidth;
  const stageSpacing = stages.length > 1 ? (availableWidth - totalStageWidth) / (stages.length - 1) : 0;

  // Calculate positions for each row
  const stageY = 70;
  const circleY = stageY + stageHeight + verticalSpacing;
  const entitiesY = circleY + circleSize + verticalSpacing;

  return {
    stageSpacing: Math.max(stageSpacing, 20), // Minimum spacing
    stageY,
    circleY,
    entitiesY,
    getStagePosition: (index: number) => ({
      x: padding + (index * (stageWidth + stageSpacing)),
      y: stageY,
    }),
    getCirclePosition: (index: number) => ({
      x: padding + (index * (stageWidth + stageSpacing)) + (stageWidth / 2) - (circleSize / 2),
      y: circleY,
    }),
    getEntitiesPosition: () => ({
      x: padding,
      y: entitiesY,
    }),
  };
};

export const createDynamicNodes = (
  workflowData: WorkflowData,
  entitiesExpanded: boolean,
  onToggleEntities: () => void,
  config: LayoutConfig = defaultLayoutConfig
): Node[] => {
  const nodes: Node[] = [];
  const layout = calculateDynamicLayout(workflowData, config);

  // PMF Tag (outside workflow)
  nodes.push({
    id: 'pmf-tag',
    type: 'pmf-tag',
    position: { x: 20, y: 20 },
    data: {
      title: 'PMF',
      type: 'pmf-tag',
      onClick: () => console.log('PMF tag clicked'),
    } as WorkflowNodeData,
    draggable: true,
  });

  // Main workflow container
  nodes.push({
    id: workflowData.workflow.id,
    type: 'workflow',
    position: { x: 20, y: 60 },
    data: {
      title: workflowData.workflow.title,
      description: workflowData.workflow.description,
      type: 'workflow',
    } as WorkflowNodeData,
    style: { width: config.workflowWidth, height: config.workflowHeight },
    draggable: true,
  });

  // Stage nodes - positioned dynamically
  workflowData.stages.forEach((stage, index) => {
    const position = layout.getStagePosition(index);
    
    nodes.push({
      id: stage.id,
      type: 'stage',
      position,
      data: {
        title: stage.title,
        description: stage.description,
        type: 'stage',
        color: stage.color,
        onClick: () => console.log(`${stage.title} event clicked`),
      } as WorkflowNodeData,
      parentId: workflowData.workflow.id,
      extent: 'parent',
      style: { width: config.stageWidth, height: config.stageHeight },
      draggable: true,
    });
  });

  // Status nodes (circular) - positioned dynamically
  workflowData.statusNodes.forEach((status, index) => {
    const position = layout.getCirclePosition(index);
    
    nodes.push({
      id: status.id,
      type: 'circular',
      position,
      data: {
        label: status.label,
        color: status.color,
        onClick: () => console.log(`${status.label} status clicked`),
      } as CircularNodeData,
      parentId: workflowData.workflow.id,
      extent: 'parent',
      draggable: true,
    });
  });

  // Entities group node
  const entitiesPosition = layout.getEntitiesPosition();
  nodes.push({
    id: 'entities-group',
    type: 'entities-group',
    position: entitiesPosition,
    data: {
      title: 'Data Entities',
      type: 'entities-group',
      entities: workflowData.entities,
      entitiesExpanded,
      onToggleEntities,
      onClick: () => console.log('Entities group clicked'),
    } as WorkflowNodeData,
    parentId: workflowData.workflow.id,
    extent: 'parent' as const,
    draggable: true,
  });

  return nodes;
};

// ===========================================
// CONNECTION UTILITIES (from connection-utils.ts)
// SPLIT TO: src/components/workflow/connection-utils.ts
// ===========================================
export const generateIntelligentConnections = (workflowData: WorkflowData): Edge[] => {
  const edges: Edge[] = [];
  const { stages, statusNodes } = workflowData;

  // Connect stages to their corresponding status nodes
  stages.forEach((stage, index) => {
    // Find corresponding status node (either by explicit connection or by index)
    const correspondingStatus = statusNodes.find(status => 
      status.connectedToStage === stage.id
    ) || statusNodes[index];

    if (correspondingStatus) {
      edges.push({
        id: `${stage.id}-to-${correspondingStatus.id}`,
        source: stage.id,
        target: correspondingStatus.id,
        style: { stroke: '#000', strokeWidth: 1 },
        type: 'smoothstep',
      });
    }
  });

  // Connect status nodes to next stages in sequence
  statusNodes.forEach((statusNode, index) => {
    const nextStage = stages[index + 1];
    if (nextStage) {
      edges.push({
        id: `${statusNode.id}-to-${nextStage.id}`,
        source: statusNode.id,
        target: nextStage.id,
        style: { stroke: '#666', strokeWidth: 1 },
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
  // Generate new intelligent connections
  const newConnections = generateIntelligentConnections(workflowData);
  
  // Keep any custom user-added edges that don't conflict
  const customEdges = existingEdges.filter(edge => 
    !newConnections.some(newEdge => newEdge.id === edge.id)
  );

  return [...newConnections, ...customEdges];
};

// ===========================================
// WORKFLOW SIDEBAR COMPONENT (from WorkflowSidebar.tsx)  
// SPLIT TO: src/components/workflow/WorkflowSidebar.tsx
// ===========================================
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
  ];

  return (
    <div className="w-80 bg-workflow-bg border-l border-workflow-border p-4 space-y-4">
      {/* Customize View */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Customize View</h3>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" defaultChecked className="rounded" />
          Expand all data entities
        </label>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Legend</h3>
        <div className="space-y-2">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Other Workflows */}
      <Card className="p-4">
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
      </Card>
    </div>
  );
};

// ===========================================
// WORKFLOW BUILDER COMPONENT (from WorkflowBuilder.tsx)
// SPLIT TO: src/components/workflow/WorkflowBuilder.tsx
// ===========================================
interface WorkflowBuilderProps {
  layoutConfig?: typeof defaultLayoutConfig;
  selectedWorkflowId?: string;
  workflowData?: WorkflowData;
  onWorkflowSelect?: (workflowId: string) => void;
}

// MEMOIZED NODE TYPES - Define outside component to prevent re-creation
// SPLIT TO: src/components/workflow/nodeTypes.ts
const nodeTypes = {
  workflow: MemoizedWorkflowNode,
  circular: MemoizedCircularNode,
  stage: MemoizedWorkflowNode,
  data: MemoizedWorkflowNode,
  'pmf-tag': MemoizedWorkflowNode,
  'entities-group': MemoizedWorkflowNode,
};

const WorkflowBuilder = ({ 
  layoutConfig = defaultLayoutConfig,
  selectedWorkflowId: externalWorkflowId,
  workflowData: externalWorkflowData,
  onWorkflowSelect: externalOnWorkflowSelect
}: WorkflowBuilderProps = {}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(externalWorkflowId || defaultWorkflow);
  const [entitiesExpanded, setEntitiesExpanded] = useState(false);
  
  // Get current workflow data - prefer external data, fallback to mock data
  const rawWorkflowData = externalWorkflowData || 
                          mockWorkflows[selectedWorkflowId] || 
                          mockWorkflows[defaultWorkflow];
                          
  // Convert SimpleWorkflow to WorkflowData if needed
  const currentWorkflowData = useMemo(() => {
    if (!rawWorkflowData) return null;
    if (isSimpleWorkflow(rawWorkflowData)) {
      return convertSimpleWorkflowToWorkflowData(rawWorkflowData);
    }
    return rawWorkflowData as WorkflowData;
  }, [rawWorkflowData]);
  
  // Create initial nodes and edges dynamically
  const initialNodes = currentWorkflowData ? createDynamicNodes(
    currentWorkflowData, 
    entitiesExpanded, 
    () => setEntitiesExpanded(!entitiesExpanded),
    layoutConfig
  ) : [];
  const initialEdges = currentWorkflowData ? updateConnectionsForWorkflow(currentWorkflowData) : [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle workflow selection - FIXED for proper navigation
  const handleWorkflowSelect = (workflowId: string) => {
    if (externalOnWorkflowSelect) {
      // Use external handler (for SingleView navigation)
      externalOnWorkflowSelect(workflowId);
    } else {
      // Use internal state (for standalone usage)
      if (mockWorkflows[workflowId]) {
        setSelectedWorkflowId(workflowId);
        setEntitiesExpanded(false);
        
        // Update URL to reflect the change
        const newUrl = `/visualization/workflow/${workflowId}`;
        window.history.pushState({}, '', newUrl);
      }
    }
  };

  // Update nodes when entities expansion state changes or workflow changes
  useEffect(() => {
    if (!currentWorkflowData) return;
    
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
    if (!currentWorkflowData) return;
    
    const updatedEdges = updateConnectionsForWorkflow(currentWorkflowData);
    setEdges(updatedEdges);
  }, [currentWorkflowData, setEdges]);

  return (
    <div className="flex h-screen w-full bg-workflow-bg">
      {/* Main Canvas */}
      <div className="flex-1 h-full p-2">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-workflow-canvas rounded-lg"
          defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
          nodesDraggable={false}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background 
            color="#d1d5db" 
            gap={16}
            size={1}
          />
          <Controls className="bg-card border border-border shadow-lg rounded-lg" />
        </ReactFlow>
      </div>

      {/* Sidebar */}
      <WorkflowSidebar 
        selectedWorkflow={selectedWorkflowId}
        onWorkflowSelect={handleWorkflowSelect}
      />
    </div>
  );
};

// ============================================================================
// WORKFLOW TYPES SECTION (Inlined from workflow/types.ts)
// ============================================================================

export interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  color?: string;
}

export interface WorkflowStatusNode {
  id: string;
  label: string;
  color?: string;
  connectedToStage?: string;
  connectedToEntities?: string[];
}

export interface WorkflowEntity {
  id: string;
  title: string;
  color?: string;
}

export interface WorkflowData {
  workflow: {
    id: string;
    title: string;
    description: string;
  };
  stages: WorkflowStage[];
  statusNodes: WorkflowStatusNode[];
  entities: WorkflowEntity[];
}

export interface LayoutConfig {
  workflowWidth: number;
  workflowHeight: number;
  stageWidth: number;
  stageHeight: number;
  circleSize: number;
  padding: number;
  verticalSpacing: number;
}

// ============================================================================
// MOCK DATA SECTION (Inlined from workflow/mock-data.ts)
// ============================================================================

// New workflow structure based on uploaded JSON
export interface SimpleWorkflowNode {
  id: string;
  type: 'status' | 'event';
  label: string;
}

export interface SimpleWorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SimpleWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: SimpleWorkflowNode[];
  edges: SimpleWorkflowEdge[];
}

// Converter function to transform SimpleWorkflow to WorkflowData
export function convertSimpleWorkflowToWorkflowData(simpleWorkflow: SimpleWorkflow): WorkflowData {
  return {
    workflow: {
      id: simpleWorkflow.id,
      title: simpleWorkflow.name,
      description: simpleWorkflow.description,
    },
    stages: simpleWorkflow.nodes
      .filter(node => node.type === 'event')
      .map(node => ({
        id: node.id,
        title: node.label,
        description: `${node.type} node`,
        color: 'default'
      })),
    statusNodes: simpleWorkflow.nodes
      .filter(node => node.type === 'status')
      .map(node => ({
        id: node.id,
        label: node.label,
        color: 'default'
      })),
    entities: [] // Empty for simple workflows
  };
}

// Helper function to check if data is SimpleWorkflow
export function isSimpleWorkflow(data: any): data is SimpleWorkflow {
  return data && typeof data.name === 'string' && Array.isArray(data.nodes) && Array.isArray(data.edges);
}

// Updated mock workflows with new structure
export const mockWorkflows: Record<string, SimpleWorkflow> = {
  'ebm-version': {
    id: 'f564cd67-2502-46a1-8494-4f61df616811',
    name: 'EBM Version',
    description: 'Workflow definition for grouping a set of application versions into an EBM version',
    nodes: [
      {
        id: 'n1',
        type: 'status',
        label: 'Start'
      },
      {
        id: 'n2',
        type: 'status',
        label: 'Created'
      },
      {
        id: 'n3',
        type: 'event',
        label: 'Link'
      },
      {
        id: 'n4',
        type: 'status',
        label: 'Deployed'
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'n1',
        target: 'n3',
        label: 'Create EBM version'
      },
      {
        id: 'e2',
        source: 'n3',
        target: 'n2',
        label: 'Created'
      },
      {
        id: 'e3',
        source: 'n2',
        target: 'n3',
        label: 'Modify EBM version'
      },
      {
        id: 'e4',
        source: 'n3',
        target: 'n4',
        label: 'Deploy'
      }
    ]
  }
};

export const defaultWorkflow = 'ebm-version';

// ============================================================================
// TYPES SECTION - Move to: src/components/SingleView/types.ts
// ============================================================================

export interface SelectionState {
  selectedType: 'workflow' | 'entity' | null;
  selectedId: string | null;
  customizations: ViewCustomizations;
}

export interface ViewCustomizations {
  expandAllEntities: boolean;
  showLegend: boolean;
  showMiniMap: boolean;
}

export interface WorkflowOption {
  id: string;
  title: string;
  description: string;
  category: 'workflow' | 'entity';
}

// ============================================================================
// REMOVED CONTEXT SECTION - Going directly to visualization
// ============================================================================

// ============================================================================
// HOOKS SECTION - Move to: src/components/SingleView/hooks/useWorkflowData.ts
// ============================================================================

// Backend integration hook - Updated to handle both WorkflowData and SimpleWorkflow
export function useWorkflowData(type: 'workflow' | 'entity' | null, id: string | null): WorkflowData | SimpleWorkflow | null {
  const [backendData, setBackendData] = useState<WorkflowData | SimpleWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch from backend
  const fetchWorkflowFromBackend = async (workflowId: string): Promise<WorkflowData | SimpleWorkflow | null> => {
    try {
      // TODO: Replace with actual backend API call
      // const response = await fetch(`/api/workflows/${workflowId}`);
      // const data = await response.json();
      // return data;
      
      // For now, simulate backend delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockWorkflows[workflowId] || null;
    } catch (err) {
      console.error('Failed to fetch workflow from backend:', err);
      return null;
    }
  };

  // Effect to load data when type/id changes
  useEffect(() => {
    if (!type || !id) {
      setBackendData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchWorkflowFromBackend(id)
      .then(data => {
        setBackendData(data);
        if (!data) {
          setError(`No ${type} found with id: ${id}`);
        }
      })
      .catch(err => {
        setError(err.message);
        setBackendData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [type, id]);

  return useMemo(() => {
    if (!type || !id) return null;
    
    // Return backend data if available, otherwise fallback to mock data
    return backendData || mockWorkflows[id] || null;
  }, [type, id, backendData]);
}

export function useAvailableOptions() {
  return useMemo(() => {
    // Convert mock workflows to selection options
    const workflowOptions = Object.entries(mockWorkflows).map(([id, data]) => ({
      id,
      title: data.name, // Changed from data.workflow.title to data.name
      description: data.description, // Changed from data.workflow.description to data.description
      category: 'workflow' as const,
    }));

    // For MVP, we only have workflows
    // In the future, add entity options here
    const entityOptions: any[] = [];

    return {
      workflows: workflowOptions,
      entities: entityOptions,
    };
  }, []);
}

// Hook to get available workflows for sidebar
export function useAvailableWorkflows() {
  return useMemo(() => {
    return Object.entries(mockWorkflows).map(([id, data]) => ({
      id,
      title: data.name, // Changed from data.workflow.title to data.name
      description: data.description, // Changed from data.workflow.description to data.description
    }));
  }, []);
}

// ============================================================================
// API SERVICE SECTION - Move to: src/components/SingleView/services/WorkflowAPI.ts
// ============================================================================

// Backend API service for workflow data
export class WorkflowAPI {
  private static baseURL = '/api'; // Configure your backend URL
  
  // Fetch workflow data by ID
  static async fetchWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate that the response matches our WorkflowData interface
      if (!data.workflow || !data.stages || !data.statusNodes || !data.entities) {
        throw new Error('Invalid workflow data format from backend');
      }

      return data;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  // Fetch all available workflows
  static async fetchAvailableWorkflows(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/workflows`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available workflows:', error);
      throw error;
    }
  }
}

// ============================================================================
// WORKFLOW SELECTOR COMPONENT - Move to: src/components/SingleView/components/WorkflowSelector.tsx
// ============================================================================

interface WorkflowSelectorProps {
  workflows: WorkflowOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function WorkflowSelector({ workflows, selectedId, onSelect }: WorkflowSelectorProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Workflows
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose up to one workflow to visualize (MVP)
      </Typography>
      
      <Stack spacing={2}>
        {workflows.map((workflow) => (
          <Paper
            key={workflow.id}
            sx={{
              p: 2,
              cursor: 'pointer',
              border: selectedId === workflow.id ? 2 : 1,
              borderColor: selectedId === workflow.id ? 'primary.main' : 'divider',
              '&:hover': {
                boxShadow: 2,
                borderColor: 'text.secondary'
              }
            }}
            onClick={() => onSelect(workflow.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {workflow.title}
              </Typography>
              <Box 
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: 2,
                  borderColor: selectedId === workflow.id ? 'primary.main' : 'text.disabled',
                  backgroundColor: selectedId === workflow.id ? 'primary.main' : 'transparent'
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {workflow.description}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

// ============================================================================
// ENTITY SELECTOR COMPONENT - Move to: src/components/SingleView/components/EntitySelector.tsx
// ============================================================================

interface EntitySelectorProps {
  entities: WorkflowOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function EntitySelector({ entities, selectedId, onSelect }: EntitySelectorProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Entities
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose up to one entity to visualize (MVP)
      </Typography>
      
      {entities.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
          <Chip label="Coming Soon" color="secondary" sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Entity visualization will be available in a future release
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {entities.map((entity) => (
            <Paper
              key={entity.id}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: selectedId === entity.id ? 2 : 1,
                borderColor: selectedId === entity.id ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 2,
                  borderColor: 'text.secondary'
                }
              }}
              onClick={() => onSelect(entity.id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {entity.title}
                </Typography>
                <Box 
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: 2,
                    borderColor: selectedId === entity.id ? 'primary.main' : 'text.disabled',
                    backgroundColor: selectedId === entity.id ? 'primary.main' : 'transparent'
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {entity.description}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ============================================================================
// CUSTOMIZATION PANEL COMPONENT - Move to: src/components/SingleView/components/CustomizationPanel.tsx
// ============================================================================

interface CustomizationPanelProps {
  customizations: ViewCustomizations;
  onUpdate: (customizations: Partial<ViewCustomizations>) => void;
}

function CustomizationPanel({ customizations, onUpdate }: CustomizationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <Typography variant="h6">Customize View</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure how the workflow visualization will appear
        </Typography>
      </CardHeader>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={customizations.expandAllEntities}
                  onChange={(e) => onUpdate({ expandAllEntities: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Expand All Entities
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show all entity details by default
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={customizations.showLegend}
                  onChange={(e) => onUpdate({ showLegend: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Show Legend
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Display legend panel in the visualization
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={customizations.showMiniMap}
                  onChange={(e) => onUpdate({ showMiniMap: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Show Mini Map
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Display navigation mini map
                  </Typography>
                </Box>
              }
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Custom TabPanel component for Material UI Tabs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// ============================================================================
// SELECTION PAGE COMPONENT - Move to: src/components/SingleView/SelectionPage.tsx
// ============================================================================

// ============================================================================
// REMOVED SELECTION PAGE - Going directly to visualization  
// ============================================================================

// ============================================================================
// VISUALIZATION PAGE COMPONENT - Move to: src/components/SingleView/VisualizationPage.tsx
// ============================================================================

export function VisualizationPage() {
  console.log('VisualizationPage component starting...');
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  
  // Default to first workflow if no URL params
  const workflowId = id || 'ebm-version';
  const availableWorkflows = useAvailableWorkflows();
  
  // Get workflow data - use default workflow if no URL params
  const workflowData = useWorkflowData(
    'workflow', 
    workflowId
  ) || mockWorkflows[workflowId];

  // Handle workflow switching from sidebar
  const handleWorkflowSelect = (workflowId: string) => {
    navigate(`/visualization/workflow/${workflowId}`);
  };

  // Display the workflow visualization directly
  const displayWorkflowId = workflowId;

  if (!workflowData) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Workflow Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The workflow "{displayWorkflowId}" could not be loaded
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Enhanced Header */}
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Workflow Visualization - {
              'name' in workflowData ? workflowData.name : workflowData.workflow.title
            }
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Workflow Visualization */}
      <Box sx={{ flexGrow: 1 }}>
        <WorkflowBuilder 
          selectedWorkflowId={displayWorkflowId}
          workflowData={workflowData as any}
          onWorkflowSelect={handleWorkflowSelect}
        />
      </Box>
    </Box>
  );
}

// ============================================================================
// LANDING PAGE COMPONENT - Move to: src/pages/Index.tsx (or keep in main pages folder)
// ============================================================================

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" fontWeight="bold" sx={{ mb: 2 }}>
              Pipeline Management Framework
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Visualize and manage your workflows and entities with our intuitive single-view system
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 6 }}>
              <Button 
                variant="contained"
                size="large"
                startIcon={<Visibility />}
                endIcon={<ArrowForward />}
                onClick={() => navigate('/selection')}
              >
                Start Visualization
              </Button>
              
              <Button 
                variant="outlined"
                size="large"
                startIcon={<Settings />}
                onClick={() => navigate('/selection')}
              >
                Configure & Select
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Choose from available workflows and entities • Customize your view • 
              Visualize with interactive React Flow
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

// ============================================================================
// MAIN EXPORTS - Move to: src/components/SingleView/index.tsx
// ============================================================================

// Default export for easier importing
export default VisualizationPage;
