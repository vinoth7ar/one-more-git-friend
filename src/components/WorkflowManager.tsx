import { useCallback, useState, useEffect, memo, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw, Layout } from 'lucide-react';

// ============= TYPES (from types.ts) =============
export interface WorkflowNode {
  id: string;
  type: 'status' | 'event';
  label: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// ============= DATA TRANSFORMATION UTILITIES =============
export interface RawWorkflowData {
  [key: string]: any;
}

// Flexible data transformer that can handle various backend response formats
export const transformWorkflowData = (rawData: RawWorkflowData): WorkflowData => {
  console.log('Transforming raw data:', rawData);
  
  // Try to extract workflow data from various possible structures
  const workflowData = rawData.workflow || rawData.data || rawData;
  
  // Extract basic properties with fallbacks
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

  // Transform nodes from various possible formats
  const transformNodes = (rawNodes: any[]): WorkflowNode[] => {
    if (!Array.isArray(rawNodes)) return [];
    
    return rawNodes.map((node, index) => ({
      id: node.id || node.nodeId || node.node_id || `node-${index}`,
      type: (node.type?.toLowerCase() === 'status' || 
             node.nodeType?.toLowerCase() === 'status' || 
             node.node_type?.toLowerCase() === 'status') ? 'status' : 'event',
      label: node.label || node.name || node.title || node.text || `Node ${index + 1}`
    }));
  };

  // Transform edges from various possible formats
  const transformEdges = (rawEdges: any[]): WorkflowEdge[] => {
    if (!Array.isArray(rawEdges)) return [];
    
    return rawEdges.map((edge, index) => ({
      id: edge.id || edge.edgeId || edge.edge_id || `edge-${index}`,
      source: edge.source || edge.from || edge.sourceId || edge.source_id || '',
      target: edge.target || edge.to || edge.targetId || edge.target_id || '',
      label: edge.label || edge.name || edge.title || edge.text || ''
    }));
  };

  // Extract nodes and edges with various fallback strategies
  let nodes: WorkflowNode[] = [];
  let edges: WorkflowEdge[] = [];

  // Try to find nodes in various possible locations
  if (workflowData.nodes) {
    nodes = transformNodes(workflowData.nodes);
  } else if (workflowData.vertices) {
    nodes = transformNodes(workflowData.vertices);
  } else if (workflowData.states) {
    nodes = transformNodes(workflowData.states);
  } else if (workflowData.steps) {
    nodes = transformNodes(workflowData.steps);
  }

  // Try to find edges in various possible locations
  if (workflowData.edges) {
    edges = transformEdges(workflowData.edges);
  } else if (workflowData.connections) {
    edges = transformEdges(workflowData.connections);
  } else if (workflowData.transitions) {
    edges = transformEdges(workflowData.transitions);
  } else if (workflowData.links) {
    edges = transformEdges(workflowData.links);
  }

  console.log('Transformed workflow data:', { id, name, description, nodes, edges });

  return {
    id,
    name,
    description,
    nodes,
    edges
  };
};

// Validate transformed data and provide defaults if needed
export const validateWorkflowData = (data: WorkflowData): WorkflowData => {
  const validatedData = { ...data };
  
  // Ensure we have at least some nodes
  if (!validatedData.nodes || validatedData.nodes.length === 0) {
    validatedData.nodes = [
      { id: 'default-start', type: 'status', label: 'Start' },
      { id: 'default-end', type: 'status', label: 'End' }
    ];
  }
  
  // Ensure we have valid edges
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

export interface LayoutConfig {
  workflowWidth: number;
  workflowHeight: number;
  stageWidth: number;
  stageHeight: number;
  circleSize: number;
  padding: number;
  spacing: number;
  isHorizontal: boolean;
}

// ============= MOCK DATA (from mock-data.ts) =============
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
  },
  'mortgage-origination': {
    id: "mortgage-origination-001",
    name: "Mortgage Origination Workflow",
    description: "Complete mortgage loan origination process from application to funding",
    nodes: [
      { id: "app-start", type: "status", label: "Application Start" },
      { id: "collect-docs", type: "event", label: "Document Collection" },
      { id: "doc-review", type: "status", label: "Document Review" },
      { id: "credit-check", type: "event", label: "Credit Verification" },
      { id: "income-verify", type: "event", label: "Income Verification" },
      { id: "property-appraisal", type: "event", label: "Property Appraisal" },
      { id: "underwriting", type: "status", label: "Underwriting Review" },
      { id: "approval-decision", type: "event", label: "Approval Decision" },
      { id: "approved", type: "status", label: "Approved" },
      { id: "rejected", type: "status", label: "Rejected" },
      { id: "conditions", type: "status", label: "Conditional Approval" },
      { id: "fulfill-conditions", type: "event", label: "Fulfill Conditions" },
      { id: "final-approval", type: "event", label: "Final Approval" },
      { id: "closing", type: "status", label: "Closing Process" },
      { id: "funding", type: "status", label: "Loan Funded" }
    ],
    edges: [
      { id: "e1", source: "app-start", target: "collect-docs", label: "" },
      { id: "e2", source: "collect-docs", target: "doc-review", label: "" },
      { id: "e3", source: "doc-review", target: "credit-check", label: "" },
      { id: "e4", source: "credit-check", target: "income-verify", label: "" },
      { id: "e5", source: "income-verify", target: "property-appraisal", label: "" },
      { id: "e6", source: "property-appraisal", target: "underwriting", label: "" },
      { id: "e7", source: "underwriting", target: "approval-decision", label: "" },
      { id: "e8", source: "approval-decision", target: "approved", label: "" },
      { id: "e9", source: "approval-decision", target: "rejected", label: "" },
      { id: "e10", source: "approval-decision", target: "conditions", label: "" },
      { id: "e11", source: "conditions", target: "fulfill-conditions", label: "" },
      { id: "e12", source: "fulfill-conditions", target: "final-approval", label: "" },
      { id: "e13", source: "final-approval", target: "approved", label: "" },
      { id: "e14", source: "approved", target: "closing", label: "" },
      { id: "e15", source: "closing", target: "funding", label: "" }
    ]
  },
  'risk-assessment': {
    id: "risk-assessment-002",
    name: "Credit Risk Assessment",
    description: "Comprehensive credit risk evaluation workflow for mortgage applications",
    nodes: [
      { id: "risk-start", type: "status", label: "Risk Assessment Start" },
      { id: "data-collection", type: "event", label: "Data Collection" },
      { id: "credit-score", type: "event", label: "Credit Score Analysis" },
      { id: "debt-ratio", type: "event", label: "Debt-to-Income Ratio" },
      { id: "employment-history", type: "event", label: "Employment History" },
      { id: "asset-verification", type: "event", label: "Asset Verification" },
      { id: "risk-modeling", type: "status", label: "Risk Modeling" },
      { id: "fraud-check", type: "event", label: "Fraud Detection" },
      { id: "compliance-check", type: "event", label: "Compliance Review" },
      { id: "risk-score", type: "status", label: "Risk Score Generated" },
      { id: "low-risk", type: "status", label: "Low Risk" },
      { id: "medium-risk", type: "status", label: "Medium Risk" },
      { id: "high-risk", type: "status", label: "High Risk" },
      { id: "manual-review", type: "event", label: "Manual Review Required" },
      { id: "risk-approved", type: "status", label: "Risk Approved" },
      { id: "risk-declined", type: "status", label: "Risk Declined" }
    ],
    edges: [
      { id: "r1", source: "risk-start", target: "data-collection", label: "" },
      { id: "r2", source: "data-collection", target: "credit-score", label: "" },
      { id: "r3", source: "data-collection", target: "debt-ratio", label: "" },
      { id: "r4", source: "data-collection", target: "employment-history", label: "" },
      { id: "r5", source: "data-collection", target: "asset-verification", label: "" },
      { id: "r6", source: "credit-score", target: "risk-modeling", label: "" },
      { id: "r7", source: "debt-ratio", target: "risk-modeling", label: "" },
      { id: "r8", source: "employment-history", target: "risk-modeling", label: "" },
      { id: "r9", source: "asset-verification", target: "risk-modeling", label: "" },
      { id: "r10", source: "risk-modeling", target: "fraud-check", label: "" },
      { id: "r11", source: "fraud-check", target: "compliance-check", label: "" },
      { id: "r12", source: "compliance-check", target: "risk-score", label: "" },
      { id: "r13", source: "risk-score", target: "low-risk", label: "" },
      { id: "r14", source: "risk-score", target: "medium-risk", label: "" },
      { id: "r15", source: "risk-score", target: "high-risk", label: "" },
      { id: "r16", source: "medium-risk", target: "manual-review", label: "" },
      { id: "r17", source: "high-risk", target: "manual-review", label: "" },
      { id: "r18", source: "low-risk", target: "risk-approved", label: "" },
      { id: "r19", source: "manual-review", target: "risk-approved", label: "" },
      { id: "r20", source: "manual-review", target: "risk-declined", label: "" }
    ]
  },
  'compliance-audit': {
    id: "compliance-audit-003",
    name: "Regulatory Compliance Audit",
    description: "Systematic compliance audit workflow for mortgage operations",
    nodes: [
      { id: "audit-init", type: "status", label: "Audit Initiated" },
      { id: "scope-define", type: "event", label: "Define Scope" },
      { id: "document-request", type: "event", label: "Document Request" },
      { id: "loan-sampling", type: "event", label: "Loan File Sampling" },
      { id: "review-process", type: "status", label: "Review Process" },
      { id: "trid-compliance", type: "event", label: "TRID Compliance Check" },
      { id: "fair-lending", type: "event", label: "Fair Lending Review" },
      { id: "qm-compliance", type: "event", label: "QM Rule Compliance" },
      { id: "findings-analysis", type: "status", label: "Findings Analysis" },
      { id: "violation-found", type: "status", label: "Violations Found" },
      { id: "compliant", type: "status", label: "Fully Compliant" },
      { id: "corrective-action", type: "event", label: "Corrective Action Plan" },
      { id: "remediation", type: "event", label: "Remediation Process" },
      { id: "follow-up", type: "event", label: "Follow-up Review" },
      { id: "audit-complete", type: "status", label: "Audit Complete" }
    ],
    edges: [
      { id: "c1", source: "audit-init", target: "scope-define", label: "" },
      { id: "c2", source: "scope-define", target: "document-request", label: "" },
      { id: "c3", source: "document-request", target: "loan-sampling", label: "" },
      { id: "c4", source: "loan-sampling", target: "review-process", label: "" },
      { id: "c5", source: "review-process", target: "trid-compliance", label: "" },
      { id: "c6", source: "review-process", target: "fair-lending", label: "" },
      { id: "c7", source: "review-process", target: "qm-compliance", label: "" },
      { id: "c8", source: "trid-compliance", target: "findings-analysis", label: "" },
      { id: "c9", source: "fair-lending", target: "findings-analysis", label: "" },
      { id: "c10", source: "qm-compliance", target: "findings-analysis", label: "" },
      { id: "c11", source: "findings-analysis", target: "violation-found", label: "" },
      { id: "c12", source: "findings-analysis", target: "compliant", label: "" },
      { id: "c13", source: "violation-found", target: "corrective-action", label: "" },
      { id: "c14", source: "corrective-action", target: "remediation", label: "" },
      { id: "c15", source: "remediation", target: "follow-up", label: "" },
      { id: "c16", source: "follow-up", target: "audit-complete", label: "" },
      { id: "c17", source: "compliant", target: "audit-complete", label: "" }
    ]
  },
  'loan-servicing': {
    id: "loan-servicing-004",
    name: "Loan Servicing Operations",
    description: "Post-closing loan servicing and portfolio management workflow",
    nodes: [
      { id: "loan-boarding", type: "status", label: "Loan Boarding" },
      { id: "setup-servicing", type: "event", label: "Setup Servicing" },
      { id: "payment-processing", type: "status", label: "Payment Processing" },
      { id: "escrow-management", type: "event", label: "Escrow Management" },
      { id: "customer-service", type: "event", label: "Customer Service" },
      { id: "delinquency-mgmt", type: "status", label: "Delinquency Management" },
      { id: "loss-mitigation", type: "event", label: "Loss Mitigation" },
      { id: "modification", type: "event", label: "Loan Modification" },
      { id: "foreclosure", type: "event", label: "Foreclosure Process" },
      { id: "investor-reporting", type: "event", label: "Investor Reporting" },
      { id: "quality-control", type: "event", label: "Quality Control" },
      { id: "loan-sale", type: "event", label: "Loan Sale" },
      { id: "payoff", type: "status", label: "Loan Payoff" },
      { id: "portfolio-active", type: "status", label: "Active Portfolio" }
    ],
    edges: [
      { id: "s1", source: "loan-boarding", target: "setup-servicing", label: "" },
      { id: "s2", source: "setup-servicing", target: "payment-processing", label: "" },
      { id: "s3", source: "payment-processing", target: "escrow-management", label: "" },
      { id: "s4", source: "payment-processing", target: "customer-service", label: "" },
      { id: "s5", source: "payment-processing", target: "portfolio-active", label: "" },
      { id: "s6", source: "portfolio-active", target: "delinquency-mgmt", label: "" },
      { id: "s7", source: "delinquency-mgmt", target: "loss-mitigation", label: "" },
      { id: "s8", source: "loss-mitigation", target: "modification", label: "" },
      { id: "s9", source: "loss-mitigation", target: "foreclosure", label: "" },
      { id: "s10", source: "portfolio-active", target: "investor-reporting", label: "" },
      { id: "s11", source: "portfolio-active", target: "quality-control", label: "" },
      { id: "s12", source: "portfolio-active", target: "loan-sale", label: "" },
      { id: "s13", source: "portfolio-active", target: "payoff", label: "" }
    ]
  }
};

export const defaultWorkflow = 'ebm-version';

// ============= ADVANCED LAYOUT UTILITIES =============
export const defaultLayoutConfig: LayoutConfig = {
  workflowWidth: 1800,
  workflowHeight: 1200,
  stageWidth: 200,
  stageHeight: 120,
  circleSize: 80,
  padding: 150,
  spacing: 350,
  isHorizontal: true,
};

// Graph analysis utilities
export const analyzeGraphStructure = (workflowData: WorkflowData) => {
  const { nodes, edges } = workflowData;
  
  // Create adjacency maps
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  
  // Initialize maps
  nodes.forEach(node => {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  });
  
  // Build adjacency lists
  edges.forEach(edge => {
    if (outgoing.has(edge.source) && incoming.has(edge.target)) {
      outgoing.get(edge.source)!.push(edge.target);
      incoming.get(edge.target)!.push(edge.source);
    }
  });
  
  // Find root nodes (no incoming edges)
  const rootNodes = nodes.filter(node => 
    incoming.get(node.id)?.length === 0
  );
  
  // Find leaf nodes (no outgoing edges)
  const leafNodes = nodes.filter(node => 
    outgoing.get(node.id)?.length === 0
  );
  
  // If no clear root, find nodes with most outgoing connections
  const startNodes = rootNodes.length > 0 ? rootNodes : 
    nodes.sort((a, b) => 
      (outgoing.get(b.id)?.length || 0) - (outgoing.get(a.id)?.length || 0)
    ).slice(0, 1);
  
  return {
    nodes,
    edges,
    outgoing,
    incoming,
    rootNodes,
    leafNodes,
    startNodes,
    nodeCount: nodes.length,
    edgeCount: edges.length
  };
};


// Advanced layout algorithm with clean edge patterns
export const calculateSmartLayout = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
) => {
  const analysis = analyzeGraphStructure(workflowData);
  const { nodes, outgoing, incoming, startNodes } = analysis;
  const { padding, stageWidth, stageHeight, isHorizontal } = config;
  
  // Calculate levels using BFS for clean hierarchy
  const levels = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number; level: number; row: number }>();
  const visited = new Set<string>();
  
  // Start BFS from identified start nodes
  const queue: Array<{ nodeId: string; level: number }> = [];
  
  startNodes.forEach(node => {
    queue.push({ nodeId: node.id, level: 0 });
    levels.set(node.id, 0);
  });
  
  // BFS to assign levels
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const children = outgoing.get(nodeId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        const newLevel = level + 1;
        if (!levels.has(childId) || levels.get(childId)! > newLevel) {
          levels.set(childId, newLevel);
          queue.push({ nodeId: childId, level: newLevel });
        }
      }
    });
  }
  
  // Handle orphaned nodes
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  // Group nodes by level and arrange in rows for clean layout
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  });
  
  const maxLevel = Math.max(...Array.from(levels.values()));
  
  // Enhanced spacing for clean appearance
  const levelSpacing = 350; // Increased space between levels
  const nodeSpacing = 150;  // Clean spacing between nodes in same level
  
  // Calculate positions with optimized layout
  if (isHorizontal) {
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const x = padding + level * levelSpacing;
      
      // Arrange nodes in clean rows
      const totalHeight = nodesInLevel.length * stageHeight + (nodesInLevel.length - 1) * nodeSpacing;
      const startY = padding + Math.max(100, (1000 - totalHeight) / 2);
      
      nodesInLevel.forEach((nodeId, index) => {
        const y = startY + index * (stageHeight + nodeSpacing);
        positions.set(nodeId, { x, y, level, row: index });
      });
    }
  } else {
    for (let level = 0; level <= maxLevel; level++) {
      const nodesInLevel = levelGroups.get(level) || [];
      const y = padding + level * levelSpacing;
      
      const totalWidth = nodesInLevel.length * stageWidth + (nodesInLevel.length - 1) * nodeSpacing;
      const startX = padding + Math.max(100, (1800 - totalWidth) / 2);
      
      nodesInLevel.forEach((nodeId, index) => {
        const x = startX + index * (stageWidth + nodeSpacing);
        positions.set(nodeId, { x, y, level, row: index });
      });
    }
  }
  
  // Calculate canvas dimensions
  let canvasWidth, canvasHeight;
  if (isHorizontal) {
    canvasWidth = Math.max((maxLevel + 1) * levelSpacing + 2 * padding + stageWidth, 1800);
    canvasHeight = 1200;
  } else {
    canvasWidth = 2000;
    canvasHeight = Math.max((maxLevel + 1) * levelSpacing + 2 * padding + stageHeight, 1200);
  }
  
  return {
    positions,
    levels,
    levelGroups,
    canvasWidth,
    canvasHeight,
    maxLevel,
    analysis
  };
};

// Clean edge routing with proper connection points and debugging
export const generateSmartEdges = (
  workflowData: WorkflowData,
  layout: ReturnType<typeof calculateSmartLayout>
): Edge[] => {
  const { positions, levels } = layout;
  console.log('Generating edges for workflow:', workflowData.edges.length, 'edges');
  
  const generatedEdges = workflowData.edges.map((edge, index) => {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    
    if (!sourcePos || !targetPos) {
      console.warn(`Edge ${edge.id} references non-existent nodes - source: ${edge.source}, target: ${edge.target}`);
      return null;
    }
    
    const sourceLevel = levels.get(edge.source) || 0;
    const targetLevel = levels.get(edge.target) || 0;
    const isBackwardFlow = targetLevel <= sourceLevel;
    
    console.log(`Edge ${edge.id}: ${edge.source} (level ${sourceLevel}) -> ${edge.target} (level ${targetLevel}), backward: ${isBackwardFlow}`);
    
    // Determine connection points and edge styling
    let sourceHandle = Position.Right;
    let targetHandle = Position.Left;
    let edgeType = 'smoothstep';
    
    // Handle backward flows (loops) - connect from bottom to bottom
    if (isBackwardFlow) {
      sourceHandle = Position.Bottom;
      targetHandle = Position.Bottom;
      edgeType = 'smoothstep';
    }
    
    // Special styling for different connection types
    const edgeStyle = {
      stroke: isBackwardFlow ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
      strokeWidth: 3,
      strokeDasharray: isBackwardFlow ? '8,8' : undefined,
    };
    
    const generatedEdge = {
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle,
      targetHandle,
      type: edgeType,
      animated: !isBackwardFlow,
      style: edgeStyle,
      markerEnd: {
        type: 'arrowclosed',
        color: isBackwardFlow ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
        width: 25,
        height: 25,
      },
    };
    
    console.log('Generated edge:', generatedEdge);
    return generatedEdge;
  }).filter(Boolean) as Edge[];
  
  console.log('Total generated edges:', generatedEdges.length);
  return generatedEdges;
};

// ============= NODE COMPONENTS =============

// WorkflowNode Data Interface (from WorkflowNode.tsx)
export interface WorkflowNodeData extends Record<string, unknown> {
  title: string;
  description?: string;
  type: 'workflow' | 'stage' | 'data' | 'process' | 'pmf-tag' | 'entities-group';
  items?: string[];
  entities?: Array<{ id: string; title: string; color?: string }>;
  onClick?: () => void;
  entitiesExpanded?: boolean;
  onToggleEntities?: () => void;
  isSelected?: boolean;
  color?: string;
}

// WorkflowNode Component (from WorkflowNode.tsx)
const WorkflowNode = ({ data }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  
  const getNodeStyles = () => {
    switch (nodeData.type) {
      case 'workflow':
        return 'bg-workflow-canvas border-2 border-dashed border-workflow-border rounded-lg min-w-[900px] min-h-[500px] p-8 relative shadow-lg';
      case 'stage':
        return 'bg-workflow-node-bg border-2 border-workflow-stage-border rounded-md p-6 min-w-[200px] min-h-[120px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md';
      case 'data':
        let bgColor = 'bg-workflow-data-bg';
        if (nodeData.color === 'yellow') {
          bgColor = 'bg-workflow-data-bg';
        }
        return `${bgColor} border border-workflow-data-border px-4 py-2 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow transform rotate-[-2deg] shadow-sm rounded`;
      case 'pmf-tag':
        return 'bg-workflow-pmf-bg text-workflow-pmf-text px-4 py-2 text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity rounded shadow-md';
      case 'process':
        return 'bg-workflow-process-bg text-workflow-process-text border-workflow-stage-border border rounded px-3 py-1 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow';
      case 'entities-group':
        return 'bg-workflow-node-bg border border-workflow-stage-border rounded-md p-6 min-w-[600px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md';
      default:
        return 'bg-workflow-node-bg border-workflow-node-border border rounded p-3 cursor-pointer hover:shadow-md transition-shadow';
    }
  };

  const getWrapperStyles = () => {
    return 'border-4 border-workflow-border rounded-lg p-4 bg-workflow-canvas shadow-xl';
  };

  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log(`Clicked ${nodeData.type} node:`, nodeData.title);
  };

  if (nodeData.type === 'pmf-tag') {
    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="font-bold">
          {nodeData.title}
        </div>
      </div>
    );
  }

  if (nodeData.type === 'data') {
    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="flex items-center gap-2">
          <span className="font-medium">{nodeData.title}</span>
          <span className="text-xs font-bold">⋮</span>
        </div>
      </div>
    );
  }

  if (nodeData.type === 'entities-group') {
    const handleIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nodeData.onToggleEntities) {
        nodeData.onToggleEntities();
      }
    };

    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <span 
            className="cursor-pointer select-none text-lg leading-none"
            onClick={handleIconClick}
          >
            {nodeData.entitiesExpanded ? '▼' : '▲'}
          </span>
          <span>Modified Data Entities</span>
        </div>
        {nodeData.entitiesExpanded && (
          <div className="flex flex-wrap gap-3">
            {nodeData.entities?.map((entity) => {
              const bgColor = entity.color === 'yellow' ? 'bg-workflow-data-bg' : 'bg-muted';
              const borderColor = entity.color === 'yellow' ? 'border-workflow-data-border' : 'border-border';
              return (
                <div
                  key={entity.id}
                  className={`${bgColor} ${borderColor} border px-3 py-2 text-sm font-medium transform rotate-[-2deg] shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <div className="flex items-center gap-1">
                    <span>{entity.title}</span>
                    <span className="text-xs font-bold">⋮</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.type === 'workflow') {
    return (
      <div className={getWrapperStyles()}>
        <div className={getNodeStyles()}>        
          <div className="text-2xl font-bold text-foreground mb-2">
            {nodeData.title}
          </div>
          
          {nodeData.description && (
            <div className="text-base text-muted-foreground mb-8">
              {nodeData.description}
            </div>
          )}

          <div className="space-y-4">
            {/* Stage and Enrich boxes will be positioned inside */}
          </div>
        </div>
      </div>
    );
  }

  const getNodeColor = () => {
    switch (nodeData.type) {
      case 'workflow':
        return 'hsl(var(--primary))';
      case 'stage':
        return 'hsl(var(--secondary))';
      case 'data':
        return nodeData.color === 'yellow' ? 'hsl(var(--warning))' : 'hsl(var(--accent))';
      case 'pmf-tag':
        return 'hsl(var(--success))';
      case 'process':
        return 'hsl(var(--info))';
      case 'entities-group':
        return 'hsl(var(--muted))';
      default:
        return 'hsl(var(--background))';
    }
  };

  return (
    <div className={getNodeStyles()} onClick={handleClick}>
      {/* Add connection handles for clean edge routing */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: getNodeColor(),
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={{
          background: getNodeColor(),
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: getNodeColor(),
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: getNodeColor(),
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      
      <div className="text-lg font-bold text-foreground text-center">
        {nodeData.title}
      </div>
    </div>
  );
};

// CircularNode Data Interface (from CircularNode.tsx)
export interface CircularNodeData extends Record<string, unknown> {
  label: string;
  onClick?: () => void;
  color?: string;
}

// CircularNode Component (from CircularNode.tsx)
const CircularNode = ({ data }: NodeProps) => {
  const nodeData = data as CircularNodeData;
  
  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log('Clicked status node:', nodeData.label);
  };

  const getCircleStyles = () => {
    return 'w-20 h-20 rounded-full bg-workflow-circular border-2 border-workflow-circular-border flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200';
  };

  return (
    <div 
      className={getCircleStyles()}
      onClick={handleClick}
    >
      {/* Connection handles for circular nodes */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'hsl(var(--primary))',
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={{
          background: 'hsl(var(--primary))',
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'hsl(var(--primary))',
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'hsl(var(--primary))',
          border: '2px solid hsl(var(--border))',
          width: 12,
          height: 12,
        }}
      />
      
      <div className="text-xs font-bold text-center text-foreground px-2 leading-tight">
        {nodeData.label}
      </div>
    </div>
  );
};

// ============= HEADER COMPONENT (from WorkflowHeader.tsx) =============
const WorkflowHeader = () => {
  return (
    <div>
      <header className="bg-workflow-node-bg border-b border-workflow-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">EBM Studio</span>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <Input 
            placeholder="Search" 
            className="w-full border-primary/50 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-primary font-medium">Data Journeys</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Lineage</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">FDE</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Editor</a>
          </nav>
        </div>
      </header>

      <div className="bg-black text-white px-6 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">PMF</span>
        <div className="text-sm">...</div>
      </div>
    </div>
  );
};

// ============= WORKFLOW SELECTOR COMPONENT =============
interface WorkflowSelectorProps {
  selectedWorkflow: string;
  onWorkflowSelect: (workflowId: string) => void;
}

const WorkflowSelector = ({ selectedWorkflow, onWorkflowSelect }: WorkflowSelectorProps) => {
  const workflows = [
    { id: 'ebm-version', name: 'EBM Version' },
    { id: 'mortgage-origination', name: 'Mortgage Origination' },
    { id: 'risk-assessment', name: 'Risk Assessment' },
    { id: 'compliance-audit', name: 'Compliance Audit' },
    { id: 'loan-servicing', name: 'Loan Servicing' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Workflow:</span>
      <select 
        value={selectedWorkflow}
        onChange={(e) => onWorkflowSelect(e.target.value)}
        className="px-3 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {workflows.map((workflow) => (
          <option key={workflow.id} value={workflow.id}>
            {workflow.name}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============= NODE CREATION UTILITIES =============
export const createAdvancedNodes = (
  workflowData: WorkflowData,
  config: LayoutConfig = defaultLayoutConfig
): Node[] => {
  console.log('Creating nodes with hierarchical layout for:', workflowData);
  
  const layout = calculateSmartLayout(workflowData, config);
  const { positions, canvasWidth, canvasHeight, analysis } = layout;
  
  const nodes: Node[] = [];

  // Create nodes based on hierarchical layout positions
  workflowData.nodes.forEach((workflowNode) => {
    const position = positions.get(workflowNode.id);
    
    if (!position) {
      console.warn(`No position found for node ${workflowNode.id}`);
      return;
    }

    // Determine node style based on type
    const nodeStyle = workflowNode.type === 'status' ? 
      { 
        width: config.circleSize, 
        height: config.circleSize,
        borderRadius: '50%'
      } : 
      { 
        width: config.stageWidth, 
        height: config.stageHeight 
      };

    nodes.push({
      id: workflowNode.id,
      type: workflowNode.type === 'status' ? 'circular' : 'workflow',
      position: { x: position.x, y: position.y },
      data: workflowNode.type === 'status' ? 
        {
          label: workflowNode.label,
        } as CircularNodeData :
        {
          title: workflowNode.label,
          type: 'stage',
        } as WorkflowNodeData,
      style: nodeStyle,
      draggable: true,
    });
  });

  console.log(`Created ${nodes.length} nodes with positions:`, nodes.map(n => ({ id: n.id, pos: n.position })));
  return nodes;
};

// ============= MAIN WORKFLOW MANAGER COMPONENT =============
interface WorkflowManagerProps {
  layoutConfig?: typeof defaultLayoutConfig;
  selectedWorkflowId?: string;
  workflowData?: WorkflowData | RawWorkflowData;
  onWorkflowSelect?: (workflowId: string) => void;
  onDataLoad?: (data: RawWorkflowData) => void;
  apiEndpoint?: string;
}

// Data loading utilities
export const loadWorkflowFromAPI = async (endpoint: string): Promise<WorkflowData> => {
  try {
    console.log('Loading workflow from API:', endpoint);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const rawData = await response.json();
    console.log('Raw API response:', rawData);
    
    const transformedData = transformWorkflowData(rawData);
    const validatedData = validateWorkflowData(transformedData);
    
    console.log('Final processed workflow data:', validatedData);
    return validatedData;
    
  } catch (error) {
    console.error('Error loading workflow from API:', error);
    
    // Return a default workflow if API fails
    return validateWorkflowData({
      id: 'api-error-fallback',
      name: 'API Error - Fallback Workflow',
      description: 'Failed to load workflow from API, showing fallback',
      nodes: [
        { id: 'error-start', type: 'status', label: 'Error' },
        { id: 'error-retry', type: 'event', label: 'Retry' }
      ],
      edges: [
        { id: 'error-edge', source: 'error-start', target: 'error-retry', label: 'Retry Loading' }
      ]
    });
  }
};

export const processWorkflowData = (inputData: WorkflowData | RawWorkflowData): WorkflowData => {
  // Check if data is already in the correct format
  if (inputData && 
      typeof inputData === 'object' && 
      'nodes' in inputData && 
      'edges' in inputData &&
      Array.isArray(inputData.nodes) &&
      Array.isArray(inputData.edges)) {
    console.log('Data appears to be in correct format, validating...');
    return validateWorkflowData(inputData as WorkflowData);
  }
  
  // Transform and validate the data
  console.log('Data needs transformation, processing...');
  const transformedData = transformWorkflowData(inputData as RawWorkflowData);
  return validateWorkflowData(transformedData);
};

const nodeTypes = {
  workflow: memo(WorkflowNode),
  circular: memo(CircularNode),
  stage: memo(WorkflowNode),
  data: memo(WorkflowNode),
  'pmf-tag': memo(WorkflowNode),
  'entities-group': memo(WorkflowNode),
};

const WorkflowManager = ({ 
  layoutConfig = defaultLayoutConfig,
  selectedWorkflowId: externalWorkflowId,
  workflowData: externalWorkflowData,
  onWorkflowSelect: externalOnWorkflowSelect,
  apiEndpoint,
  onDataLoad
}: WorkflowManagerProps = {}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(externalWorkflowId || defaultWorkflow);
  const [isHorizontal, setIsHorizontal] = useState(true);
  
  // Dynamic layout config based on orientation
  const currentLayoutConfig = useMemo(() => ({
    ...layoutConfig,
    isHorizontal
  }), [layoutConfig, isHorizontal]);
  
  // Memoize the processed workflow data to prevent infinite re-renders
  const currentWorkflowData = useMemo(() => {
    const rawData = externalWorkflowData || 
                    mockWorkflows[selectedWorkflowId] || 
                    mockWorkflows[defaultWorkflow];
    
    console.log('Processing workflow data once:', rawData);
    return processWorkflowData(rawData);
  }, [externalWorkflowData, selectedWorkflowId]);
  
  // Memoize initial nodes and edges using smart layout
  const initialNodes = useMemo(() => {
    return createAdvancedNodes(currentWorkflowData, currentLayoutConfig);
  }, [currentWorkflowData, currentLayoutConfig]);
  
  const initialEdges = useMemo(() => {
    console.log('Creating initial edges for workflow:', currentWorkflowData.name);
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    const edges = generateSmartEdges(currentWorkflowData, layout);
    console.log('Initial edges created:', edges.length);
    return edges;
  }, [currentWorkflowData, currentLayoutConfig]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle workflow selection
  const handleWorkflowSelect = (workflowId: string) => {
    if (externalOnWorkflowSelect) {
      externalOnWorkflowSelect(workflowId);
    } else {
      if (mockWorkflows[workflowId]) {
        setSelectedWorkflowId(workflowId);
      }
    }
  };

  // Update nodes when workflow data or layout changes
  useEffect(() => {
    const updatedNodes = createAdvancedNodes(currentWorkflowData, currentLayoutConfig);
    setNodes(updatedNodes);
  }, [currentWorkflowData, currentLayoutConfig, setNodes]);

  // Update edges when workflow data or layout changes
  useEffect(() => {
    console.log('Updating edges due to workflow or layout change');
    const layout = calculateSmartLayout(currentWorkflowData, currentLayoutConfig);
    const updatedEdges = generateSmartEdges(currentWorkflowData, layout);
    console.log('Setting updated edges:', updatedEdges.length);
    setEdges(updatedEdges);
  }, [currentWorkflowData, currentLayoutConfig, setEdges]);

  // Toggle layout orientation
  const toggleLayout = () => {
    setIsHorizontal(!isHorizontal);
  };

  // Load data from API endpoint if provided
  useEffect(() => {
    if (apiEndpoint && !externalWorkflowData) {
      const loadData = async () => {
        try {
          const data = await loadWorkflowFromAPI(apiEndpoint);
          if (onDataLoad) {
            onDataLoad(data);
          }
          console.log('Loaded workflow from API:', data);
        } catch (error) {
          console.error('Failed to load workflow from API:', error);
        }
      };
      
      loadData();
    }
  }, [apiEndpoint, externalWorkflowData, onDataLoad]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background to-muted/30">
      <WorkflowHeader />
      
      {/* Layout Controls */}
      <div className="px-8 py-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">
              {currentWorkflowData.name}
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentWorkflowData.description}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <WorkflowSelector 
              selectedWorkflow={selectedWorkflowId}
              onWorkflowSelect={handleWorkflowSelect}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLayout}
              className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            >
              <Layout className="h-4 w-4" />
              {isHorizontal ? 'Switch to Vertical' : 'Switch to Horizontal'}
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span>{isHorizontal ? 'Horizontal Layout' : 'Vertical Layout'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas - Full Width */}
      <div className="h-[calc(100vh-200px)] w-full p-8">
        <div className="h-full w-full relative overflow-hidden rounded-xl border border-border/50 shadow-2xl bg-gradient-to-br from-card to-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="w-full h-full"
            defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            minZoom={0.1}
            maxZoom={2}
          >
            <Background 
              color="hsl(var(--muted-foreground))" 
              gap={24}
              size={1}
            />
            <Controls 
              className="bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg rounded-lg"
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;

// ============= USAGE EXAMPLES =============
/*
// Example 1: Using with API endpoint
<WorkflowManager 
  apiEndpoint="/api/workflows/123"
  onDataLoad={(data) => console.log('Loaded:', data)}
/>

// Example 2: Using with external data (backend format like your images)
const backendData = {
  id: "4bde0616-c450-42b2-9fab-8af9bcc66dfa",
  name: "App Version",
  description: "workflow definition for onboarding a version of an application into EBM",
  edges: [
    {id: "e1", source: "s1", target: "ev1", label: "Initial load"},
    {id: "e2", source: "ev1", target: "s2", label: "Loaded"},
    // ... more edges as shown in your images
  ],
  nodes: [
    {id: "s1", type: "status", label: "Start"},
    {id: "s2", type: "status", label: "Loaded"},
    {id: "ev1", type: "event", label: "Load"},
    // ... more nodes
  ]
};

<WorkflowManager workflowData={backendData} />

// Example 3: Using with alternative data format
const alternativeFormat = {
  workflow: {
    workflow_id: "xyz-123",
    title: "My Workflow",
    summary: "A test workflow",
    states: [
      {node_id: "start", nodeType: "status", name: "Beginning"},
      {node_id: "process", nodeType: "event", name: "Processing"}
    ],
    transitions: [
      {edge_id: "t1", from: "start", to: "process", text: "Begin Process"}
    ]
  }
};

<WorkflowManager workflowData={alternativeFormat} />

// Example 4: Handle data transformation manually
const handleDataLoad = (rawData) => {
  const processedData = processWorkflowData(rawData);
  console.log('Processed workflow:', processedData);
};

<WorkflowManager 
  onDataLoad={handleDataLoad}
  apiEndpoint="/api/workflows/current"
/>
*/