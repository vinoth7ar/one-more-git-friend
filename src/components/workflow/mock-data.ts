// Import existing workflow types
import { WorkflowData } from './types';

// New workflow data structure based on uploaded JSON
export interface SimpleWorkflowNode {
  id: string;
  type: 'status' | 'event';
  label: string;
}

export interface SimpleWorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SimpleWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: SimpleWorkflowNode[];
  edges: SimpleWorkflowEdge[];
}

// EBM Version workflow from user's JSON
const ebmVersionWorkflow: SimpleWorkflow = {
  id: 'f564cd67-2502-46a1-8494-4f61df616811',
  name: 'EBM Version',
  description: 'Workflow definition for grouping a set of application versions into an EBM version',
  nodes: [
    {
      id: 'n1',
      type: 'status',
      label: 'Start'
    },
    {
      id: 'n2',
      type: 'status',
      label: 'Created'
    },
    {
      id: 'n3',
      type: 'event',
      label: 'Link'
    },
    {
      id: 'n4',
      type: 'status',
      label: 'Deployed'
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'n1',
      target: 'n3',
      label: 'Create EBM version'
    },
    {
      id: 'e2',
      source: 'n3',
      target: 'n2',
      label: 'Created'
    },
    {
      id: 'e3',
      source: 'n2',
      target: 'n3',
      label: 'Modify EBM version'
    },
    {
      id: 'e4',
      source: 'n3',
      target: 'n4',
      label: 'Deploy'
    }
  ]
};

// Convert the new JSON structure to work with existing WorkflowBuilder
const convertToWorkflowData = (simpleWorkflow: SimpleWorkflow): WorkflowData => {
  return {
    workflow: {
      id: simpleWorkflow.id,
      title: simpleWorkflow.name,
      description: simpleWorkflow.description,
    },
    stages: simpleWorkflow.nodes
      .filter(node => node.type === 'event')
      .map(node => ({
        id: node.id,
        title: node.label,
        description: `${node.type} node`
      })),
    statusNodes: simpleWorkflow.nodes
      .filter(node => node.type === 'status')
      .map(node => ({
        id: node.id,
        label: node.label,
        color: 'default' as const
      })),
    entities: [] // Empty for simple workflows
  };
};

// Update existing workflows to include new EBM data
export const mockWorkflows: Record<string, WorkflowData> = {
  'pmf-core': {
    workflow: {
      id: 'pmf-core',
      title: 'PMF Core Workflow',
      description: 'The main PMF workflow with complete stages'
    },
    stages: [
      { id: 'discovery', title: 'Discovery', description: 'Problem discovery phase' },
      { id: 'validation', title: 'Validation', description: 'Solution validation phase' },
      { id: 'optimization', title: 'Optimization', description: 'Product optimization phase' }
    ],
    statusNodes: [
      { id: 'status-1', label: 'In Progress', color: 'default' },
      { id: 'status-2', label: 'Validated', color: 'default' },
      { id: 'status-3', label: 'Optimized', color: 'default' }
    ],
    entities: [
      { id: 'problem', title: 'Problem Statement', color: 'yellow' },
      { id: 'solution', title: 'Solution Design', color: 'default' },
      { id: 'target-customer', title: 'Target Customer', color: 'default' }
    ]
  },
  'ebm-version': convertToWorkflowData(ebmVersionWorkflow)
};

export const defaultWorkflow = 'ebm-version';