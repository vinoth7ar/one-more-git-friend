import { Node, Edge } from '@xyflow/react';

/**
 * Edge Separation Utility
 * Provides visual separation for multiple edges connecting to the same node
 */

export interface EdgeOffset {
  sourceOffset: { x: number; y: number };
  targetOffset: { x: number; y: number };
  color: string;
  strokeDasharray?: string;
}

/**
 * Generates distinct colors for edge differentiation
 */
const EDGE_COLORS = [
  'hsl(var(--primary))',     // Primary blue
  '#10b981',                 // Emerald
  '#f59e0b',                 // Amber
  '#ef4444',                 // Red
  '#8b5cf6',                 // Violet
  '#06b6d4',                 // Cyan
  '#f97316',                 // Orange
  '#84cc16',                 // Lime
  '#ec4899',                 // Pink
  '#6366f1',                 // Indigo
];

/**
 * Calculates offset positions for multiple edges from the same node
 */
export function calculateEdgeOffsets(
  edges: Edge[], 
  nodes: Node[]
): Map<string, EdgeOffset> {
  const edgeOffsets = new Map<string, EdgeOffset>();
  
  // Group edges by source node
  const edgesBySource = new Map<string, Edge[]>();
  edges.forEach(edge => {
    const sourceEdges = edgesBySource.get(edge.source) || [];
    sourceEdges.push(edge);
    edgesBySource.set(edge.source, sourceEdges);
  });

  // Group edges by target node
  const edgesByTarget = new Map<string, Edge[]>();
  edges.forEach(edge => {
    const targetEdges = edgesByTarget.get(edge.target) || [];
    targetEdges.push(edge);
    edgesByTarget.set(edge.target, targetEdges);
  });

  // Calculate offsets for each edge
  edges.forEach((edge, index) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;

    const sourceEdges = edgesBySource.get(edge.source) || [];
    const targetEdges = edgesByTarget.get(edge.target) || [];
    
    // Calculate source offset
    const sourceIndex = sourceEdges.findIndex(e => e.id === edge.id);
    const sourceTotal = sourceEdges.length;
    const sourceOffset = calculateNodeOffset(sourceIndex, sourceTotal, 120); // 120px node width
    
    // Calculate target offset
    const targetIndex = targetEdges.findIndex(e => e.id === edge.id);
    const targetTotal = targetEdges.length;
    const targetOffset = calculateNodeOffset(targetIndex, targetTotal, 120);
    
    // Assign color and style based on index
    const colorIndex = index % EDGE_COLORS.length;
    const color = EDGE_COLORS[colorIndex];
    
    // Add visual variation for easier distinction
    const strokeDasharray = sourceTotal > 3 ? 
      (sourceIndex % 2 === 0 ? undefined : '8 4') : undefined;

    edgeOffsets.set(edge.id, {
      sourceOffset,
      targetOffset,
      color,
      strokeDasharray
    });
  });

  return edgeOffsets;
}

/**
 * Calculates offset position for a single connection point
 */
function calculateNodeOffset(index: number, total: number, nodeWidth: number): { x: number; y: number } {
  if (total === 1) {
    return { x: 0, y: 0 };
  }

  // Fan out connections around the node
  const maxSpread = Math.min(nodeWidth * 0.8, total * 12); // Limit spread based on node size
  const step = maxSpread / Math.max(1, total - 1);
  const startOffset = -maxSpread / 2;
  
  return {
    x: startOffset + (index * step),
    y: total > 5 ? (index % 2 === 0 ? -8 : 8) : 0 // Slight vertical offset for many edges
  };
}

/**
 * Creates a demo scenario with multiple edges for testing
 */
export function createMultiEdgeDemo(): { nodes: Node[], edges: Edge[] } {
  const demoNodes: Node[] = [
    {
      id: 'central-hub',
      type: 'status',
      position: { x: 400, y: 200 },
      data: { 
        label: 'Central Hub',
        description: 'Main processing node',
        status: 'active'
      }
    },
    {
      id: 'destination-1',
      type: 'event',
      position: { x: 700, y: 100 },
      data: { 
        label: 'Process A',
        description: 'First processing path'
      }
    },
    {
      id: 'destination-2',
      type: 'event',
      position: { x: 700, y: 160 },
      data: { 
        label: 'Process B',
        description: 'Second processing path'
      }
    },
    {
      id: 'destination-3',
      type: 'event',
      position: { x: 700, y: 220 },
      data: { 
        label: 'Process C',
        description: 'Third processing path'
      }
    },
    {
      id: 'destination-4',
      type: 'event',
      position: { x: 700, y: 280 },
      data: { 
        label: 'Process D',
        description: 'Fourth processing path'
      }
    },
    {
      id: 'destination-5',
      type: 'status',
      position: { x: 700, y: 340 },
      data: { 
        label: 'Final Step',
        description: 'Final processing step',
        status: 'pending'
      }
    }
  ];

  const demoEdges: Edge[] = [
    {
      id: 'hub-to-a',
      source: 'central-hub',
      target: 'destination-1',
      type: 'animated',
      label: 'Priority',
      data: { edgeType: 'bezier' }
    },
    {
      id: 'hub-to-b',
      source: 'central-hub',
      target: 'destination-2',
      type: 'animated',
      label: 'Standard',
      data: { edgeType: 'bezier' }
    },
    {
      id: 'hub-to-c',
      source: 'central-hub',
      target: 'destination-3',
      type: 'animated',
      label: 'Backup',
      data: { edgeType: 'bezier' }
    },
    {
      id: 'hub-to-d',
      source: 'central-hub',
      target: 'destination-4',
      type: 'animated',
      label: 'Alternative',
      data: { edgeType: 'bezier' }
    },
    {
      id: 'hub-to-final',
      source: 'central-hub',
      target: 'destination-5',
      type: 'animated',
      label: 'Completion',
      data: { edgeType: 'bezier' }
    }
  ];

  return { nodes: demoNodes, edges: demoEdges };
}