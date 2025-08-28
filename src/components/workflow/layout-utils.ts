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
  const minSpacing = 60; // Increased minimum spacing between nodes
  const dynamicWorkflowWidth = Math.max(500, Math.min(1200, (2 * padding) + (maxNodes * stageWidth) + ((maxNodes - 1) * minSpacing))); // Width between 500px-1200px
  
  // Calculate dynamic workflow height based on content
  const dynamicWorkflowHeight = Math.max(350, (2 * padding) + stageHeight + verticalSpacing + circleSize + 60); // Minimum height of 350px
  
  // Calculate horizontal spacing based on number of nodes
  const availableWidth = dynamicWorkflowWidth - (2 * padding);
  const totalNodeWidth = maxNodes * stageWidth;
  const nodeSpacing = maxNodes > 1 ? Math.max(minSpacing, (availableWidth - totalNodeWidth) / (maxNodes - 1)) : 0;

  // Calculate positions for each row
  const eventY = 70; // Events in first row
  const statusY = eventY + stageHeight + verticalSpacing; // Status in second row

  return {
    dynamicWorkflowWidth,
    dynamicWorkflowHeight,
    nodeSpacing: Math.max(nodeSpacing, 60), // Increased minimum spacing
    eventY,
    statusY,
    getEventPosition: (index: number) => ({
      x: padding + (index * (stageWidth + nodeSpacing)),
      y: eventY,
    }),
    getStatusPosition: (index: number) => ({
      x: padding + (index * (stageWidth + nodeSpacing)) + (stageWidth / 2) - (circleSize / 2),
      y: statusY,
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
    style: { width: layout.dynamicWorkflowWidth, height: layout.dynamicWorkflowHeight },
    draggable: true,
  });

  // Separate status and event nodes
  const statusNodes = workflowData.nodes.filter(node => node.type === 'status');
  const eventNodes = workflowData.nodes.filter(node => node.type === 'event');

  // Event nodes (rectangular, first row) - positioned dynamically  
  eventNodes.forEach((event, index) => {
    const position = layout.getEventPosition(index);
    
    nodes.push({
      id: event.id,
      type: 'workflow',
      position,
      data: {
        title: event.label,
        type: 'stage',
      } as WorkflowNodeData,
      parentId: workflowData.id,
      extent: 'parent',
      style: { width: config.stageWidth, height: config.stageHeight },
      draggable: true,
    });
  });

  // Status nodes (circular, second row) - positioned dynamically
  statusNodes.forEach((status, index) => {
    const position = layout.getStatusPosition(index);
    
    nodes.push({
      id: status.id,
      type: 'circular',
      position,
      data: {
        label: status.label,
      } as CircularNodeData,
      parentId: workflowData.id,
      extent: 'parent',
      draggable: true,
    });
  });

  return nodes;
};