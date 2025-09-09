import { Node, Edge } from '@xyflow/react';
import { WorkflowData, WorkflowNode, LayoutConfig } from '@/models/singleView/nodeTypes';

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
 * Node layout computation functions
 */
export const computeNodeLayout = (
  currentWorkflowData: WorkflowData,
  config: LayoutConfig
) => {
  const layout = calculateSmartLayout(currentWorkflowData, config);
  
  return {
    processedNodes: createFlowNodes(currentWorkflowData, layout, config.isHorizontal),
    processedEdges: createFlowEdges(currentWorkflowData, layout, config.isHorizontal),
  };
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
  const queue: string[] = [];
  const visited = new Set<string>();
  
  // Start BFS from identified start nodes
  startNodes.forEach(node => {
    levels.set(node.id, 0);
    queue.push(node.id);
    visited.add(node.id);
  });
  
  // Process nodes level by level
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentLevel = levels.get(currentId) || 0;
    const children = outgoing.get(currentId) || [];
    
    children.forEach(childId => {
      if (!visited.has(childId)) {
        levels.set(childId, currentLevel + 1);
        queue.push(childId);
        visited.add(childId);
      }
    });
  }
  
  // Handle any disconnected nodes
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  // Group nodes by level for positioning
  const nodesByLevel = new Map<number, WorkflowNode[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });
  
  // Calculate positions for each node
  const positions = new Map<string, { x: number; y: number }>();
  const maxLevel = Math.max(...Array.from(levels.values()));
  
  Array.from(nodesByLevel.entries()).forEach(([level, levelNodes]) => {
    levelNodes.forEach((node, index) => {
      if (isHorizontal) {
        // Horizontal layout: levels go left to right
        const x = padding + level * (stageWidth + 100);
        const y = padding + index * (stageHeight + 50) + (levelNodes.length > 1 ? 0 : stageHeight / 2);
        positions.set(node.id, { x, y });
      } else {
        // Vertical layout: levels go top to bottom
        const x = padding + index * (stageWidth + 50) + (levelNodes.length > 1 ? 0 : stageWidth / 2);
        const y = padding + level * (stageHeight + 100);
        positions.set(node.id, { x, y });
      }
    });
  });
  
  return {
    positions,
    levels,
    nodesByLevel,
    maxLevel,
    analysis
  };
};

/**
 * Creates React Flow nodes from workflow data with calculated positions
 */
export const createFlowNodes = (
  workflowData: WorkflowData,
  layout: ReturnType<typeof calculateSmartLayout>,
  isHorizontal: boolean
): Node[] => {
  const { positions } = layout;
  
  return workflowData.nodes.map((node) => {
    const position = positions.get(node.id) || { x: 0, y: 0 };
    
    return {
      id: node.id,
      type: node.type,
      position,
      data: { label: node.label },
    };
  });
};

/**
 * Creates React Flow edges from workflow data with smart routing and styling
 */
export const createFlowEdges = (
  workflowData: WorkflowData,
  layout: ReturnType<typeof calculateSmartLayout>,
  isHorizontal: boolean
): Edge[] => {
  const { levels, positions } = layout;
  
  return workflowData.edges.map((edge) => {
    const sourceLevel = levels.get(edge.source) || 0;
    const targetLevel = levels.get(edge.target) || 0;
    const isBackwardFlow = targetLevel <= sourceLevel;
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    
    // Calculate if this is a complex connection that needs special routing
    const needsSmartRouting = sourcePos && targetPos && (
      Math.abs(sourcePos.x - targetPos.x) > 300 || 
      Math.abs(sourcePos.y - targetPos.y) > 200
    );
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: needsSmartRouting ? 'smoothstep' : 'default',
      style: { 
        stroke: isBackwardFlow ? '#ef4444' : '#3b82f6', 
        strokeWidth: 2.5,
        strokeDasharray: isBackwardFlow ? '8,4' : undefined,
        strokeLinecap: 'round' as const,
      },
      markerEnd: {
        type: 'arrowclosed',
        width: 22,
        height: 22,
        color: isBackwardFlow ? '#ef4444' : '#3b82f6',
      },
      animated: false,
      pathOptions: needsSmartRouting ? { 
        borderRadius: 20,
        offset: 10 
      } : undefined,
    };
  });
};