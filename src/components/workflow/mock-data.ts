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

// Customer Onboarding workflow
const customerOnboardingWorkflow: SimpleWorkflow = {
  id: 'customer-onboarding',
  name: 'Customer Onboarding',
  description: 'Complete customer onboarding process workflow',
  nodes: [
    {
      id: 'co1',
      type: 'status',
      label: 'New Customer'
    },
    {
      id: 'co2',
      type: 'event',
      label: 'Verify Identity'
    },
    {
      id: 'co3',
      type: 'status',
      label: 'Verified'
    },
    {
      id: 'co4',
      type: 'event',
      label: 'Setup Account'
    },
    {
      id: 'co5',
      type: 'status',
      label: 'Active'
    }
  ],
  edges: [
    {
      id: 'co_e1',
      source: 'co1',
      target: 'co2',
      label: 'Start verification'
    },
    {
      id: 'co_e2',
      source: 'co2',
      target: 'co3',
      label: 'Identity confirmed'
    },
    {
      id: 'co_e3',
      source: 'co3',
      target: 'co4',
      label: 'Begin setup'
    },
    {
      id: 'co_e4',
      source: 'co4',
      target: 'co5',
      label: 'Account ready'
    }
  ]
};

// Payment Processing workflow
const paymentProcessingWorkflow: SimpleWorkflow = {
  id: 'payment-processing',
  name: 'Payment Processing',
  description: 'End-to-end payment processing workflow',
  nodes: [
    {
      id: 'pp1',
      type: 'status',
      label: 'Payment Initiated'
    },
    {
      id: 'pp2',
      type: 'event',
      label: 'Validate Payment'
    },
    {
      id: 'pp3',
      type: 'status',
      label: 'Validated'
    },
    {
      id: 'pp4',
      type: 'event',
      label: 'Process Payment'
    },
    {
      id: 'pp5',
      type: 'status',
      label: 'Processing'
    },
    {
      id: 'pp6',
      type: 'event',
      label: 'Complete Transaction'
    },
    {
      id: 'pp7',
      type: 'status',
      label: 'Completed'
    }
  ],
  edges: [
    {
      id: 'pp_e1',
      source: 'pp1',
      target: 'pp2',
      label: 'Begin validation'
    },
    {
      id: 'pp_e2',
      source: 'pp2',
      target: 'pp3',
      label: 'Validation success'
    },
    {
      id: 'pp_e3',
      source: 'pp3',
      target: 'pp4',
      label: 'Start processing'
    },
    {
      id: 'pp_e4',
      source: 'pp4',
      target: 'pp5',
      label: 'Processing started'
    },
    {
      id: 'pp_e5',
      source: 'pp5',
      target: 'pp6',
      label: 'Ready to complete'
    },
    {
      id: 'pp_e6',
      source: 'pp6',
      target: 'pp7',
      label: 'Transaction done'
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