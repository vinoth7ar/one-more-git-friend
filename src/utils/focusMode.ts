import { Node, Edge } from '@xyflow/react';

/**
 * Focus Mode Utility
 * Creates a temporary focus effect that highlights a selected node and its connections
 * while dimming everything else for better visual clarity
 */

export interface FocusModeResult {
  focusedNodes: Node[];
  focusedEdges: Edge[];
  dimmedNodes: Node[];
  dimmedEdges: Edge[];
}

/**
 * Calculates which nodes and edges should be focused vs dimmed
 * when a node with multiple connections is selected
 */
export function calculateFocusMode(
  selectedNodeId: string,
  allNodes: Node[],
  allEdges: Edge[]
): FocusModeResult {
  // Find all edges connected to the selected node
  const connectedEdges = allEdges.filter(edge => 
    edge.source === selectedNodeId || edge.target === selectedNodeId
  );
  
  // Find all nodes connected to the selected node
  const connectedNodeIds = new Set<string>();
  connectedNodeIds.add(selectedNodeId); // Include the selected node itself
  
  connectedEdges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });
  
  // Split nodes into focused and dimmed
  const focusedNodes = allNodes.filter(node => connectedNodeIds.has(node.id));
  const dimmedNodes = allNodes.filter(node => !connectedNodeIds.has(node.id));
  
  // Split edges into focused and dimmed
  const focusedEdges = connectedEdges;
  const dimmedEdges = allEdges.filter(edge => 
    !connectedEdges.some(focusedEdge => focusedEdge.id === edge.id)
  );
  
  return {
    focusedNodes,
    focusedEdges,
    dimmedNodes,
    dimmedEdges
  };
}

/**
 * Applies focus mode styling to nodes and edges
 */
export function applyFocusModeStyling(
  nodes: Node[],
  edges: Edge[],
  focusMode: FocusModeResult | null
): { styledNodes: Node[], styledEdges: Edge[] } {
  if (!focusMode) {
    // No focus mode, return original styling
    return { styledNodes: nodes, styledEdges: edges };
  }
  
  const styledNodes = nodes.map(node => {
    const isFocused = focusMode.focusedNodes.some(fn => fn.id === node.id);
    
    return {
      ...node,
      style: {
        ...node.style,
        opacity: isFocused ? 1 : 0.2,
        filter: isFocused ? 'brightness(1.2) drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' : 'blur(1px)',
        transform: isFocused ? 'scale(1.05)' : 'scale(0.95)',
        transition: 'all 0.3s ease-in-out',
        zIndex: isFocused ? 10 : 1,
      }
    };
  });
  
  const styledEdges = edges.map(edge => {
    const isFocused = focusMode.focusedEdges.some(fe => fe.id === edge.id);
    
    return {
      ...edge,
      style: {
        ...edge.style,
        opacity: isFocused ? 1 : 0.15,
        strokeWidth: isFocused ? ((edge.style?.strokeWidth as number) || 2) * 1.5 : 1,
        filter: isFocused ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.3))' : 'none',
      },
      data: {
        ...edge.data,
        isAnimated: isFocused && (edge.data?.isAnimated || false),
      }
    };
  });
  
  return { styledNodes, styledEdges };
}

/**
 * Checks if a node has multiple connections (useful for determining when to trigger focus mode)
 */
export function hasMultipleConnections(nodeId: string, edges: Edge[]): boolean {
  const connections = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
  return connections.length > 1;
}