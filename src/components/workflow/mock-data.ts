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
      id: 's1',
      type: 'status',
      label: 'Start'
    },
    {
      id: 's2',
      type: 'status',
      label: 'Created'
    },
    {
      id: 'ev1',
      type: 'event',
      label: 'Link'
    },
    {
      id: 's3',
      type: 'status',
      label: 'Locked'
    },
    {
      id: 'ev2',
      type: 'event',
      label: 'Approve'
    },
    {
      id: 's4',
      type: 'status',
      label: 'Deployed'
    },
    {
      id: 'ev3',
      type: 'event',
      label: 'Deploy'
    },
    {
      id: 's5',
      type: 'status',
      label: 'Canceled'
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 's1',
      target: 'ev1',
      label: 'Link'
    },
    {
      id: 'e2',
      source: 'ev1',
      target: 's2',
      label: 'Created'
    },
    {
      id: 'e3',
      source: 's2',
      target: 'ev2',
      label: 'Approve'
    },
    {
      id: 'e4',
      source: 'ev2',
      target: 's3',
      label: 'Locked'
    },
    {
      id: 'e5',
      source: 's3',
      target: 'ev3',
      label: 'Deploy EBM version'
    },
    {
      id: 'e6',
      source: 'ev3',
      target: 's4',
      label: 'Deployed'
    },
    {
      id: 'e7',
      source: 's4',
      target: 's5',
      label: 'Canceled'
    }
  ]
};

// Customer Onboarding workflow - simplified version
const customerOnboardingWorkflow: SimpleWorkflow = {
  id: 'customer-onboarding',
  name: 'Customer Onboarding',
  description: 'New customer registration workflow',
  nodes: [
    {
      id: 'co1',
      type: 'event',
      label: 'Register'
    },
    {
      id: 'co2',
      type: 'status',
      label: 'Registered'
    }
  ],
  edges: [
    {
      id: 'co_e1',
      source: 'co1',
      target: 'co2',
      label: 'Customer registered'
    }
  ]
};

// Payment Processing workflow - simplified version
const paymentProcessingWorkflow: SimpleWorkflow = {
  id: 'payment-processing',
  name: 'Payment Processing',  
  description: 'End-to-end payment processing workflow',
  nodes: [
    {
      id: 'pp1',
      type: 'event',
      label: 'Process'
    },
    {
      id: 'pp2',
      type: 'status',
      label: 'Processing'
    }
  ],
  edges: [
    {
      id: 'pp_e1',
      source: 'pp1',
      target: 'pp2',
      label: 'Payment initiated'
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
    entities: [
      { id: 'entity-1', title: 'Customer Data', color: 'yellow' },
      { id: 'entity-2', title: 'Payment Info', color: 'yellow' },
      { id: 'entity-3', title: 'Order Details' }
    ]
  };
};

// Update existing workflows to include new EBM data
export const mockWorkflows: Record<string, WorkflowData> = {
  'ebm-version': convertToWorkflowData(ebmVersionWorkflow),
  'customer-onboarding': convertToWorkflowData(customerOnboardingWorkflow),
  'payment-processing': convertToWorkflowData(paymentProcessingWorkflow)
};

// Export the simple workflows for direct edge information
export const simpleWorkflows: Record<string, SimpleWorkflow> = {
  'ebm-version': ebmVersionWorkflow,
  'customer-onboarding': customerOnboardingWorkflow,
  'payment-processing': paymentProcessingWorkflow
};

export const defaultWorkflow = 'ebm-version';