import ELK, { ElkNode, ElkExtendedEdge, ElkGraphElement } from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';
import type { WorkflowData } from '@/components/WorkflowManager';

/**
 * ELK (Eclipse Layout Kernel) based edge routing utility
 * Prevents edge overlaps and creates optimal graph layouts
 */

const elk = new ELK();

// Enhanced ELK layout options for optimal edge routing
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '300',
  'elk.spacing.nodeNode': '250',
  'elk.spacing.edgeNode': '80',
  'elk.spacing.edgeEdge': '25',
  'elk.direction': 'RIGHT',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
  'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
  'elk.layered.edgeRouting.selfLoopOrdering': 'STACKED',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.edge.type': 'ORTHOGONAL',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.thoroughness': '30',
  'elk.layered.unnecessaryBendpoints': 'false',
  'elk.layered.edgeLabels.sideSelection': 'ALWAYS_UP',
  'elk.layered.wrapping.strategy': 'MULTI_EDGE',
  'elk.spacing.portPort': '15',
  'elk.port.borderOffset': '5',
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.layered.feedbackEdges': 'true'
};

/**
 * Interface for ELK graph structure
 */
interface ElkGraph extends ElkGraphElement {
  id: string;
  layoutOptions?: Record<string, string>;
  children: ElkNode[];
  edges: ElkExtendedEdge[];
}

/**
 * Convert WorkflowData to ELK graph format with enhanced node positioning
 */
export const convertToElkGraph = (
  workflowData: WorkflowData,
  isHorizontal: boolean = true
): ElkGraph => {
  const baseNodeWidth = 140;
  const baseNodeHeight = 80;
  const eventNodeWidth = 160;
  const eventNodeHeight = 70;

  // Group edges by source-target pairs for bundling
  const edgeGroups = new Map<string, string[]>();
  workflowData.edges.forEach(edge => {
    const key = `${edge.source}-${edge.target}`;
    const existing = edgeGroups.get(key) || [];
    existing.push(edge.id);
    edgeGroups.set(key, existing);
  });

  // Convert nodes with proper dimensions and ports
  const elkNodes: ElkNode[] = workflowData.nodes.map(node => {
    const isStatus = node.type === 'status';
    const width = isStatus ? baseNodeWidth : eventNodeWidth;
    const height = isStatus ? baseNodeHeight : eventNodeHeight;
    
    // Count incoming and outgoing edges for port distribution
    const incomingCount = workflowData.edges.filter(e => e.target === node.id).length;
    const outgoingCount = workflowData.edges.filter(e => e.source === node.id).length;
    
    // Create ports for better edge attachment
    const ports = [];
    
    // Input ports on left side
    for (let i = 0; i < Math.max(1, incomingCount); i++) {
      ports.push({
        id: `${node.id}_in_${i}`,
        width: 2,
        height: 2,
        x: 0,
        y: (height / (incomingCount + 1)) * (i + 1) - 1
      });
    }
    
    // Output ports on right side
    for (let i = 0; i < Math.max(1, outgoingCount); i++) {
      ports.push({
        id: `${node.id}_out_${i}`,
        width: 2,
        height: 2,
        x: width - 2,
        y: (height / (outgoingCount + 1)) * (i + 1) - 1
      });
    }

    return {
      id: node.id,
      width,
      height,
      ports: ports.length > 2 ? ports : undefined, // Only add ports if multiple connections
    };
  });

  // Convert edges to ELK format with better separation
  const elkEdges: ElkExtendedEdge[] = workflowData.edges.map((edge, index) => {
    const key = `${edge.source}-${edge.target}`;
    const siblings = edgeGroups.get(key) || [edge.id];
    const isMultiple = siblings.length > 1;
    
    return {
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      layoutOptions: isMultiple ? {
        'elk.spacing.edgeEdge': '20',
        'elk.layered.priority.direction': '1',
      } : undefined
    };
  });

  return {
    id: 'root',
    layoutOptions: {
      ...elkOptions,
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': isHorizontal ? '300' : '200',
      'elk.layered.spacing.nodeNodeBetweenLayers': isHorizontal ? '400' : '300',
      'elk.padding': '[top=50,left=50,bottom=50,right=50]',
    },
    children: elkNodes,
    edges: elkEdges,
  };
};

/**
 * Apply ELK layout and convert back to React Flow format
 */
export const applyElkLayout = async (
  workflowData: WorkflowData,
  isHorizontal: boolean = true
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  try {
    const elkGraph = convertToElkGraph(workflowData, isHorizontal);
    const layoutedGraph = await elk.layout(elkGraph);

    // Convert positioned nodes back to React Flow format
    const nodes: Node[] = layoutedGraph.children?.map(elkNode => {
      const originalNode = workflowData.nodes.find(n => n.id === elkNode.id);
      if (!originalNode) throw new Error(`Node ${elkNode.id} not found in original data`);

      return {
        id: elkNode.id,
        type: originalNode.type,
        position: {
          x: elkNode.x || 0,
          y: elkNode.y || 0,
        },
        data: {
          label: originalNode.label,
          originalType: originalNode.type,
        },
        draggable: true,
        selectable: true,
      };
    }) || [];

    // Precompute parallel edge groups for separation
    const groupMap = new Map<string, string[]>();
    workflowData.edges.forEach((e) => {
      const key = `${e.source}->${e.target}`;
      const arr = groupMap.get(key) || [];
      arr.push(e.id);
      groupMap.set(key, arr);
    });

    // Helper to collect points from ELK sections with proper connection handling
    const getPoints = (elkEdge: any, sourceNode: any, targetNode: any): { x: number; y: number }[] => {
      const section = elkEdge.sections && elkEdge.sections[0];
      
      if (!section || !sourceNode || !targetNode) {
        // Fallback: direct connection from node centers
        const sourceX = (sourceNode?.x || 0) + (sourceNode?.width || 0) / 2;
        const sourceY = (sourceNode?.y || 0) + (sourceNode?.height || 0) / 2;
        const targetX = (targetNode?.x || 0) + (targetNode?.width || 0) / 2;
        const targetY = (targetNode?.y || 0) + (targetNode?.height || 0) / 2;
        return [{ x: sourceX, y: sourceY }, { x: targetX, y: targetY }];
      }
      
      // Use ELK routing points
      const pts: { x: number; y: number }[] = [
        section.startPoint,
        ...(section.bendPoints || []),
        section.endPoint,
      ].map((p: any) => ({ x: p.x, y: p.y }));
      return pts;
    };

    // Enhanced separation logic for parallel edges
    const applySeparation = (points: { x: number; y: number }[], offset: number, edgeIndex: number, totalEdges: number) => {
      if (points.length < 2) return points;
      const out = points.map((p) => ({ ...p }));

      // Apply curved separation for better visual distinction
      const curvature = Math.abs(offset) > 0 ? 0.3 : 0;
      
      if (points.length === 2) {
        // For direct connections, create a curve
        const [start, end] = out;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // Add perpendicular offset for curves
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy);
        const perpX = -dy / length;
        const perpY = dx / length;
        
        // Create curve control points
        const curveOffset = offset + (curvature * length * 0.2);
        const cp1X = midX + (perpX * curveOffset);
        const cp1Y = midY + (perpY * curveOffset);
        
        // Insert control point to create smooth curve
        out.splice(1, 0, { x: cp1X, y: cp1Y });
      } else {
        // For multi-segment paths, offset segments
        for (let i = 0; i < out.length - 1; i++) {
          const p0 = out[i];
          const p1 = out[i + 1];
          const dx = p1.x - p0.x;
          const dy = p1.y - p0.y;
          const length = Math.hypot(dx, dy) || 1;
          const perpX = -dy / length;
          const perpY = dx / length;
          
          // Apply offset with falloff towards ends
          const segmentOffset = offset * (1 - Math.abs(i - (out.length - 1) / 2) / (out.length / 2)) * 0.8;
          out[i].x += perpX * segmentOffset;
          out[i].y += perpY * segmentOffset;
          if (i === out.length - 2) {
            out[i + 1].x += perpX * segmentOffset;
            out[i + 1].y += perpY * segmentOffset;
          }
        }
      }

      return out;
    };

    // Convert edges with routing information
    const edges: Edge[] = layoutedGraph.edges?.map((elkEdge: any) => {
      const originalEdge = workflowData.edges.find(e => e.id === elkEdge.id);
      if (!originalEdge) throw new Error(`Edge ${elkEdge.id} not found in original data`);

      // Find source and target nodes in layouted graph
      const sourceNode = layoutedGraph.children?.find((n: any) => n.id === originalEdge.source);
      const targetNode = layoutedGraph.children?.find((n: any) => n.id === originalEdge.target);
      
      const basePoints = getPoints(elkEdge, sourceNode, targetNode);
      const key = `${originalEdge.source}->${originalEdge.target}`;
      const group = groupMap.get(key) || [originalEdge.id];
      const idx = group.indexOf(originalEdge.id);
      const totalInGroup = group.length;
      
      // Enhanced separation with dynamic spacing based on group size
      const baseSpacing = Math.min(25, Math.max(12, 100 / totalInGroup));
      const sep = (idx - (totalInGroup - 1) / 2) * baseSpacing;
      const points = applySeparation(basePoints, sep, idx, totalInGroup);

      const edge: Edge = {
        id: elkEdge.id,
        source: originalEdge.source,
        target: originalEdge.target,
        type: 'routed',
        data: { points },
        animated: false,
        style: {
          stroke: 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: 'hsl(var(--muted-foreground))',
        },
      };

      return edge;
    }) || [];

    return { nodes, edges };
  } catch (error) {
    console.error('ELK layout failed:', error);
    // Fallback to simple layout if ELK fails
    return createFallbackLayout(workflowData, isHorizontal);
  }
};

/**
 * Fallback layout function when ELK fails
 */
const createFallbackLayout = (
  workflowData: WorkflowData,
  isHorizontal: boolean
): { nodes: Node[]; edges: Edge[] } => {
  console.warn('Using fallback layout due to ELK error');
  
  const spacing = 200;
  const offsetX = 100;
  const offsetY = 100;

  const nodes: Node[] = workflowData.nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    position: {
      x: isHorizontal ? offsetX + (index * spacing) : offsetX,
      y: isHorizontal ? offsetY : offsetY + (index * spacing),
    },
    data: {
      label: node.label,
      originalType: node.type,
    },
    draggable: true,
    selectable: true,
  }));

  const edges: Edge[] = workflowData.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
        style: {
          stroke: 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: 'hsl(var(--muted-foreground))',
        },
  }));

  return { nodes, edges };
};

/**
 * Apply enhanced selection styling to edges with smooth animations
 */
export const applyEdgeSelectionStyling = (
  edges: Edge[],
  selectedNodeId: string | null,
  selectedEdgeId: string | null,
  workflowData: WorkflowData
): Edge[] => {
  return edges.map(edge => {
    const isSelected = selectedEdgeId === edge.id;
    const isConnectedToSelectedNode = selectedNodeId && 
      (edge.source === selectedNodeId || edge.target === selectedNodeId);
    
    const baseStyle = edge.style || {};
    
    return {
      ...edge,
      animated: isSelected || !!isConnectedToSelectedNode,
      style: {
        ...baseStyle,
        stroke: isSelected 
          ? 'hsl(var(--primary))' 
          : isConnectedToSelectedNode 
          ? 'hsl(var(--primary) / 0.8)'
          : 'hsl(var(--muted-foreground))',
        strokeWidth: isSelected ? 3 : isConnectedToSelectedNode ? 2.5 : 2,
        filter: isSelected 
          ? 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))'
          : isConnectedToSelectedNode 
          ? 'drop-shadow(0 0 4px hsl(var(--primary) / 0.3))'
          : undefined,
        transition: 'all 0.2s ease-in-out',
      },
      className: isSelected ? 'animate-pulse' : '',
      markerEnd: {
        type: 'arrowclosed',
        width: 20,
        height: 20,
        color: isSelected 
          ? 'hsl(var(--primary))' 
          : isConnectedToSelectedNode 
          ? 'hsl(var(--primary) / 0.8)'
          : 'hsl(var(--muted-foreground))',
      },
    };
  });
};

/**
 * Create mock data with complex routing scenarios for testing
 */
export const createComplexMockData = (): WorkflowData => ({
  id: 'complex-routing-demo',
  name: 'Complex Edge Routing Demo',
  description: 'Demonstrates advanced edge routing with multiple connections and potential overlaps',
  nodes: [
    { id: 'start', type: 'status', label: 'Start' },
    { id: 'branch1', type: 'event', label: 'Branch Process 1' },
    { id: 'branch2', type: 'event', label: 'Branch Process 2' },
    { id: 'branch3', type: 'event', label: 'Branch Process 3' },
    { id: 'merge1', type: 'status', label: 'Merge Point 1' },
    { id: 'merge2', type: 'status', label: 'Merge Point 2' },
    { id: 'process1', type: 'event', label: 'Process Alpha' },
    { id: 'process2', type: 'event', label: 'Process Beta' },
    { id: 'process3', type: 'event', label: 'Process Gamma' },
    { id: 'decision', type: 'status', label: 'Decision Point' },
    { id: 'outcome1', type: 'status', label: 'Outcome A' },
    { id: 'outcome2', type: 'status', label: 'Outcome B' },
    { id: 'outcome3', type: 'status', label: 'Outcome C' },
    { id: 'final', type: 'status', label: 'Final State' },
  ],
  edges: [
    // Initial branching
    { id: 'e1', source: 'start', target: 'branch1', label: '' },
    { id: 'e2', source: 'start', target: 'branch2', label: '' },
    { id: 'e3', source: 'start', target: 'branch3', label: '' },
    
    // Branch to merge points
    { id: 'e4', source: 'branch1', target: 'merge1', label: '' },
    { id: 'e5', source: 'branch2', target: 'merge1', label: '' },
    { id: 'e6', source: 'branch3', target: 'merge2', label: '' },
    
    // Cross connections (creates potential overlaps)
    { id: 'e7', source: 'branch1', target: 'merge2', label: '' },
    { id: 'e8', source: 'branch3', target: 'merge1', label: '' },
    
    // Processing chains
    { id: 'e9', source: 'merge1', target: 'process1', label: '' },
    { id: 'e10', source: 'merge2', target: 'process2', label: '' },
    { id: 'e11', source: 'process1', target: 'process3', label: '' },
    { id: 'e12', source: 'process2', target: 'process3', label: '' },
    
    // Decision branching
    { id: 'e13', source: 'process3', target: 'decision', label: '' },
    { id: 'e14', source: 'decision', target: 'outcome1', label: '' },
    { id: 'e15', source: 'decision', target: 'outcome2', label: '' },
    { id: 'e16', source: 'decision', target: 'outcome3', label: '' },
    
    // Final convergence
    { id: 'e17', source: 'outcome1', target: 'final', label: '' },
    { id: 'e18', source: 'outcome2', target: 'final', label: '' },
    { id: 'e19', source: 'outcome3', target: 'final', label: '' },
    
    // Backward flow (creates more complexity)
    { id: 'e20', source: 'outcome2', target: 'process1', label: '' },
  ],
});