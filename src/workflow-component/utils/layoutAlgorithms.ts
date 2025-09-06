import { WorkflowData, LayoutConfig } from '../types';

/**
 * ============= LAYOUT & POSITIONING ALGORITHMS =============
 * These handle the automatic positioning of nodes for optimal visual layout
 */

// Default configuration for layout calculations
export const defaultLayoutConfig: LayoutConfig = {
  workflowWidth: 1200,
  workflowHeight: 800,
  stageWidth: 120,
  stageHeight: 80,
  circleSize: 60,
  padding: 100,
  spacing: 180,
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
  const queue: Array<{ nodeId: string; level: number }> = [];
  
  // Start BFS from all identified start nodes
  startNodes.forEach(node => {
    queue.push({ nodeId: node.id, level: 0 });
    levels.set(node.id, 0);
  });
  
  // BFS traversal to assign levels
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    // Process all outgoing connections
    const connections = outgoing.get(nodeId) || [];
    connections.forEach(targetId => {
      const currentLevel = levels.get(targetId);
      const newLevel = level + 1;
      
      // Update level if this path provides a deeper level
      if (currentLevel === undefined || newLevel > currentLevel) {
        levels.set(targetId, newLevel);
        queue.push({ nodeId: targetId, level: newLevel });
      }
    });
  }
  
  // Handle orphaned nodes (not connected to main flow)
  let orphanLevel = 0;
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, orphanLevel);
      orphanLevel++;
    }
  });
  
  // Group nodes by their hierarchical levels
  const nodesByLevel = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(nodeId);
  });
  
  // Calculate optimal spacing between levels based on content
  const maxLevel = Math.max(...Array.from(levels.values()));
  const levelSpacing = isHorizontal 
    ? (config.workflowWidth - 2 * padding) / Math.max(1, maxLevel)
    : (config.workflowHeight - 2 * padding) / Math.max(1, maxLevel);
  
  // Generate final positioned nodes
  const positionedNodes = nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const nodesAtLevel = nodesByLevel.get(level) || [];
    const indexAtLevel = nodesAtLevel.indexOf(node.id);
    const nodesCount = nodesAtLevel.length;
    
    let x, y;
    
    if (isHorizontal) {
      // Horizontal layout - nodes flow left to right
      x = padding + level * Math.min(levelSpacing, 200); // Cap maximum spacing at 200px
      
      if (nodesCount === 1) {
        y = config.workflowHeight / 2;
      } else {
        // Better vertical distribution with minimum spacing
        const availableHeight = config.workflowHeight - 2 * padding;
        const minNodeSpacing = 100; // Minimum 100px between nodes
        const totalSpacing = Math.max(minNodeSpacing * (nodesCount - 1), availableHeight);
        const actualSpacing = Math.min(totalSpacing / Math.max(1, nodesCount - 1), availableHeight / Math.max(1, nodesCount - 1));
        
        const startY = config.workflowHeight / 2 - ((nodesCount - 1) * actualSpacing) / 2;
        y = startY + indexAtLevel * actualSpacing;
      }
    } else {
      // Vertical layout - nodes flow top to bottom
      y = padding + level * Math.min(levelSpacing, 150); // Cap maximum spacing at 150px
      
      if (nodesCount === 1) {
        x = config.workflowWidth / 2;
      } else {
        // Better horizontal distribution with minimum spacing
        const availableWidth = config.workflowWidth - 2 * padding;
        const minNodeSpacing = 150; // Minimum 150px between nodes
        const totalSpacing = Math.max(minNodeSpacing * (nodesCount - 1), availableWidth);
        const actualSpacing = Math.min(totalSpacing / Math.max(1, nodesCount - 1), availableWidth / Math.max(1, nodesCount - 1));
        
        const startX = config.workflowWidth / 2 - ((nodesCount - 1) * actualSpacing) / 2;
        x = startX + indexAtLevel * actualSpacing;
      }
    }
    
    // Determine node dimensions based on type
    const width = node.type === 'status' ? config.circleSize : stageWidth;
    const height = node.type === 'status' ? config.circleSize : stageHeight;
    
    return {
      id: node.id,
      type: node.type,
      position: { x, y },
      data: { 
        label: node.label as string,
        originalData: node
      },
      style: {
        width,
        height,
      },
    };
  });
  
  return positionedNodes;
};