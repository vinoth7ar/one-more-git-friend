import { WorkflowData } from './types';

export const mockWorkflows: Record<string, WorkflowData> = {
  'ebm-version': {
    id: "f564cd67-2502-46a1-8494-4f61df616811",
    name: "EBM Version",
    description: "Workflow definition for grouping a set of applications",
    nodes: [
      {
        id: "s1",
        type: "status",
        label: "Start"
      },
      {
        id: "s2", 
        type: "status",
        label: "Created"
      },
      {
        id: "ev1",
        type: "event",
        label: "Link"
      },
      {
        id: "s3",
        type: "status", 
        label: "Locked"
      },
      {
        id: "ev2",
        type: "event",
        label: "Approve"
      },
      {
        id: "s4",
        type: "status",
        label: "Deployed"
      },
      {
        id: "ev3",
        type: "event",
        label: "Deploy"
      },
      {
        id: "s5",
        type: "status",
        label: "Canceled"
      },
      {
        id: "ev4",
        type: "event", 
        label: "Cancel"
      }
    ],
    edges: [
      {
        id: "e1",
        source: "s1",
        target: "ev1",
        label: "Link"
      },
      {
        id: "e2",
        source: "ev1",
        target: "s2",
        label: "Created"
      },
      {
        id: "e3",
        source: "s2",
        target: "ev2",
        label: "Approve"
      },
      {
        id: "e4",
        source: "ev2",
        target: "s3",
        label: "Locked"
      },
      {
        id: "e5",
        source: "s3",
        target: "ev3",
        label: "Deploy EBM version"
      },
      {
        id: "e6",
        source: "ev3",
        target: "s4",
        label: "Deployed"
      },
      {
        id: "e7",
        source: "s3",
        target: "ev3",
        label: "Deploy EBM version"
      },
      {
        id: "e8",
        source: "ev3",
        target: "s4",
        label: "Deployed"
      },
      {
        id: "e9",
        source: "s4",
        target: "ev3",
        label: "Deploy EBM version"
      },
      {
        id: "e10",
        source: "ev3",
        target: "s4",
        label: "Deployed"
      },
      {
        id: "e11",
        source: "s2",
        target: "ev4",
        label: "Deploy EBM version"
      },
      {
        id: "e12",
        source: "ev4",
        target: "s5",
        label: "Canceled"
      }
    ]
  },
  'test-workflow': {
    id: "test-workflow-id",
    name: "Test Workflow",
    description: "Simple test workflow with two nodes",
    nodes: [
      {
        id: "test-event-1",
        type: "event",
        label: "Start"
      },
      {
        id: "test-event-2",
        type: "event",
        label: "Finish"
      },
      {
        id: "test-status-1",
        type: "status",
        label: "pending"
      },
      {
        id: "test-status-2",
        type: "status",
        label: "completed"
      }
    ],
    edges: [
      {
        id: "test-edge-1",
        source: "test-event-1",
        target: "test-status-1",
        label: ""
      },
      {
        id: "test-edge-2",
        source: "test-status-1",
        target: "test-event-2",
        label: ""
      },
      {
        id: "test-edge-3",
        source: "test-event-2",
        target: "test-status-2",
        label: ""
      }
    ]
  }
};

export const defaultWorkflow = 'ebm-version';