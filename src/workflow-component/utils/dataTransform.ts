import { WorkflowData, WorkflowNode, WorkflowEdge, RawWorkflowData } from '../types';

/**
 * ============= DATA TRANSFORMATION UTILITIES =============
 * These functions handle converting various backend data formats into our standard format
 */

/**
 * Transforms raw workflow data from backend APIs into our standardized format
 * Handles various possible field names and structures
 */
export const transformWorkflowData = (rawData: RawWorkflowData): WorkflowData => {
  console.group('🔄 TRANSFORM WORKFLOW DATA DEBUG');
  console.log('📋 Input raw data:', JSON.stringify(rawData, null, 2));
  console.log('📋 Raw data type:', typeof rawData);
  console.log('📋 Raw data keys:', Object.keys(rawData));
  
  // Extract workflow data from various possible structures
  const workflowData = rawData.workflow || rawData.data || rawData;
  console.log('📋 Extracted workflow data:', JSON.stringify(workflowData, null, 2));
  console.log('📋 Workflow data keys:', Object.keys(workflowData));
  
  const fieldStatus = {
    hasNodes: !!workflowData.nodes,
    hasVertices: !!workflowData.vertices, 
    hasStates: !!workflowData.states,
    hasSteps: !!workflowData.steps,
    hasEdges: !!workflowData.edges,
    hasConnections: !!workflowData.connections,
    hasTransitions: !!workflowData.transitions,
    hasLinks: !!workflowData.links
  };
  console.log('📋 Field status check:', fieldStatus);
  
  // Deep inspection of data structure
  if (workflowData.nodes) {
    console.log('🔵 NODES DATA FOUND:');
    console.log('  - Type:', Array.isArray(workflowData.nodes) ? 'Array' : typeof workflowData.nodes);
    console.log('  - Length:', workflowData.nodes.length);
    console.log('  - Sample nodes:', workflowData.nodes.slice(0, 3));
  }
  
  if (workflowData.edges) {
    console.log('🔗 EDGES DATA FOUND:');
    console.log('  - Type:', Array.isArray(workflowData.edges) ? 'Array' : typeof workflowData.edges);
    console.log('  - Length:', workflowData.edges.length);
    console.log('  - Sample edges:', workflowData.edges.slice(0, 3));
  }
  
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
   * Handles different field naming conventions
   */
  const transformNodes = (rawNodes: any[]): WorkflowNode[] => {
    console.log('🔵 TRANSFORMING NODES:');
    console.log('  - Input type:', Array.isArray(rawNodes) ? 'Array' : typeof rawNodes);
    console.log('  - Input data:', JSON.stringify(rawNodes, null, 2));
    
    if (!Array.isArray(rawNodes)) {
      console.warn('⚠️ rawNodes is not an array:', rawNodes);
      return [];
    }
    
    const transformed = rawNodes.map((node, index) => {
      console.log(`  - Processing node ${index}:`, node);
      
      const id = node.id || node.nodeId || node.node_id || `node-${index}`;
      const type: 'status' | 'event' = (node.type?.toLowerCase() === 'status' || 
                   node.nodeType?.toLowerCase() === 'status' || 
                   node.node_type?.toLowerCase() === 'status') ? 'status' : 'event';
      const label = node.label || node.name || node.title || node.text || `Node ${index + 1}`;
      
      console.log(`    ✅ Transformed: id=${id}, type=${type}, label=${label}`);
      
      return { id, type, label };
    });
    
    console.log('🔵 NODES TRANSFORMATION COMPLETE:', transformed);
    return transformed;
  };

  /**
   * Transform edges from various possible formats
   * Handles different field naming conventions for connections
   */
  const transformEdges = (rawEdges: any[]): WorkflowEdge[] => {
    console.log('🔗 TRANSFORMING EDGES:');
    console.log('  - Input type:', Array.isArray(rawEdges) ? 'Array' : typeof rawEdges);
    console.log('  - Input data:', JSON.stringify(rawEdges, null, 2));
    
    if (!Array.isArray(rawEdges)) {
      console.warn('⚠️ rawEdges is not an array:', rawEdges);
      return [];
    }
    
    const transformed = rawEdges.map((edge, index) => {
      console.log(`  - Processing edge ${index}:`, edge);
      
      const id = edge.id || edge.edgeId || edge.edge_id || `edge-${index}`;
      const source = edge.source || edge.from || edge.sourceId || edge.source_id || '';
      const target = edge.target || edge.to || edge.targetId || edge.target_id || '';
      const label = edge.label || edge.name || edge.title || edge.text || '';
      
      console.log(`    ✅ Transformed: id=${id}, source=${source}, target=${target}, label=${label}`);
      
      return { id, source, target, label };
    });
    
    console.log('🔗 EDGES TRANSFORMATION COMPLETE:', transformed);
    return transformed;
  };

  // Extract nodes and edges with various fallback strategies
  let nodes: WorkflowNode[] = [];
  let edges: WorkflowEdge[] = [];

  // Try to find nodes in various possible field names
  if (workflowData.nodes) {
    console.log('🔵 Found nodes field, raw data:', workflowData.nodes);
    nodes = transformNodes(workflowData.nodes);
  } else if (workflowData.vertices) {
    console.log('🔵 Found vertices field, raw data:', workflowData.vertices);
    nodes = transformNodes(workflowData.vertices);
  } else if (workflowData.states) {
    console.log('🔵 Found states field, raw data:', workflowData.states);
    nodes = transformNodes(workflowData.states);
  } else if (workflowData.steps) {
    console.log('🔵 Found steps field, raw data:', workflowData.steps);
    nodes = transformNodes(workflowData.steps);
  } else {
    console.warn('⚠️ No node data found in any expected field');
  }

  // Try to find edges in various possible field names
  if (workflowData.edges) {
    console.log('🔗 Found edges field, raw data:', workflowData.edges);
    edges = transformEdges(workflowData.edges);
  } else if (workflowData.connections) {
    console.log('🔗 Found connections field, raw data:', workflowData.connections);
    edges = transformEdges(workflowData.connections);
  } else if (workflowData.transitions) {
    console.log('🔗 Found transitions field, raw data:', workflowData.transitions);
    edges = transformEdges(workflowData.transitions);
  } else if (workflowData.links) {
    console.log('🔗 Found links field, raw data:', workflowData.links);
    edges = transformEdges(workflowData.links);
  } else {
    console.warn('⚠️ No edge data found in any expected field');
  }

  const result = { id, name, description, nodes, edges };
  
  console.log('✅ TRANSFORMATION RESULT:', {
    id, 
    name, 
    description, 
    nodeCount: nodes.length, 
    edgeCount: edges.length
  });
  console.log('🔵 Final transformed nodes:', nodes);
  console.log('🔗 Final transformed edges:', edges);
  console.log('📋 Complete result object:', JSON.stringify(result, null, 2));
  console.groupEnd();

  return result;
};

/**
 * Validates transformed data and provides sensible defaults
 * Ensures we always have a workable workflow even with incomplete data
 */
export const validateWorkflowData = (data: WorkflowData): WorkflowData => {
  console.group('🔍 VALIDATE WORKFLOW DATA DEBUG');
  console.log('📋 Input validation data:', JSON.stringify(data, null, 2));
  
  const validatedData = { ...data };
  
  // Ensure we have at least some nodes for a meaningful workflow
  if (!validatedData.nodes || validatedData.nodes.length === 0) {
    console.warn('⚠️ CRITICAL: No nodes found, creating default Start/End nodes');
    validatedData.nodes = [
      { id: 'default-start', type: 'status', label: 'Start' },
      { id: 'default-end', type: 'status', label: 'End' }
    ];
    console.log('🔧 Created default nodes:', validatedData.nodes);
  } else {
    console.log(`✅ Found ${validatedData.nodes.length} nodes to validate`);
    console.log('🔵 Node details:', validatedData.nodes);
  }
  
  // Initialize edges array if missing
  if (!validatedData.edges) {
    console.log('🔧 Initializing empty edges array');
    validatedData.edges = [];
  } else {
    console.log(`🔗 Found ${validatedData.edges.length} edges to validate`);
  }
  
  // Remove any edges that reference non-existent nodes (data integrity)
  const nodeIds = new Set(validatedData.nodes.map(node => node.id));
  console.log('🔵 Available node IDs:', Array.from(nodeIds));
  
  const initialEdgeCount = validatedData.edges.length;
  validatedData.edges = validatedData.edges.filter(edge => {
    const hasValidSource = nodeIds.has(edge.source);
    const hasValidTarget = nodeIds.has(edge.target);
    const isValid = hasValidSource && hasValidTarget;
    
    if (!isValid) {
      console.warn(`⚠️ Removing invalid edge: ${edge.id} (${edge.source} -> ${edge.target})`);
      console.warn(`  - Source exists: ${hasValidSource}, Target exists: ${hasValidTarget}`);
    }
    
    return isValid;
  });
  
  const finalEdgeCount = validatedData.edges.length;
  if (initialEdgeCount !== finalEdgeCount) {
    console.warn(`🔧 Removed ${initialEdgeCount - finalEdgeCount} invalid edges`);
  }
  
  console.log('✅ VALIDATION COMPLETE:', {
    nodeCount: validatedData.nodes.length,
    edgeCount: validatedData.edges.length
  });
  console.log('📋 Final validated data:', JSON.stringify(validatedData, null, 2));
  console.groupEnd();
  
  return validatedData;
};