/**
 * ============= COMPLETE WORKFLOW COMPONENT =============
 * Self-contained workflow visualizer with all dependencies included
 * Copy this file to use in your own project
 * 
 * Dependencies needed:
 * - @xyflow/react
 * - react
 * 
 * Usage:
 * import WorkflowManager from './WorkflowManagerComplete';
 * <WorkflowManager workflowData={yourData} />
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ============= TYPES SECTION =============
// Copy to: types/index.ts

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

export interface RawWorkflowData {
  [key: string]: any;
}

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

export interface WorkflowManagerProps {
  workflowData?: WorkflowData | RawWorkflowData;
  selectedWorkflow?: string;
  layoutConfig?: Partial<LayoutConfig>;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onEdgeClick?: (edgeId: string, edgeData: any) => void;
  onLayoutChange?: (nodes: any[], edges: any[]) => void;
  className?: string;
  style?: React.CSSProperties;
  showControls?: boolean;
  showBackground?: boolean;
  isInteractive?: boolean;
}

// ============= MOCK DATA SECTION =============
// Copy to: data/mockData.ts

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

// ============= DATA TRANSFORMATION UTILITIES SECTION =============
// Copy to: utils/dataTransform.ts

export function transformWorkflowData(rawData: RawWorkflowData): WorkflowData {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid workflow data: data must be an object');
  }

  // Handle already transformed data
  if (rawData.nodes && rawData.edges && rawData.id) {
    return rawData as WorkflowData;
  }

  // Common field mappings for different backend formats
  const getId = () => rawData.id || rawData.workflowId || rawData.workflow_id || 'default-workflow';
  const getName = () => rawData.name || rawData.title || rawData.workflowName || rawData.workflow_name || 'Unnamed Workflow';
  const getDescription = () => rawData.description || rawData.desc || rawData.summary || '';

  // Extract nodes with flexible field mapping
  const extractNodes = (): WorkflowNode[] => {
    const nodeData = rawData.nodes || rawData.steps || rawData.states || rawData.vertices || [];
    
    if (!Array.isArray(nodeData)) {
      console.warn('No valid nodes array found in workflow data');
      return [];
    }

    return nodeData.map((node: any, index: number) => ({
      id: node.id || node.nodeId || node.step_id || `node-${index}`,
      type: (node.type === 'event' || node.nodeType === 'event' || node.kind === 'event') ? 'event' : 'status',
      label: node.label || node.name || node.title || node.text || `Node ${index + 1}`
    }));
  };

  // Extract edges with flexible field mapping
  const extractEdges = (): WorkflowEdge[] => {
    const edgeData = rawData.edges || rawData.connections || rawData.transitions || rawData.links || [];
    
    if (!Array.isArray(edgeData)) {
      console.warn('No valid edges array found in workflow data');
      return [];
    }

    return edgeData.map((edge: any, index: number) => ({
      id: edge.id || edge.edgeId || edge.connection_id || `edge-${index}`,
      source: edge.source || edge.from || edge.sourceId || edge.source_id || '',
      target: edge.target || edge.to || edge.targetId || edge.target_id || '',
      label: edge.label || edge.name || edge.condition || ''
    }));
  };

  const transformedData: WorkflowData = {
    id: getId(),
    name: getName(),
    description: getDescription(),
    nodes: extractNodes(),
    edges: extractEdges()
  };

  return validateWorkflowData(transformedData);
}

export function validateWorkflowData(data: WorkflowData): WorkflowData {
  if (!data.id) {
    data.id = 'default-workflow';
  }
  
  if (!data.name) {
    data.name = 'Unnamed Workflow';
  }
  
  if (!data.description) {
    data.description = '';
  }
  
  if (!Array.isArray(data.nodes)) {
    data.nodes = [];
  }
  
  if (!Array.isArray(data.edges)) {
    data.edges = [];
  }

  // Validate node types
  data.nodes = data.nodes.map(node => ({
    ...node,
    type: (node.type === 'event') ? 'event' : 'status',
    label: node.label || 'Unnamed'
  }));

  // Validate edges - remove edges that reference non-existent nodes
  const nodeIds = new Set(data.nodes.map(node => node.id));
  data.edges = data.edges.filter(edge => {
    const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
    if (!isValid) {
      console.warn(`Invalid edge: ${edge.id} references non-existent nodes`);
    }
    return isValid;
  });

  return data;
}

// ============= LAYOUT ALGORITHMS SECTION =============
// Copy to: utils/layoutAlgorithms.ts

export const defaultLayoutConfig: LayoutConfig = {
  workflowWidth: 800,
  workflowHeight: 600,
  stageWidth: 120,
  stageHeight: 100,
  circleSize: 80,
  padding: 50,
  spacing: 80,
  isHorizontal: true
};

export function analyzeGraphStructure(workflowData: WorkflowData) {
  const { nodes, edges } = workflowData;
  
  // Build adjacency maps
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  
  // Initialize maps
  nodes.forEach(node => {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  });
  
  // Build connections
  edges.forEach(edge => {
    const sourceConnections = outgoing.get(edge.source) || [];
    sourceConnections.push(edge.target);
    outgoing.set(edge.source, sourceConnections);
    
    const targetConnections = incoming.get(edge.target) || [];
    targetConnections.push(edge.source);
    incoming.set(edge.target, targetConnections);
  });
  
  // Find root nodes (no incoming edges)
  const rootNodes = nodes.filter(node => {
    const incomingConnections = incoming.get(node.id) || [];
    return incomingConnections.length === 0;
  });
  
  // Find leaf nodes (no outgoing edges)
  const leafNodes = nodes.filter(node => {
    const outgoingConnections = outgoing.get(node.id) || [];
    return outgoingConnections.length === 0;
  });
  
  return {
    outgoing,
    incoming,
    rootNodes,
    leafNodes
  };
}

export function calculateSmartLayout(
  workflowData: WorkflowData,
  config: LayoutConfig
): { nodes: Node[]; edges: Edge[] } {
  const { nodes: workflowNodes, edges: workflowEdges } = workflowData;
  
  if (workflowNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const { outgoing, rootNodes } = analyzeGraphStructure(workflowData);
  
  // If no clear root nodes, start with first node
  const startNodes = rootNodes.length > 0 ? rootNodes : [workflowNodes[0]];
  
  // Perform level-wise layout using BFS
  const levels: string[][] = [];
  const visited = new Set<string>();
  const nodeToLevel = new Map<string, number>();
  
  // Initialize with root nodes
  levels[0] = startNodes.map(node => node.id);
  startNodes.forEach(node => {
    visited.add(node.id);
    nodeToLevel.set(node.id, 0);
  });
  
  let currentLevel = 0;
  
  while (currentLevel < levels.length) {
    const nextLevelNodes: string[] = [];
    
    levels[currentLevel].forEach(nodeId => {
      const connections = outgoing.get(nodeId) || [];
      connections.forEach(connectedNodeId => {
        if (!visited.has(connectedNodeId)) {
          visited.add(connectedNodeId);
          nextLevelNodes.push(connectedNodeId);
          nodeToLevel.set(connectedNodeId, currentLevel + 1);
        }
      });
    });
    
    if (nextLevelNodes.length > 0) {
      levels[currentLevel + 1] = nextLevelNodes;
    }
    
    currentLevel++;
  }
  
  // Handle unvisited nodes (isolated or cyclic)
  workflowNodes.forEach(node => {
    if (!visited.has(node.id)) {
      const lastLevel = levels.length;
      if (!levels[lastLevel]) {
        levels[lastLevel] = [];
      }
      levels[lastLevel].push(node.id);
      nodeToLevel.set(node.id, lastLevel);
    }
  });
  
  // Calculate positions
  const nodeMap = new Map(workflowNodes.map(node => [node.id, node]));
  const maxNodesInLevel = Math.max(...levels.map(level => level.length));
  
  // Adjust spacing based on content
  const minVerticalSpacing = 100;
  const minHorizontalSpacing = 150;
  
  const verticalSpacing = Math.max(minVerticalSpacing, config.stageHeight);
  const horizontalSpacing = Math.max(minHorizontalSpacing, config.stageWidth);
  
  // Cap the maximum spacing to prevent nodes from being too far apart
  const maxLevelSpacing = Math.min(250, config.workflowWidth / Math.max(1, levels.length - 1));
  const finalHorizontalSpacing = config.isHorizontal ? 
    Math.min(horizontalSpacing, maxLevelSpacing) : 
    horizontalSpacing;
  
  const reactFlowNodes: Node[] = [];
  
  levels.forEach((level, levelIndex) => {
    const levelWidth = (level.length - 1) * finalHorizontalSpacing;
    const startX = config.isHorizontal ? 
      config.padding + levelIndex * finalHorizontalSpacing :
      (config.workflowWidth - levelWidth) / 2;
    const startY = config.isHorizontal ?
      (config.workflowHeight - levelWidth) / 2 :
      config.padding + levelIndex * verticalSpacing;
    
    level.forEach((nodeId, nodeIndex) => {
      const workflowNode = nodeMap.get(nodeId);
      if (!workflowNode) return;
      
      const x = config.isHorizontal ? 
        startX : 
        startX + nodeIndex * finalHorizontalSpacing;
      const y = config.isHorizontal ? 
        startY + nodeIndex * verticalSpacing : 
        startY;
      
      reactFlowNodes.push({
        id: nodeId,
        type: workflowNode.type,
        position: { x, y },
        data: { label: workflowNode.label },
        draggable: true,
      });
    });
  });
  
  // Convert edges
  const reactFlowEdges: Edge[] = workflowEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: true,
    label: edge.label,
  }));
  
  return { nodes: reactFlowNodes, edges: reactFlowEdges };
}

// ============= WORKFLOW NODE COMPONENTS SECTION =============
// Copy to: components/WorkflowNodes.tsx

export const StatusNode: React.FC<NodeProps> = memo(({ data }) => {
  return (
    <div className="workflow-status-node">
      <Handle type="target" position={Position.Left} />
      <div className="workflow-status-node-content">
        {String(data.label)}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

StatusNode.displayName = 'StatusNode';

export const EventNode: React.FC<NodeProps> = memo(({ data }) => {
  return (
    <div className="workflow-event-node">
      <Handle type="target" position={Position.Left} />
      <div className="workflow-event-node-content">
        {String(data.label)}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

EventNode.displayName = 'EventNode';

export const nodeTypes = {
  status: StatusNode,
  event: EventNode,
};

// ============= CSS STYLES SECTION =============
// Copy to: styles/workflow.scss or add to your CSS

const workflowStyles = `
/* Status Nodes - Circular workflow states */
.workflow-status-node {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.workflow-status-node:hover {
  border-color: #9ca3af;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.workflow-status-node-content {
  text-align: center;
  padding: 0 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* Event Nodes - Rectangular workflow actions */
.workflow-event-node {
  width: 96px;
  height: 48px;
  border-radius: 4px;
  background-color: #3b82f6;
  border: 2px solid #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.workflow-event-node:hover {
  background-color: #2563eb;
  border-color: #1d4ed8;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.workflow-event-node-content {
  text-align: center;
  padding: 0 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* Handle styles */
.react-flow__handle {
  width: 8px;
  height: 8px;
  background-color: #9ca3af;
  border: 1px solid #6b7280;
  border-radius: 50%;
}

.react-flow__handle:hover {
  background-color: #6b7280;
}

/* Workflow container styles */
.workflow-container {
  width: 100%;
  height: 600px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.workflow-container .react-flow__background {
  background-color: #f9fafb;
}

.workflow-container .react-flow__controls {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.workflow-container .react-flow__controls-button {
  border-bottom: 1px solid #e5e7eb;
}

.workflow-container .react-flow__controls-button:hover {
  background-color: #f3f4f6;
}

/* Error and empty states */
.workflow-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  padding: 2rem;
  text-align: center;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.workflow-error h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.workflow-error p {
  color: #7f1d1d;
}

.workflow-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  padding: 2rem;
  text-align: center;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
}

.workflow-empty h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.workflow-empty p {
  color: #475569;
}

/* Loading state */
.workflow-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.workflow-loading .loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .workflow-status-node {
    background-color: #374151;
    border-color: #6b7280;
    color: #f9fafb;
  }
  
  .workflow-event-node {
    background-color: #3b82f6;
    border-color: #2563eb;
  }
  
  .react-flow__handle {
    background-color: #f9fafb;
    border-color: #e5e7eb;
  }
}
`;

// ============= MAIN WORKFLOW MANAGER COMPONENT =============

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = workflowStyles;
  document.head.appendChild(styleElement);
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  workflowData,
  selectedWorkflow = defaultWorkflow,
  layoutConfig = {},
  onNodeClick,
  onEdgeClick,
  onLayoutChange,
  className = '',
  style = {},
  showControls = true,
  showBackground = true,
  isInteractive = true,
}) => {
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [currentSelectedWorkflow, setCurrentSelectedWorkflow] = useState(selectedWorkflow);
  const [error, setError] = useState<string | null>(null);

  // Merge layout configuration
  const finalLayoutConfig: LayoutConfig = useMemo(() => ({
    ...defaultLayoutConfig,
    isHorizontal,
    ...layoutConfig,
  }), [layoutConfig, isHorizontal]);

  // Process workflow data
  const processedWorkflowData = useMemo(() => {
    try {
      setError(null);
      
      let dataToProcess: WorkflowData;
      
      if (workflowData) {
        // Use provided external data
        if (typeof workflowData === 'object' && 'nodes' in workflowData && 'edges' in workflowData) {
          dataToProcess = workflowData as WorkflowData;
        } else {
          dataToProcess = transformWorkflowData(workflowData as RawWorkflowData);
        }
      } else {
        // Use mock data
        const mockData = mockWorkflows[currentSelectedWorkflow];
        if (!mockData) {
          throw new Error(`Workflow "${currentSelectedWorkflow}" not found`);
        }
        dataToProcess = mockData;
      }
      
      return validateWorkflowData(dataToProcess);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error processing workflow data:', err);
      return null;
    }
  }, [workflowData, currentSelectedWorkflow]);

  // Calculate layout
  const { nodes, edges } = useMemo(() => {
    if (!processedWorkflowData) {
      return { nodes: [], edges: [] };
    }
    
    try {
      const result = calculateSmartLayout(processedWorkflowData, finalLayoutConfig);
      
      // Notify parent of layout changes
      if (onLayoutChange) {
        onLayoutChange(result.nodes, result.edges);
      }
      
      return result;
    } catch (err) {
      console.error('Error calculating layout:', err);
      setError('Failed to calculate workflow layout');
      return { nodes: [], edges: [] };
    }
  }, [processedWorkflowData, finalLayoutConfig, onLayoutChange]);

  // React Flow state
  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update React Flow when layout changes
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  // Event handlers
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.data);
    }
  }, [onNodeClick]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (onEdgeClick) {
      onEdgeClick(edge.id, edge);
    }
  }, [onEdgeClick]);

  // Error state
  if (error) {
    return (
      <div className={`workflow-error ${className}`} style={style}>
        <h3>Workflow Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Empty state
  if (!processedWorkflowData || processedWorkflowData.nodes.length === 0) {
    return (
      <div className={`workflow-empty ${className}`} style={style}>
        <h3>No Workflow Data</h3>
        <p>No workflow nodes found to display.</p>
      </div>
    );
  }

  return (
    <div className={`workflow-container ${className}`} style={style}>
      {/* Controls */}
      {!workflowData && (
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label htmlFor="workflow-select" style={{ marginRight: '0.5rem', fontWeight: '500' }}>
                Workflow:
              </label>
              <select
                id="workflow-select"
                value={currentSelectedWorkflow}
                onChange={(e) => setCurrentSelectedWorkflow(e.target.value)}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}
              >
                {Object.keys(mockWorkflows).map((key) => (
                  <option key={key} value={key}>
                    {mockWorkflows[key].name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="layout-toggle" style={{ marginRight: '0.5rem', fontWeight: '500' }}>
                Layout:
              </label>
              <button
                id="layout-toggle"
                onClick={() => setIsHorizontal(!isHorizontal)}
                style={{
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                {isHorizontal ? 'Horizontal' : 'Vertical'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ReactFlow */}
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={isInteractive ? onNodesChange : undefined}
        onEdgesChange={isInteractive ? onEdgesChange : undefined}
        onNodeClick={isInteractive ? handleNodeClick : undefined}
        onEdgeClick={isInteractive ? handleEdgeClick : undefined}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 50 }}
        attributionPosition="bottom-left"
        maxZoom={2}
        minZoom={0.1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        {showControls && <Controls showInteractive={isInteractive} />}
        {showBackground && <Background />}
      </ReactFlow>
    </div>
  );
};

export default WorkflowManager;