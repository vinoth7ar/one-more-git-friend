import React, { useCallback, useState, useEffect, memo, useMemo } from 'react';
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
  console.group('🔄 TRANSFORM WORKFLOW DATA DEBUG');
  console.log('📋 Input raw data:', JSON.stringify(rawData, null, 2));
  console.log('📋 Raw data type:', typeof rawData);
  console.log('📋 Raw data keys:', Object.keys(rawData));
  
  // Extract workflow data from various possible structures
  const workflowData = rawData.workflow || rawData.data || rawData;
  console.log('📋 Extracted workflow data:', JSON.stringify(workflowData, null, 2));
  console.log('📋 Workflow data keys:', Object.keys(workflowData));
  
  const fieldStatus = {
    hasNodes: !!workflowData.nodes,
    hasVertices: !!workflowData.vertices, 
    hasStates: !!workflowData.states,
    hasSteps: !!workflowData.steps,
    hasEdges: !!workflowData.edges,
    hasConnections: !!workflowData.connections,
    hasTransitions: !!workflowData.transitions,
    hasLinks: !!workflowData.links
  };
  console.log('📋 Field status check:', fieldStatus);
  
  // Deep inspection of data structure
  if (workflowData.nodes) {
    console.log('🔵 NODES DATA FOUND:');
    console.log('  - Type:', Array.isArray(workflowData.nodes) ? 'Array' : typeof workflowData.nodes);
    console.log('  - Length:', workflowData.nodes.length);
    console.log('  - Sample nodes:', workflowData.nodes.slice(0, 3));
  }
  
  if (workflowData.edges) {
    console.log('🔗 EDGES DATA FOUND:');
    console.log('  - Type:', Array.isArray(workflowData.edges) ? 'Array' : typeof workflowData.edges);
    console.log('  - Length:', workflowData.edges.length);
    console.log('  - Sample edges:', workflowData.edges.slice(0, 3));
  }
  
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
    console.log('🔵 TRANSFORMING NODES:');
    console.log('  - Input type:', Array.isArray(rawNodes) ? 'Array' : typeof rawNodes);
    console.log('  - Input data:', JSON.stringify(rawNodes, null, 2));
    
    if (!Array.isArray(rawNodes)) {
      console.warn('⚠️ rawNodes is not an array:', rawNodes);
      return [];
    }
    
    const transformed = rawNodes.map((node, index) => {
      console.log(`  - Processing node ${index}:`, node);
      
      const id = node.id || node.nodeId || node.node_id || `node-${index}`;
      const type: 'status' | 'event' = (node.type?.toLowerCase() === 'status' || 
                   node.nodeType?.toLowerCase() === 'status' || 
                   node.node_type?.toLowerCase() === 'status') ? 'status' : 'event';
      const label = node.label || node.name || node.title || node.text || `Node ${index + 1}`;
      
      console.log(`    ✅ Transformed: id=${id}, type=${type}, label=${label}`);
      
      return { id, type, label };
    });
    
    console.log('🔵 NODES TRANSFORMATION COMPLETE:', transformed);
    return transformed;
  };

  /**
   * Transform edges from various possible formats
   * Handles different field naming conventions for connections
   */
  const transformEdges = (rawEdges: any[]): WorkflowEdge[] => {
    console.log('🔗 TRANSFORMING EDGES:');
    console.log('  - Input type:', Array.isArray(rawEdges) ? 'Array' : typeof rawEdges);
    console.log('  - Input data:', JSON.stringify(rawEdges, null, 2));
    
    if (!Array.isArray(rawEdges)) {
      console.warn('⚠️ rawEdges is not an array:', rawEdges);
      return [];
    }
    
    const transformed = rawEdges.map((edge, index) => {
      console.log(`  - Processing edge ${index}:`, edge);
      
      const id = edge.id || edge.edgeId || edge.edge_id || `edge-${index}`;
      const source = edge.source || edge.from || edge.sourceId || edge.source_id || '';
      const target = edge.target || edge.to || edge.targetId || edge.target_id || '';
      const label = edge.label || edge.name || edge.title || edge.text || '';
      
      console.log(`    ✅ Transformed: id=${id}, source=${source}, target=${target}, label=${label}`);
      
      return { id, source, target, label };
    });
    
    console.log('🔗 EDGES TRANSFORMATION COMPLETE:', transformed);
    return transformed;
  };

  // Extract nodes and edges with various fallback strategies
  let nodes: WorkflowNode[] = [];
  let edges: WorkflowEdge[] = [];

  // Try to find nodes in various possible field names
  if (workflowData.nodes) {
    console.log('🔵 Found nodes field, raw data:', workflowData.nodes);
    nodes = transformNodes(workflowData.nodes);
  } else if (workflowData.vertices) {
    console.log('🔵 Found vertices field, raw data:', workflowData.vertices);
    nodes = transformNodes(workflowData.vertices);
  } else if (workflowData.states) {
    console.log('🔵 Found states field, raw data:', workflowData.states);
    nodes = transformNodes(workflowData.states);
  } else if (workflowData.steps) {
    console.log('🔵 Found steps field, raw data:', workflowData.steps);
    nodes = transformNodes(workflowData.steps);
  } else {
    console.warn('⚠️ No node data found in any expected field');
  }

  // Try to find edges in various possible field names
  if (workflowData.edges) {
    console.log('🔗 Found edges field, raw data:', workflowData.edges);
    edges = transformEdges(workflowData.edges);
  } else if (workflowData.connections) {
    console.log('🔗 Found connections field, raw data:', workflowData.connections);
    edges = transformEdges(workflowData.connections);
  } else if (workflowData.transitions) {
    console.log('🔗 Found transitions field, raw data:', workflowData.transitions);
    edges = transformEdges(workflowData.transitions);
  } else if (workflowData.links) {
    console.log('🔗 Found links field, raw data:', workflowData.links);
    edges = transformEdges(workflowData.links);
  } else {
    console.warn('⚠️ No edge data found in any expected field');
  }

  const result = { id, name, description, nodes, edges };
  
  console.log('✅ TRANSFORMATION RESULT:', {
    id, 
    name, 
    description, 
    nodeCount: nodes.length, 
    edgeCount: edges.length
  });
  console.log('🔵 Final transformed nodes:', nodes);
  console.log('🔗 Final transformed edges:', edges);
  console.log('📋 Complete result object:', JSON.stringify(result, null, 2));
  console.groupEnd();

  return result;
};

/**
 * Validates transformed data and provides sensible defaults
 * Ensures we always have a workable workflow even with incomplete data
 */
export const validateWorkflowData = (data: WorkflowData): WorkflowData => {
  console.group('🔍 VALIDATE WORKFLOW DATA DEBUG');
  console.log('📋 Input validation data:', JSON.stringify(data, null, 2));
  
  const validatedData = { ...data };
  
  // Ensure we have at least some nodes for a meaningful workflow
  if (!validatedData.nodes || validatedData.nodes.length === 0) {
    console.warn('⚠️ CRITICAL: No nodes found, creating default Start/End nodes');
    validatedData.nodes = [
      { id: 'default-start', type: 'status', label: 'Start' },
      { id: 'default-end', type: 'status', label: 'End' }
    ];
    console.log('🔧 Created default nodes:', validatedData.nodes);
  } else {
    console.log(`✅ Found ${validatedData.nodes.length} nodes to validate`);
    console.log('🔵 Node details:', validatedData.nodes);
  }
  
  // Initialize edges array if missing
  if (!validatedData.edges) {
    console.log('🔧 Initializing empty edges array');
    validatedData.edges = [];
  } else {
    console.log(`🔗 Found ${validatedData.edges.length} edges to validate`);
  }
  
  // Remove any edges that reference non-existent nodes (data integrity)
  const nodeIds = new Set(validatedData.nodes.map(node => node.id));
  console.log('🔵 Available node IDs:', Array.from(nodeIds));
  
  const initialEdgeCount = validatedData.edges.length;
  validatedData.edges = validatedData.edges.filter(edge => {
    const hasValidSource = nodeIds.has(edge.source);
    const hasValidTarget = nodeIds.has(edge.target);
    const isValid = hasValidSource && hasValidTarget;
    
    if (!isValid) {
      console.warn(`⚠️ Removing invalid edge: ${edge.id} (${edge.source} -> ${edge.target})`);
      console.warn(`  - Source exists: ${hasValidSource}, Target exists: ${hasValidTarget}`);
    }
    
    return isValid;
  });
  
  const finalEdgeCount = validatedData.edges.length;
  if (initialEdgeCount !== finalEdgeCount) {
    console.warn(`🔧 Removed ${initialEdgeCount - finalEdgeCount} invalid edges`);
  }
  
  console.log('✅ VALIDATION COMPLETE:', {
    nodeCount: validatedData.nodes.length,
    edgeCount: validatedData.edges.length
  });
  console.log('📋 Final validated data:', JSON.stringify(validatedData, null, 2));
  console.groupEnd();
  
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
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [];
  
  // Start BFS from all root nodes
  startNodes.forEach(node => {
    queue.push({ id: node.id, level: 0 });
    levels.set(node.id, 0);
  });
  
  // BFS to assign levels
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    
    if (visited.has(id)) continue;
    visited.add(id);
    
    const children = outgoing.get(id) || [];
    children.forEach(childId => {
      if (!levels.has(childId) || levels.get(childId)! < level + 1) {
        levels.set(childId, level + 1);
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }
  
  // Group nodes by level
  const nodesByLevel = new Map<number, WorkflowNode[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });
  
  // Calculate positions
  const maxLevel = Math.max(...levels.values());
  const levelSpacing = isHorizontal 
    ? (config.workflowWidth - 2 * padding) / Math.max(1, maxLevel)
    : (config.workflowHeight - 2 * padding) / Math.max(1, maxLevel);
  
  const positionedNodes = nodes.map(node => {
    const level = levels.get(node.id) ?? 0;
    const nodesAtLevel = nodesByLevel.get(level) || [];
    const indexAtLevel = nodesAtLevel.indexOf(node);
    const nodesCount = nodesAtLevel.length;
    
    // Calculate position based on level and index within level
    let x, y;
    
    if (isHorizontal) {
      x = padding + level * levelSpacing;
      
      if (nodesCount === 1) {
        y = config.workflowHeight / 2;
      } else {
        const verticalSpacing = (config.workflowHeight - 2 * padding) / (nodesCount - 1);
        y = padding + indexAtLevel * verticalSpacing;
      }
    } else {
      y = padding + level * levelSpacing;
      
      if (nodesCount === 1) {
        x = config.workflowWidth / 2;
      } else {
        const horizontalSpacing = (config.workflowWidth - 2 * padding) / (nodesCount - 1);
        x = padding + indexAtLevel * horizontalSpacing;
      }
    }
    
    return {
      ...node,
      x,
      y,
      level,
      originalType: node.type
    };
  });
  
  return positionedNodes;
};

/**
 * ============= REACT FLOW NODE COMPONENTS =============
 * Custom node components for different workflow node types
 */

// Status Node Component - Circular nodes representing workflow states
const StatusNode = memo<NodeProps>(({ data, isConnectable }) => {
  console.log('🟢 Rendering Status Node:', JSON.stringify(data, null, 2));
  
  return (
    <div className="status-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="handle"
      />
      <div className="status-node-content">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="handle"
      />
    </div>
  );
});

StatusNode.displayName = 'StatusNode';

// Event Node Component - Rectangular nodes representing workflow events/actions
const EventNode = memo<NodeProps>(({ data, isConnectable }) => {
  console.log('📦 Rendering Event Node:', JSON.stringify(data, null, 2));
  
  return (
    <div className="event-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="handle"
      />
      <div className="event-node-content">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="handle"
      />
    </div>
  );
});

EventNode.displayName = 'EventNode';

/**
 * ============= WORKFLOW MANAGER COMPONENT =============
 * Main component that orchestrates the entire workflow visualization
 */

interface WorkflowManagerProps {
  workflowData?: RawWorkflowData | null;
  useExternalData?: boolean;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({ 
  workflowData = null, 
  useExternalData = false 
}) => {
  console.group('🎯 WORKFLOW MANAGER RENDER');
  console.log('⚙️ Props received:', { 
    hasWorkflowData: !!workflowData, 
    useExternalData,
    workflowDataKeys: workflowData ? Object.keys(workflowData) : null
  });

  // ============= STATE MANAGEMENT =============
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(defaultWorkflow);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasError, setHasError] = useState<string | null>(null);

  // ============= DATA PROCESSING =============
  // Process workflow data (either external or mock) into our internal format
  const processedWorkflowData = useMemo(() => {
    console.group('🔄 PROCESSING WORKFLOW DATA');
    console.log('📊 useExternalData:', useExternalData);
    console.log('📊 workflowData exists:', !!workflowData);
    
    try {
      setHasError(null);
      let rawData;
      let result;
      
      if (useExternalData && workflowData) {
        console.log('📊 Using external data:', workflowData);
        rawData = workflowData;
        result = validateWorkflowData(transformWorkflowData(rawData));
      } else {
        console.log('📊 Using mock data for workflow:', selectedWorkflow);
        rawData = mockWorkflows[selectedWorkflow] || mockWorkflows[defaultWorkflow];
        result = validateWorkflowData(rawData);
      }
      
      console.log('✅ Processed data:', {
        id: result.id,
        name: result.name,
        nodeCount: result.nodes.length,
        edgeCount: result.edges.length
      });
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('❌ Error processing workflow data:', error);
      setHasError(error instanceof Error ? error.message : 'Failed to process workflow data');
      console.groupEnd();
      
      // Return fallback data
      return validateWorkflowData({
        id: 'error-fallback',
        name: 'Error Fallback',
        description: 'Fallback workflow due to data processing error',
        nodes: [],
        edges: []
      });
    }
  }, [useExternalData, workflowData, selectedWorkflow]);

  // ============= LAYOUT CALCULATION =============
  // Calculate node positions and convert to ReactFlow format
  const { reactFlowNodes, reactFlowEdges, layoutConfig } = useMemo(() => {
    console.group('📐 CALCULATING LAYOUT');
    console.log('📐 Input data:', {
      nodeCount: processedWorkflowData.nodes.length,
      edgeCount: processedWorkflowData.edges.length,
      isHorizontal
    });
    
    try {
      const config = { ...defaultLayoutConfig, isHorizontal };
      const positionedNodes = calculateSmartLayout(processedWorkflowData, config);
      
      console.log('📐 Positioned nodes:', positionedNodes.length);
      
      const reactNodes = positionedNodes.map(node => ({
        id: node.id,
        type: node.originalType === 'status' ? 'statusNode' : 'eventNode',
        position: { x: node.x, y: node.y },
        data: { 
          label: node.label, 
          originalType: node.originalType 
        },
      }));
      
      const reactEdges = processedWorkflowData.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#64748b' },
        animated: true,
      }));
      
      console.log('📐 Final react flow data:', {
        nodeCount: reactNodes.length,
        edgeCount: reactEdges.length
      });
      console.groupEnd();
      
      return {
        reactFlowNodes: reactNodes,
        reactFlowEdges: reactEdges,
        layoutConfig: config
      };
    } catch (error) {
      console.error('❌ Error calculating layout:', error);
      console.groupEnd();
      
      return {
        reactFlowNodes: [],
        reactFlowEdges: [],
        layoutConfig: defaultLayoutConfig
      };
    }
  }, [processedWorkflowData, isHorizontal]);

  // ============= EFFECTS =============
  // Update ReactFlow nodes and edges when layout changes
  useEffect(() => {
    console.group('🔄 UPDATING REACT FLOW NODES AND EDGES');
    console.log('🔄 Setting nodes:', reactFlowNodes.length);
    console.log('🔄 Setting edges:', reactFlowEdges.length);
    console.log('🔄 Node details:', reactFlowNodes);
    console.log('🔄 Edge details:', reactFlowEdges);
    
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
    
    console.groupEnd();
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges]);

  // ============= EVENT HANDLERS =============
  const onConnect = useCallback(
    (connection: Connection) => {
      console.log('🔗 Connection attempt:', connection);
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const nodeTypes = {
    statusNode: StatusNode,
    eventNode: EventNode,
  };

  console.log('🎯 About to render with data:', {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    workflowName: processedWorkflowData.name,
    hasError
  });
  console.groupEnd();

  // ============= ERROR HANDLING =============
  if (hasError) {
    return (
      <div className="w-full h-screen bg-red-50 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-red-800">
              Workflow Load Error
            </h2>
          </div>
          <p className="text-red-700 mb-4">
            Unable to load workflow data. Please check the data format and try again.
          </p>
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
            <strong>Error:</strong> {hasError}
          </div>
          <button
            onClick={() => {
              setHasError(null);
              setSelectedWorkflow(defaultWorkflow);
            }}
            className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Reset to Default Workflow
          </button>
        </div>
      </div>
    );
  }

  // ============= EMPTY STATE =============
  if (nodes.length === 0 && edges.length === 0) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">📊</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              No Workflow Data
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            No workflow nodes or connections found. Please provide valid workflow data.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
            Expected format: nodes array with id, type, and label fields
          </div>
        </div>
      </div>
    );
  }

  // ============= RENDER =============
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Debug Panel */}
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold text-blue-700">Data Source:</span>
            <span className="ml-2 text-blue-600">
              {useExternalData ? 'External API' : 'Mock Data'}
            </span>
          </div>
          <div>
            <span className="font-semibold text-blue-700">Nodes:</span>
            <span className="ml-2 text-blue-600">{nodes.length}</span>
          </div>
          <div>
            <span className="font-semibold text-blue-700">Edges:</span>
            <span className="ml-2 text-blue-600">{edges.length}</span>
          </div>
          <div>
            <span className="font-semibold text-blue-700">Layout:</span>
            <span className="ml-2 text-blue-600">
              {isHorizontal ? 'Horizontal' : 'Vertical'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">
            {processedWorkflowData.name}
          </h1>
          <span className="text-sm text-gray-600">
            {processedWorkflowData.description}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {!useExternalData && (
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              {Object.entries(mockWorkflows).map(([key, workflow]) => (
                <option key={key} value={key}>
                  {workflow.name}
                </option>
              ))}
            </select>
          )}
          
          <Button
            onClick={() => setIsHorizontal(!isHorizontal)}
            variant="outline"
            size="sm"
          >
            ⚡ {isHorizontal ? 'Vertical' : 'Horizontal'}
          </Button>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
          }}
          className="bg-gray-50"
        >
          <Background color="#e2e8f0" size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowManager;