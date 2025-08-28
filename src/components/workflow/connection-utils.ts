import { Edge } from '@xyflow/react';
import { WorkflowData } from './types';

export const generateIntelligentConnections = (workflowData: WorkflowData): Edge[] => {
  const edges: Edge[] = [];

  // Use the edges from the workflow data directly
  workflowData.edges.forEach((edge) => {
    edges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      style: { stroke: '#666', strokeWidth: 2 },
      type: 'smoothstep',
      labelStyle: { fontSize: '12px', fontWeight: 'bold' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
    });
  });

  return edges;
};

export const updateConnectionsForWorkflow = (
  workflowData: WorkflowData,
  existingEdges: Edge[] = []
): Edge[] => {
  // Generate new intelligent connections
  const newConnections = generateIntelligentConnections(workflowData);
  
  // Keep any custom user-added edges that don't conflict
  const customEdges = existingEdges.filter(edge => 
    !newConnections.some(newEdge => newEdge.id === edge.id)
  );

  return [...newConnections, ...customEdges];
};
