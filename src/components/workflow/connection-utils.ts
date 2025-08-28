import { Edge } from '@xyflow/react';
import { WorkflowData } from './types';

export const generateIntelligentConnections = (workflowData: WorkflowData): Edge[] => {
  const edges: Edge[] = [];
  
  // Get event and status nodes
  const eventNodes = workflowData.nodes.filter(node => node.type === 'event');
  const statusNodes = workflowData.nodes.filter(node => node.type === 'status');

  // Create connections: event bottom -> status left, status right -> next event top
  eventNodes.forEach((eventNode, index) => {
    if (statusNodes[index]) {
      // Event to Status connection (bottom to left)
      edges.push({
        id: `event-to-status-${index}`,
        source: eventNode.id,
        target: statusNodes[index].id,
        sourceHandle: 'bottom',
        targetHandle: 'left',
        style: { stroke: '#666', strokeWidth: 2 },
        type: 'smoothstep',
      });
    }
    
    // Status to next Event connection (right to top)
    if (statusNodes[index] && eventNodes[index + 1]) {
      edges.push({
        id: `status-to-event-${index}`,
        source: statusNodes[index].id,
        target: eventNodes[index + 1].id,
        sourceHandle: 'right',
        targetHandle: 'top',
        style: { stroke: '#666', strokeWidth: 2 },
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
