import { WorkflowData, RawWorkflowData, WorkflowNode, WorkflowEdge } from '../../models/singleView/nodeTypes';

/**
 * Transforms raw workflow data from backend APIs into our standardized format
 * Handles various possible field names and structures
 */
export const transformWorkflowData = (rawData: RawWorkflowData): WorkflowData => {
  console.group('🔄 TRANSFORM WORKFLOW DATA DEBUG');
  console.log('📋 Input raw data:', JSON.stringify(rawData, null, 2));
  
  // Extract workflow data from various possible structures
  const workflowData = rawData.workflow || rawData.data || rawData;
  
  // Extract basic properties with multiple fallback options
  const id = workflowData.id || 
             workflowData.workflowId || 
             workflowData.workflow_id || 
             workflowData.uuid || 
             `workflow-${Date.now()}`;
             
  const name = workflowData.name || 
               workflowData.title || 
               workflowData.workflow_name || 
               workflowData.workflowName || 
               'Unnamed Workflow';
               
  const description = workflowData.description || 
                      workflowData.desc || 
                      workflowData.summary || 
                      'No description available';

  /**
   * Transform nodes from various possible formats
   */
  const transformNodes = (rawNodes: any[]): WorkflowNode[] => {
    if (!Array.isArray(rawNodes)) {
      return [];
    }
    
    return rawNodes.map((node, index) => {
      const id = node.id || node.nodeId || node.node_id || `node-${index}`;
      const type: 'status' | 'event' = (node.type?.toLowerCase() === 'status' || 
                   node.nodeType?.toLowerCase() === 'status' || 
                   node.node_type?.toLowerCase() === 'status') ? 'status' : 'event';
      const label = node.label || node.name || node.title || node.text || `Node ${index + 1}`;
      
      return { id, type, label };
    });
  };

  /**
   * Transform edges from various possible formats
   */
  const transformEdges = (rawEdges: any[]): WorkflowEdge[] => {
    if (!Array.isArray(rawEdges)) {
      return [];
    }
    
    return rawEdges.map((edge, index) => {
      const id = edge.id || edge.edgeId || edge.edge_id || `edge-${index}`;
      const source = edge.source || edge.from || edge.sourceId || edge.source_id || '';
      const target = edge.target || edge.to || edge.targetId || edge.target_id || '';
      const label = edge.label || edge.name || edge.title || edge.text || '';
      
      return { id, source, target, label };
    });
  };

  // Extract nodes and edges with various fallback strategies
  let nodes: WorkflowNode[] = [];
  let edges: WorkflowEdge[] = [];

  // Try to find nodes in various possible field names
  if (workflowData.nodes) {
    nodes = transformNodes(workflowData.nodes);
  } else if (workflowData.vertices) {
    nodes = transformNodes(workflowData.vertices);
  } else if (workflowData.states) {
    nodes = transformNodes(workflowData.states);
  } else if (workflowData.steps) {
    nodes = transformNodes(workflowData.steps);
  }

  // Try to find edges in various possible field names
  if (workflowData.edges) {
    edges = transformEdges(workflowData.edges);
  } else if (workflowData.connections) {
    edges = transformEdges(workflowData.connections);
  } else if (workflowData.transitions) {
    edges = transformEdges(workflowData.transitions);
  } else if (workflowData.links) {
    edges = transformEdges(workflowData.links);
  }

  const result = { id, name, description, nodes, edges };
  console.log('✅ TRANSFORMATION RESULT:', result);
  console.groupEnd();

  return result;
};

/**
 * Validates transformed data and provides sensible defaults
 */
export const validateWorkflowData = (data: WorkflowData): WorkflowData => {
  const validatedData = { ...data };
  
  // Ensure we have at least some nodes for a meaningful workflow
  if (!validatedData.nodes || validatedData.nodes.length === 0) {
    validatedData.nodes = [
      { id: 'default-start', type: 'status', label: 'Start' },
      { id: 'default-end', type: 'status', label: 'End' }
    ];
  }
  
  // Initialize edges array if missing
  if (!validatedData.edges) {
    validatedData.edges = [];
  }
  
  // Remove any edges that reference non-existent nodes
  const nodeIds = new Set(validatedData.nodes.map(node => node.id));
  validatedData.edges = validatedData.edges.filter(edge => 
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  
  return validatedData;
};

export const mockWorkflows: Record<string, WorkflowData> = {
  'ebm-version': {
    id: "f564cd67-2502-46a1-8494-4f61df616811",
    name: "EBM Version",
    description: "Workflow definition for grouping a set of applications",
    nodes: [
      { id: "s1", type: "status", label: "Start" },
      { id: "s2", type: "status", label: "Created" },
      { id: "ev1", type: "event", label: "Link" },
      { id: "s3", type: "status", label: "Locked" },
      { id: "ev2", type: "event", label: "Approve" },
      { id: "s4", type: "status", label: "Deployed" },
      { id: "ev3", type: "event", label: "Deploy" },
      { id: "s5", type: "status", label: "Canceled" },
      { id: "ev4", type: "event", label: "Cancel" }
    ],
    edges: [
      { id: "e1", source: "s1", target: "ev1", label: "" },
      { id: "e2", source: "ev1", target: "s2", label: "" },
      { id: "e3", source: "s2", target: "ev2", label: "" },
      { id: "e4", source: "ev2", target: "s3", label: "" },
      { id: "e5", source: "s3", target: "ev3", label: "" },
      { id: "e6", source: "ev3", target: "s4", label: "" },
      { id: "e7", source: "s2", target: "ev4", label: "" },
      { id: "e8", source: "ev4", target: "s5", label: "" }
    ]
  }
};

export const defaultWorkflow = 'ebm-version';