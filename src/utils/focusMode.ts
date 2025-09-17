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
 * Calculates which nodes and edges should be focused vs dimmed
 * when an edge is selected
 */
export function calculateEdgeFocusMode(
  selectedEdgeId: string,
  allNodes: Node[],
  allEdges: Edge[]
): FocusModeResult {
  // Find the selected edge
  const selectedEdge = allEdges.find(edge => edge.id === selectedEdgeId);
  
  if (!selectedEdge) {
    return {
      focusedNodes: [],
      focusedEdges: [],
      dimmedNodes: allNodes,
      dimmedEdges: allEdges
    };
  }
  
  // Focus only on the selected edge and its connected nodes
  const focusedNodeIds = new Set<string>([selectedEdge.source, selectedEdge.target]);
  const focusedNodes = allNodes.filter(node => focusedNodeIds.has(node.id));
  const dimmedNodes = allNodes.filter(node => !focusedNodeIds.has(node.id));
  
  // Focus only on the selected edge
  const focusedEdges = [selectedEdge];
  const dimmedEdges = allEdges.filter(edge => edge.id !== selectedEdgeId);
  
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
        opacity: isFocused ? 1 : 0.6,
        filter: isFocused ? 'brightness(1.1)' : 'brightness(0.7)',
        boxShadow: isFocused ? '0 0 0 2px hsl(var(--primary) / 0.4), 0 8px 20px hsl(var(--primary) / 0.25)' : undefined,
        transition: 'filter 200ms ease, opacity 200ms ease, box-shadow 200ms ease',
      }
    };
  });
  
  const styledEdges = edges.map(edge => {
    const isFocused = focusMode.focusedEdges.some(fe => fe.id === edge.id);
    
    return {
      ...edge,
      style: {
        ...edge.style,
        opacity: isFocused ? 1 : 0.4,
        strokeWidth: isFocused ? Math.max(3, Number(edge.style?.strokeWidth || 2)) : Number(edge.style?.strokeWidth || 2),
        filter: isFocused ? 'drop-shadow(0 0 10px hsl(var(--primary) / 0.35))' : 'none',
      },
      data: {
        ...edge.data,
        isAnimated: isFocused || edge.data?.isAnimated === true,
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