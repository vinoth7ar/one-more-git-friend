/**
 * Advanced Edge Routing Utilities
 * Prevents edge crossings and overlaps in workflow visualizations
 */

export interface Point {
  x: number;
  y: number;
}

export interface EdgeRoute {
  id: string;
  source: string;
  target: string;
  path?: string;
  sourceHandle: string;
  targetHandle: string;
  type: 'smoothstep' | 'step' | 'straight' | 'bezier';
  style?: any;
  isBackwardFlow?: boolean;
  layer?: number;
  label?: string;
  markerEnd?: {
    type: string;
    color: string;
    width: number;
    height: number;
  };
}

/**
 * Calculate curved path to avoid edge crossings
 */
export const calculateCurvedPath = (
  sourcePos: Point,
  targetPos: Point,
  sourceHandle: string,
  targetHandle: string,
  curvature: number = 0.3,
  layer: number = 0
): string => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  
  // Add layer offset to create separation between parallel edges
  const layerOffset = layer * 40;
  
  let controlPoint1: Point;
  let controlPoint2: Point;
  
  // Calculate control points based on connection handles
  if (sourceHandle.includes('right') && targetHandle.includes('left')) {
    // Horizontal connection
    const midX = sourcePos.x + dx * 0.5;
    controlPoint1 = { x: midX + layerOffset, y: sourcePos.y + layerOffset };
    controlPoint2 = { x: midX + layerOffset, y: targetPos.y + layerOffset };
  } else if (sourceHandle.includes('bottom') && targetHandle.includes('top')) {
    // Vertical connection
    const midY = sourcePos.y + dy * 0.5;
    controlPoint1 = { x: sourcePos.x + layerOffset, y: midY + layerOffset };
    controlPoint2 = { x: targetPos.x + layerOffset, y: midY + layerOffset };
  } else {
    // Diagonal or backward flow - use smooth S-curve
    const offset = Math.abs(dx) > Math.abs(dy) ? layerOffset : -layerOffset;
    controlPoint1 = { 
      x: sourcePos.x + dx * curvature + offset, 
      y: sourcePos.y + dy * 0.2 + offset 
    };
    controlPoint2 = { 
      x: targetPos.x - dx * curvature + offset, 
      y: targetPos.y - dy * 0.2 + offset 
    };
  }
  
  return `M ${sourcePos.x},${sourcePos.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${targetPos.x},${targetPos.y}`;
};

/**
 * Detect potential edge crossings
 */
export const detectEdgeCrossings = (
  edges: Array<{ sourcePos: Point; targetPos: Point; id: string }>,
  currentEdge: { sourcePos: Point; targetPos: Point; id: string }
): boolean => {
  return edges.some(edge => {
    if (edge.id === currentEdge.id) return false;
    
    return doLinesIntersect(
      edge.sourcePos,
      edge.targetPos,
      currentEdge.sourcePos,
      currentEdge.targetPos
    );
  });
};

/**
 * Check if two line segments intersect
 */
const doLinesIntersect = (p1: Point, p2: Point, p3: Point, p4: Point): boolean => {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  
  if (denom === 0) return false; // Lines are parallel
  
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
  
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};

/**
 * Group edges by their general direction to assign layers
 */
export const assignEdgeLayers = (
  edges: Array<{
    id: string;
    sourcePos: Point;
    targetPos: Point;
    isBackwardFlow: boolean;
  }>
): Map<string, number> => {
  const layers = new Map<string, number>();
  const groups = new Map<string, string[]>();
  
  // Group edges by direction
  edges.forEach(edge => {
    const direction = getEdgeDirection(edge.sourcePos, edge.targetPos, edge.isBackwardFlow);
    if (!groups.has(direction)) {
      groups.set(direction, []);
    }
    groups.get(direction)!.push(edge.id);
  });
  
  // Assign layers within each direction group
  groups.forEach((edgeIds, direction) => {
    edgeIds.forEach((edgeId, index) => {
      const layerOffset = direction === 'backward' ? 100 : 0; // Separate backward flows
      layers.set(edgeId, index + layerOffset);
    });
  });
  
  return layers;
};

/**
 * Determine edge direction for grouping
 */
const getEdgeDirection = (sourcePos: Point, targetPos: Point, isBackwardFlow: boolean): string => {
  if (isBackwardFlow) return 'backward';
  
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
};

/**
 * Calculate optimal connection handles to minimize crossings
 */
export const calculateOptimalHandles = (
  sourcePos: Point,
  targetPos: Point,
  isHorizontal: boolean,
  isBackwardFlow: boolean,
  layer: number = 0
): { sourceHandle: string; targetHandle: string } => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  
  if (isBackwardFlow) {
    // Use alternative paths for backward flows
    if (isHorizontal) {
      return layer % 2 === 0 
        ? { sourceHandle: 'bottom-source', targetHandle: 'bottom-target' }
        : { sourceHandle: 'top-source', targetHandle: 'top-target' };
    } else {
      return layer % 2 === 0
        ? { sourceHandle: 'left-source', targetHandle: 'left-target' }
        : { sourceHandle: 'right-source', targetHandle: 'right-target' };
    }
  }
  
  // Standard forward flow with layer-based handle selection
  if (isHorizontal) {
    if (layer > 0 && Math.abs(dy) > 50) {
      // Use vertical handles for higher layers if there's vertical separation
      return dy > 0 
        ? { sourceHandle: 'bottom-source', targetHandle: 'top-target' }
        : { sourceHandle: 'top-source', targetHandle: 'bottom-target' };
    }
    return { sourceHandle: 'right-source', targetHandle: 'left-target' };
  } else {
    if (layer > 0 && Math.abs(dx) > 50) {
      // Use horizontal handles for higher layers if there's horizontal separation
      return dx > 0 
        ? { sourceHandle: 'right-source', targetHandle: 'left-target' }
        : { sourceHandle: 'left-source', targetHandle: 'right-target' };
    }
    return { sourceHandle: 'bottom-source', targetHandle: 'top-target' };
  }
};

/**
 * Create edge routing with collision avoidance
 */
export const createSmartEdgeRoutes = (
  workflowData: any,
  layout: any,
  isHorizontal: boolean,
  selectedNodeId: string | null = null,
  selectedEdgeId: string | null = null
): EdgeRoute[] => {
  const { positions, levels } = layout;
  
  // First pass: collect edge data
  const edgeData = workflowData.edges.map((edge: any) => {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    const sourceLevel = levels.get(edge.source) || 0;
    const targetLevel = levels.get(edge.target) || 0;
    const isBackwardFlow = targetLevel <= sourceLevel && sourceLevel > 0;
    
    return {
      ...edge,
      sourcePos,
      targetPos,
      isBackwardFlow,
      sourceLevel,
      targetLevel
    };
  }).filter((edge: any) => edge.sourcePos && edge.targetPos);
  
  // Assign layers to prevent crossings
  const edgeLayers = assignEdgeLayers(edgeData);
  
  // Second pass: create routed edges
  return edgeData.map((edge: any) => {
    const layer = edgeLayers.get(edge.id) || 0;
    const { sourceHandle, targetHandle } = calculateOptimalHandles(
      edge.sourcePos,
      edge.targetPos,
      isHorizontal,
      edge.isBackwardFlow,
      layer
    );
    
    // Enhanced styling
    const isConnectedToSelectedNode = selectedNodeId && 
      (edge.source === selectedNodeId || edge.target === selectedNodeId);
    const isSelectedEdge = selectedEdgeId === edge.id;
    
    let edgeStyle: any = {
      stroke: 'hsl(var(--muted-foreground))',
      strokeWidth: 2,
    };
    
    if (isSelectedEdge) {
      edgeStyle = {
        stroke: 'hsl(var(--primary))',
        strokeWidth: 3,
      };
    } else if (isConnectedToSelectedNode) {
      edgeStyle = {
        stroke: 'hsl(var(--accent))',
        strokeWidth: 3,
      };
    }
    
    if (edge.isBackwardFlow) {
      edgeStyle = {
        ...edgeStyle,
        strokeDasharray: '8,4',
        stroke: 'hsl(var(--destructive))',
      };
    }
    
    // Add glow effect for higher layers
    if (layer > 0) {
      edgeStyle.filter = 'drop-shadow(0 0 4px hsl(var(--primary) / 0.3))';
    }
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep' as const,
      style: edgeStyle,
      isBackwardFlow: edge.isBackwardFlow,
      layer,
      markerEnd: {
        type: 'arrowclosed',
        color: edgeStyle.stroke,
        width: 20,
        height: 20,
      },
      label: edge.label,
    };
  });
};