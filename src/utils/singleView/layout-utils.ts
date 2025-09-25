import { WorkflowData, LayoutConfig } from '../../models/singleView/nodeTypes';

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
  const { nodes, edges, outgoing, startNodes } = analysis;
  
  // Step 1: Level assignment using BFS
  const levels = new Map<string, number>();
  const queue: Array<{ nodeId: string; level: number }> = [];
  const visited = new Set<string>();
  
  // Start BFS from identified start nodes
  startNodes.forEach(node => {
    queue.push({ nodeId: node.id, level: 0 });
    levels.set(node.id, 0);
  });
  
  let maxLevel = 0;
  
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    maxLevel = Math.max(maxLevel, level);
    
    // Add children to next level
    const children = outgoing.get(nodeId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        const childLevel = level + 1;
        if (!levels.has(childId) || levels.get(childId)! < childLevel) {
          levels.set(childId, childLevel);
          queue.push({ nodeId: childId, level: childLevel });
        }
      }
    });
  }
  
  // Handle any unvisited nodes (disconnected components)
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, maxLevel + 1);
    }
  });
  
  // Step 2: Position calculation
  const nodesByLevel = new Map<number, string[]>();
  
  // Group nodes by level
  levels.forEach((level, nodeId) => {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(nodeId);
  });
  
  const positions = new Map<string, { x: number; y: number }>();
  
  // Calculate positions for each level
  nodesByLevel.forEach((nodeIds, level) => {
    const levelNodeCount = nodeIds.length;
    
    nodeIds.forEach((nodeId, index) => {
      if (config.isHorizontal) {
        // Horizontal layout: levels spread left to right
        const x = config.padding + (level * config.spacing);
        const y = config.padding + (index * config.spacing) - 
                  ((levelNodeCount - 1) * config.spacing) / 2 + 
                  config.workflowHeight / 2;
        
        positions.set(nodeId, { x, y });
      } else {
        // Vertical layout: levels spread top to bottom
        const x = config.padding + (index * config.spacing) - 
                  ((levelNodeCount - 1) * config.spacing) / 2 + 
                  config.workflowWidth / 2;
        const y = config.padding + (level * config.spacing);
        
        positions.set(nodeId, { x, y });
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