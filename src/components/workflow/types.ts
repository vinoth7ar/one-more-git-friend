export interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  color?: string;
}

export interface WorkflowStatusNode {
  id: string;
  label: string;
  color?: string;
  connectedToStage?: string;
  connectedToEntities?: string[];
}

export interface WorkflowEntity {
  id: string;
  title: string;
  color?: string;
}

export interface WorkflowData {
  workflow: {
    id: string;
    title: string;
    description: string;
  };
  stages: WorkflowStage[];
  statusNodes: WorkflowStatusNode[];
  entities: WorkflowEntity[];
}

export interface LayoutConfig {
  workflowWidth: number;
  workflowHeight: number;
  stageWidth: number;
  stageHeight: number;
  circleSize: number;
  padding: number;
  verticalSpacing: number;
}