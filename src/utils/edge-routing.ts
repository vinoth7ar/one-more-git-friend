import ELK, { ElkNode, ElkExtendedEdge, ElkGraphElement } from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';
import type { WorkflowData } from '@/components/WorkflowManager';

/**
 * ELK (Eclipse Layout Kernel) based edge routing utility
 * Prevents edge overlaps and creates optimal graph layouts
 */

const elk = new ELK();

// ELK layout options for workflow diagrams
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '150',
  'elk.spacing.nodeNode': '100',
  'elk.direction': 'RIGHT',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
  'elk.layered.edgeRouting.selfLoopOrdering': 'STACKED',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.edge.type': 'ORTHOGONAL',
  'elk.edgeRouting': 'ORTHOGONAL'
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
 * Convert WorkflowData to ELK graph format
 */
export const convertToElkGraph = (
  workflowData: WorkflowData,
  isHorizontal: boolean = true
): ElkGraph => {
  const nodeWidth = 120;
  const nodeHeight = isHorizontal ? 80 : 60;
  const eventNodeWidth = 140;
  const eventNodeHeight = isHorizontal ? 60 : 80;

  // Convert nodes with proper dimensions based on type
  const elkNodes: ElkNode[] = workflowData.nodes.map(node => ({
    id: node.id,
    width: node.type === 'status' ? nodeWidth : eventNodeWidth,
    height: node.type === 'status' ? nodeHeight : eventNodeHeight,
  }));

  // Convert edges to ELK format
  const elkEdges: ElkExtendedEdge[] = workflowData.edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  return {
    id: 'root',
    layoutOptions: {
      ...elkOptions,
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
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

    // Convert edges with routing information
    const edges: Edge[] = layoutedGraph.edges?.map(elkEdge => {
      const originalEdge = workflowData.edges.find(e => e.id === elkEdge.id);
      if (!originalEdge) throw new Error(`Edge ${elkEdge.id} not found in original data`);

      // Create edge with routing points if available
      const edge: Edge = {
        id: elkEdge.id,
        source: originalEdge.source,
        target: originalEdge.target,
        type: 'smoothstep', // Use smoothstep for better edge routing
        animated: false,
        style: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: 'hsl(var(--border))',
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
      stroke: 'hsl(var(--border))',
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed',
      width: 20,
      height: 20,
      color: 'hsl(var(--border))',
    },
  }));

  return { nodes, edges };
};

/**
 * Apply selection styling to edges
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
          ? 'hsl(var(--primary) / 0.7)'
          : 'hsl(var(--border))',
        strokeWidth: isSelected ? 4 : isConnectedToSelectedNode ? 3 : 2,
      },
      className: isSelected ? 'animate-edge-pulse' : '',
      markerEnd: {
        type: 'arrowclosed',
        width: 20,
        height: 20,
        color: isSelected 
          ? 'hsl(var(--primary))' 
          : isConnectedToSelectedNode 
          ? 'hsl(var(--primary) / 0.7)'
          : 'hsl(var(--border))',
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