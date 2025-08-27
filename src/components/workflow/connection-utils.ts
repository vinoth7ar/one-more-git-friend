import { Edge } from '@xyflow/react';
import { WorkflowData } from './types';
import { SimpleWorkflow } from './mock-data';

export const generateIntelligentConnections = (workflowData: WorkflowData): Edge[] => {
  const edges: Edge[] = [];
  const { stages, statusNodes } = workflowData;

  // Connect stages to their corresponding status nodes
  stages.forEach((stage, index) => {
    // Find corresponding status node (either by explicit connection or by index)
    const correspondingStatus = statusNodes.find(status => 
      status.connectedToStage === stage.id
    ) || statusNodes[index];

    if (correspondingStatus) {
      edges.push({
        id: `${stage.id}-to-${correspondingStatus.id}`,
        source: stage.id,
        target: correspondingStatus.id,
        style: { stroke: '#000', strokeWidth: 1 },
        type: 'smoothstep',
      });
    }
  });

  // Connect status nodes to next stages in sequence
  statusNodes.forEach((statusNode, index) => {
    const nextStage = stages[index + 1];
    if (nextStage) {
      edges.push({
        id: `${statusNode.id}-to-${nextStage.id}`,
        source: statusNode.id,
        target: nextStage.id,
        style: { stroke: '#666', strokeWidth: 1 },
        type: 'smoothstep',
      });
    }
  });

  return edges;
};

export const generateConnectionsFromSimpleWorkflow = (
  simpleWorkflow: SimpleWorkflow
): Edge[] => {
  return simpleWorkflow.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 },
    labelStyle: { fontSize: '12px', fontWeight: 500 },
    labelBgStyle: { fill: 'white', fillOpacity: 0.9 }
  }));
};

export const updateConnectionsForWorkflow = (
  workflowData: WorkflowData,
  existingEdges: Edge[] = [],
  simpleWorkflow?: SimpleWorkflow
): Edge[] => {
  // If we have simple workflow data with explicit edges, use those
  if (simpleWorkflow) {
    return generateConnectionsFromSimpleWorkflow(simpleWorkflow);
  }
  
  // Otherwise, generate intelligent connections
  const newConnections = generateIntelligentConnections(workflowData);
  
  // Keep any custom user-added edges that don't conflict
  const customEdges = existingEdges.filter(edge => 
    !newConnections.some(newEdge => newEdge.id === edge.id)
  );

  return [...newConnections, ...customEdges];
};
