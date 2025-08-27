import { Edge } from '@xyflow/react';
import { WorkflowData } from './types';

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
