import { WorkflowData } from './types';

export const mockWorkflows: Record<string, WorkflowData> = {
  'hypo-loan-position': {
    workflow: {
      id: 'hypo-loan-position-workflow',
      title: 'Hypo Loan Position',
      description: 'Workflow description',
    },
    stages: [
      {
        id: 'stage-node',
        title: 'Stage',
        description: 'PLMF stages commitment data in PMF database.',
        color: 'gray',
      },
      {
        id: 'enrich-node', 
        title: 'Enrich',
        description: 'PMF enriches hypo loan positions.',
        color: 'gray',
      }
    ],
    statusNodes: [
      {
        id: 'staged-circle',
        label: 'staged',
        color: 'gray',
        connectedToStage: 'stage-node',
        connectedToEntities: ['data-entity-1'],
      },
      {
        id: 'position-created-circle',
        label: 'position created',
        color: 'gray',
        connectedToStage: 'enrich-node',
        connectedToEntities: ['data-entity-1'],
      }
    ],
    entities: [
      {
        id: 'data-entity-1',
        title: 'Hypo Loan Position',
        color: 'yellow',
      },
      {
        id: 'data-entity-2', 
        title: 'Loan Commitment',
        color: 'gray',
      },
      {
        id: 'data-entity-3',
        title: 'Hypo Loan Base Price',
        color: 'gray',
      }
    ]
  },

  'hypo-loan': {
    workflow: {
      id: 'hypo-loan-workflow',
      title: 'Hypo Loan',
      description: 'Complete loan processing workflow',
    },
    stages: [
      {
        id: 'validate-stage',
        title: 'Validate',
        description: 'Validate loan application data.',
        color: 'blue',
      },
      {
        id: 'process-stage',
        title: 'Process',
        description: 'Process loan through system.',
        color: 'green',
      },
      {
        id: 'approve-stage',
        title: 'Approve',
        description: 'Final approval stage.',
        color: 'purple',
      }
    ],
    statusNodes: [
      {
        id: 'validated-status',
        label: 'validated',
        color: 'blue',
        connectedToStage: 'validate-stage',
        connectedToEntities: ['loan-entity', 'customer-entity'],
      },
      {
        id: 'processed-status',
        label: 'processed',
        color: 'green',
        connectedToStage: 'process-stage',
        connectedToEntities: ['loan-entity', 'approval-entity'],
      },
      {
        id: 'approved-status',
        label: 'approved',
        color: 'purple',
        connectedToStage: 'approve-stage',
        connectedToEntities: ['loan-entity', 'approval-entity'],
      }
    ],
    entities: [
      {
        id: 'loan-entity',
        title: 'Loan Application',
        color: 'yellow',
      },
      {
        id: 'customer-entity',
        title: 'Customer Profile',
        color: 'gray',
      },
      {
        id: 'approval-entity',
        title: 'Approval Record',
        color: 'gray',
      },
      {
        id: 'rate-entity',
        title: 'Interest Rate',
        color: 'gray',
      }
    ]
  },

  'workflow-1': {
    workflow: {
      id: 'workflow-1-id',
      title: 'Customer Onboarding',
      description: 'New customer registration workflow',
    },
    stages: [
      {
        id: 'registration-stage',
        title: 'Register',
        description: 'Customer registration process.',
        color: 'orange',
      },
      {
        id: 'verification-stage',
        title: 'Verify',
        description: 'Identity verification step.',
        color: 'red',
      }
    ],
    statusNodes: [
      {
        id: 'registered-status',
        label: 'registered',
        color: 'orange',
        connectedToStage: 'registration-stage',
        connectedToEntities: ['customer-profile'],
      },
      {
        id: 'verified-status',
        label: 'verified',
        color: 'red',
        connectedToStage: 'verification-stage',
        connectedToEntities: ['customer-profile', 'verification-record'],
      }
    ],
    entities: [
      {
        id: 'customer-profile',
        title: 'Customer Profile',
        color: 'yellow',
      },
      {
        id: 'verification-record',
        title: 'Verification Record',
        color: 'gray',
      },
      {
        id: 'compliance-check',
        title: 'Compliance Check',
        color: 'gray',
      }
    ]
  },

  'workflow-2': {
    workflow: {
      id: 'workflow-2-id',
      title: 'Payment Processing',
      description: 'Transaction payment workflow',
    },
    stages: [
      {
        id: 'capture-stage',
        title: 'Capture',
        description: 'Capture payment details.',
        color: 'teal',
      },
      {
        id: 'authorize-stage',
        title: 'Authorize',
        description: 'Authorize payment transaction.',
        color: 'indigo',
      },
      {
        id: 'settle-stage',
        title: 'Settle',
        description: 'Settle the payment.',
        color: 'pink',
      }
    ],
    statusNodes: [
      {
        id: 'captured-status',
        label: 'captured',
        color: 'teal',
        connectedToStage: 'capture-stage',
        connectedToEntities: ['payment-details'],
      },
      {
        id: 'authorized-status',
        label: 'authorized',
        color: 'indigo',
        connectedToStage: 'authorize-stage',
        connectedToEntities: ['payment-details', 'auth-record'],
      },
      {
        id: 'settled-status',
        label: 'settled',
        color: 'pink',
        connectedToStage: 'settle-stage',
        connectedToEntities: ['payment-details', 'settlement-record'],
      }
    ],
    entities: [
      {
        id: 'payment-details',
        title: 'Payment Details',
        color: 'yellow',
      },
      {
        id: 'auth-record',
        title: 'Authorization Record',
        color: 'gray',
      },
      {
        id: 'settlement-record',
        title: 'Settlement Record',
        color: 'gray',
      },
      {
        id: 'merchant-account',
        title: 'Merchant Account',
        color: 'gray',
      },
      {
        id: 'transaction-log',
        title: 'Transaction Log',
        color: 'gray',
      }
    ]
  }
};

export const defaultWorkflow = 'hypo-loan-position';