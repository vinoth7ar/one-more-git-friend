import { Node } from '@xyflow/react';
import { WorkflowData, LayoutConfig } from './types';
import { WorkflowNodeData } from './WorkflowNode';
import { CircularNodeData } from './CircularNode';

export const defaultLayoutConfig: LayoutConfig = {
  workflowWidth: 800,
  workflowHeight: 450,
  stageWidth: 220,
  stageHeight: 90,
  circleSize: 64,
  padding: 30,
  verticalSpacing: 40,
};

export const calculateDynamicLayout = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
) => {
  const { nodes } = workflowData;
  const { stageWidth, padding, verticalSpacing, stageHeight, circleSize } = config;

  // Separate status and event nodes
  const statusNodes = nodes.filter(node => node.type === 'status');
  const eventNodes = nodes.filter(node => node.type === 'event');

  // Calculate dynamic workflow width based on number of nodes
  const maxNodes = Math.max(statusNodes.length, eventNodes.length);
  const minSpacing = 20; // Minimum spacing between nodes
  const dynamicWorkflowWidth = (2 * padding) + (maxNodes * stageWidth) + ((maxNodes - 1) * Math.max(minSpacing, 40));
  
  // Calculate horizontal spacing based on number of nodes
  const availableWidth = dynamicWorkflowWidth - (2 * padding);
  const totalNodeWidth = maxNodes * stageWidth;
  const nodeSpacing = maxNodes > 1 ? (availableWidth - totalNodeWidth) / (maxNodes - 1) : 0;

  // Calculate positions for each row
  const statusY = 70;
  const eventY = statusY + stageHeight + verticalSpacing;

  return {
    dynamicWorkflowWidth,
    nodeSpacing: Math.max(nodeSpacing, 20), // Minimum spacing
    statusY,
    eventY,
    getStatusPosition: (index: number) => ({
      x: padding + (index * (stageWidth + nodeSpacing)),
      y: statusY,
    }),
    getEventPosition: (index: number) => ({
      x: padding + (index * (stageWidth + nodeSpacing)),
      y: eventY,
    }),
  };
};

export const createDynamicNodes = (
  workflowData: WorkflowData,
  entitiesExpanded: boolean,
  onToggleEntities: () => void,
  config: LayoutConfig = defaultLayoutConfig
): Node[] => {
  const nodes: Node[] = [];
  const layout = calculateDynamicLayout(workflowData, config);

  // Main workflow container
  nodes.push({
    id: workflowData.id,
    type: 'workflow',
    position: { x: 20, y: 60 },
    data: {
      title: workflowData.name,
      description: workflowData.description,
      type: 'workflow',
    } as WorkflowNodeData,
    style: { width: layout.dynamicWorkflowWidth, height: config.workflowHeight },
    draggable: true,
  });

  // Separate status and event nodes
  const statusNodes = workflowData.nodes.filter(node => node.type === 'status');
  const eventNodes = workflowData.nodes.filter(node => node.type === 'event');

  // Status nodes (rectangular) - positioned dynamically  
  statusNodes.forEach((status, index) => {
    const position = layout.getStatusPosition(index);
    
    nodes.push({
      id: status.id,
      type: 'stage',
      position,
      data: {
        title: status.label,
        description: `Status: ${status.label}`,
        type: 'stage',
        color: 'blue',
        onClick: () => console.log(`${status.label} status clicked`),
      } as WorkflowNodeData,
      parentId: workflowData.id,
      extent: 'parent',
      style: { width: config.stageWidth, height: config.stageHeight },
      draggable: true,
    });
  });

  // Event nodes (circular) - positioned dynamically
  eventNodes.forEach((event, index) => {
    const position = layout.getEventPosition(index);
    
    nodes.push({
      id: event.id,
      type: 'circular',
      position,
      data: {
        label: event.label,
        color: 'green',
        onClick: () => console.log(`${event.label} event clicked`),
      } as CircularNodeData,
      parentId: workflowData.id,
      extent: 'parent',
      draggable: true,
    });
  });

  return nodes;
};