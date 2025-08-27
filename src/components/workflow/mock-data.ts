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

export const mockSimpleWorkflows: Record<string, SimpleWorkflow> = {
  'ebm-version': {
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
  },

  'customer-journey': {
    id: 'customer-journey-001',
    name: 'Customer Journey',
    description: 'Customer onboarding and verification workflow',
    nodes: [
      {
        id: 'n1',
        type: 'status',
        label: 'New Customer'
      },
      {
        id: 'n2',
        type: 'event',
        label: 'Registration'
      },
      {
        id: 'n3',
        type: 'status',
        label: 'Registered'
      },
      {
        id: 'n4',
        type: 'event',
        label: 'Verification'
      },
      {
        id: 'n5',
        type: 'status',
        label: 'Verified'
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'n1',
        target: 'n2',
        label: 'Start Registration'
      },
      {
        id: 'e2',
        source: 'n2',
        target: 'n3',
        label: 'Complete Registration'
      },
      {
        id: 'e3',
        source: 'n3',
        target: 'n4',
        label: 'Begin Verification'
      },
      {
        id: 'e4',
        source: 'n4',
        target: 'n5',
        label: 'Verification Complete'
      }
    ]
  },

  'payment-flow': {
    id: 'payment-flow-001',
    name: 'Payment Processing',
    description: 'End-to-end payment processing workflow',
    nodes: [
      {
        id: 'n1',
        type: 'status',
        label: 'Payment Initiated'
      },
      {
        id: 'n2',
        type: 'event',
        label: 'Validate'
      },
      {
        id: 'n3',
        type: 'status',
        label: 'Validated'
      },
      {
        id: 'n4',
        type: 'event',
        label: 'Process'
      },
      {
        id: 'n5',
        type: 'status',
        label: 'Completed'
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'n1',
        target: 'n2',
        label: 'Validate Payment'
      },
      {
        id: 'e2',
        source: 'n2',
        target: 'n3',
        label: 'Validation Success'
      },
      {
        id: 'e3',
        source: 'n3',
        target: 'n4',
        label: 'Process Payment'
      },
      {
        id: 'e4',
        source: 'n4',
        target: 'n5',
        label: 'Payment Complete'
      }
    ]
  }
};

export const defaultWorkflow = 'ebm-version';

// Legacy support - keeping old interface for existing components
export const mockWorkflows = {};  // Empty object for backward compatibility