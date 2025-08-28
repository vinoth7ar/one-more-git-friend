// Adapter to convert new data format to the existing workflow format for now
import { WorkflowData as NewWorkflowData } from './types';

// Old format interface for compatibility
interface OldWorkflowData {
  workflow: {
    id: string;
    title: string;
    description: string;
  };
  stages: any[];
  statusNodes: any[];
  entities: any[];
}

export function adaptWorkflowData(newData: NewWorkflowData): OldWorkflowData {
  // Extract status and event nodes
  const statusNodes = newData.nodes.filter(node => node.type === 'status');
  const eventNodes = newData.nodes.filter(node => node.type === 'event');
  
  // Convert event nodes to stages
  const stages = eventNodes.map((event, index) => ({
    id: event.id,
    title: event.label,
    description: `Event: ${event.label}`,
    color: 'blue',
  }));

  // Convert status nodes to status format
  const statusNodesConverted = statusNodes.map((status, index) => ({
    id: status.id,
    label: status.label,
    color: 'gray',
    connectedToStage: eventNodes[index]?.id,
    connectedToEntities: [],
  }));

  return {
    workflow: {
      id: newData.id,
      title: newData.name,
      description: newData.description,
    },
    stages,
    statusNodes: statusNodesConverted,
    entities: [],
  };
}