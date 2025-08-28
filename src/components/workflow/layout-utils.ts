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
  const { stages, statusNodes, entities } = workflowData;
  const { workflowWidth, stageWidth, padding, verticalSpacing, stageHeight, circleSize } = config;

  // Calculate the maximum number of nodes in a row to determine layout
  const maxNodesPerRow = Math.max(stages.length, statusNodes.length);
  
  // Calculate horizontal spacing based on number of stages
  const availableWidth = workflowWidth - (2 * padding);
  const totalStageWidth = maxNodesPerRow * stageWidth;
  const stageSpacing = maxNodesPerRow > 1 ? (availableWidth - totalStageWidth) / (maxNodesPerRow - 1) : 0;

  // Calculate positions for each row - make workflow taller to accommodate more nodes
  const stageY = 70;
  const circleY = stageY + stageHeight + 20; // Closer to event nodes
  const entitiesY = circleY + circleSize + verticalSpacing + 40; // Extra space for more status nodes
  
  // Update workflow height based on content
  const dynamicHeight = entitiesY + 100; // Add padding at bottom

  return {
    stageSpacing: Math.max(stageSpacing, 20), // Minimum spacing
    stageY,
    circleY,
    entitiesY,
    dynamicHeight,
    getStagePosition: (index: number) => ({
      x: padding + (index * (stageWidth + stageSpacing)),
      y: stageY,
    }),
    getCirclePosition: (index: number) => ({
      x: padding + (index * (stageWidth + stageSpacing)) + (stageWidth / 2) - (circleSize / 2),
      y: circleY,
    }),
    getEntitiesPosition: () => ({
      x: padding,
      y: entitiesY,
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

  // PMF Tag (outside workflow)
  nodes.push({
    id: 'pmf-tag',
    type: 'pmf-tag',
    position: { x: 20, y: 20 },
    data: {
      title: 'PMF',
      type: 'pmf-tag',
      onClick: () => console.log('PMF tag clicked'),
    } as WorkflowNodeData,
    draggable: true,
  });

  // Main workflow container
  nodes.push({
    id: workflowData.workflow.id,
    type: 'workflow',
    position: { x: 20, y: 60 },
    data: {
      title: workflowData.workflow.title,
      description: workflowData.workflow.description,
      type: 'workflow',
    } as WorkflowNodeData,
    style: { width: config.workflowWidth, height: layout.dynamicHeight },
    draggable: true,
  });

  // Event nodes (rectangular) - positioned dynamically
  workflowData.stages.forEach((stage, index) => {
    const position = layout.getStagePosition(index);
    
    nodes.push({
      id: stage.id,
      type: 'workflow-node',
      position,
      data: {
        title: stage.title,
        description: stage.description,
        type: 'process',
        color: stage.color,
        onClick: () => console.log(`${stage.title} event clicked`),
      } as WorkflowNodeData,
      parentId: workflowData.workflow.id,
      extent: 'parent',
      style: { width: config.stageWidth, height: config.stageHeight },
      draggable: false,
    });
  });

  // Status nodes (circular) - positioned dynamically
  workflowData.statusNodes.forEach((status, index) => {
    const position = layout.getCirclePosition(index);
    
    nodes.push({
      id: status.id,
      type: 'circular',
      position,
      data: {
        label: status.label,
        color: status.color,
        onClick: () => console.log(`${status.label} status clicked`),
      } as CircularNodeData,
      parentId: workflowData.workflow.id,
      extent: 'parent',
      draggable: false,
    });
  });

  // Entities group node
  const entitiesPosition = layout.getEntitiesPosition();
  nodes.push({
    id: 'entities-group',
    type: 'entities-group',
    position: entitiesPosition,
    data: {
      title: 'Data Entities',
      type: 'entities-group',
      entities: workflowData.entities,
      entitiesExpanded,
      onToggleEntities,
      onClick: () => console.log('Entities group clicked'),
    } as WorkflowNodeData,
    parentId: workflowData.workflow.id,
    extent: 'parent' as const,
    draggable: true,
  });

  return nodes;
};