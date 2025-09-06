import React, { useCallback, useState, useEffect, memo, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles/workflow.scss';

// Import utilities and components
import { nodeTypes } from './components/WorkflowNodes';
import { transformWorkflowData, validateWorkflowData } from './utils/dataTransform';
import { calculateSmartLayout, defaultLayoutConfig } from './utils/layoutAlgorithms';
import { mockWorkflows, defaultWorkflow } from './data/mockData';
import { WorkflowData, RawWorkflowData, LayoutConfig, WorkflowManagerProps } from './types';

/**
 * ============= WORKFLOW MANAGER PROPS =============
 */

/**
 * ============= MAIN WORKFLOW MANAGER COMPONENT =============
 */

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  workflowData,
  selectedWorkflow = defaultWorkflow,
  layoutConfig = {},
  onNodeClick,
  onEdgeClick,
  onLayoutChange,
  className = '',
  style = {},
  showControls = true,
  showBackground = true,
  isInteractive = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Merge layout configuration with defaults
  const finalLayoutConfig = useMemo(() => ({
    ...defaultLayoutConfig,
    ...layoutConfig,
  }), [layoutConfig]);

  // Process and validate workflow data
  const processedWorkflowData = useMemo(() => {
    try {
      setHasError(false);
      setLoading(true);

      let data: WorkflowData;

      if (workflowData) {
        console.log('🔄 Processing provided workflow data:', workflowData);
        
        // Check if the data is already in the correct format
        const hasRequiredFields = 'id' in workflowData && 'nodes' in workflowData && 'edges' in workflowData;
        
        if (hasRequiredFields) {
          data = workflowData as WorkflowData;
        } else {
          data = transformWorkflowData(workflowData as RawWorkflowData);
        }
      } else {
        console.log('📋 Using mock workflow:', selectedWorkflow);
        data = mockWorkflows[selectedWorkflow] || mockWorkflows[defaultWorkflow];
      }

      const validatedData = validateWorkflowData(data);
      console.log('✅ Final processed workflow data:', validatedData);
      
      setLoading(false);
      return validatedData;
    } catch (error) {
      console.error('❌ Error processing workflow data:', error);
      setHasError(true);
      setLoading(false);
      
      // Return a minimal fallback workflow
      return {
        id: 'error-workflow',
        name: 'Error Workflow',
        description: 'Fallback workflow due to processing error',
        nodes: [
          { id: 'error-node', type: 'status' as const, label: 'Error' }
        ],
        edges: []
      };
    }
  }, [workflowData, selectedWorkflow]);

  // Generate positioned nodes from workflow data
  const initialNodes = useMemo(() => {
    if (!processedWorkflowData || hasError) return [];
    
    try {
      return calculateSmartLayout(processedWorkflowData, finalLayoutConfig);
    } catch (error) {
      console.error('❌ Error calculating layout:', error);
      setHasError(true);
      return [];
    }
  }, [processedWorkflowData, finalLayoutConfig, hasError]);

  // Generate edges from workflow data
  const initialEdges = useMemo(() => {
    if (!processedWorkflowData || hasError) return [];
    
    return processedWorkflowData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep' as const,
      animated: true,
      style: {
        stroke: '#6b7280',
        strokeWidth: 2,
      },
      labelStyle: {
        fontSize: '12px',
        fontWeight: 600,
      },
    }));
  }, [processedWorkflowData, hasError]);

  // React Flow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when workflow data changes
  useEffect(() => {
    if (!hasError) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, hasError, setNodes, setEdges]);

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => [
        ...eds,
        {
          id: `edge-${params.source}-${params.target}`,
          source: params.source!,
          target: params.target!,
          type: 'smoothstep' as const,
          animated: true,
          label: '',
          style: {
            stroke: '#6b7280',
            strokeWidth: 2,
          },
          labelStyle: {
            fontSize: '12px',
            fontWeight: 600,
          },
        },
      ]);
    },
    [setEdges]
  );

  // Handle node click events
  const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.data);
    }
  }, [onNodeClick]);

  // Handle edge click events  
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    if (onEdgeClick) {
      onEdgeClick(edge.id, edge);
    }
  }, [onEdgeClick]);

  // Notify parent of layout changes
  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(nodes, edges);
    }
  }, [nodes, edges, onLayoutChange]);

  // Error state rendering
  if (hasError) {
    return (
      <div className={`workflow-error ${className}`} style={style}>
        <div>
          <h3>Unable to Load Workflow</h3>
          <p>There was an error processing the workflow data. Please check the data format and try again.</p>
        </div>
      </div>
    );
  }

  // Loading state rendering
  if (loading) {
    return (
      <div className={`workflow-loading ${className}`} style={style}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Empty state rendering
  if (!processedWorkflowData || !processedWorkflowData.nodes || processedWorkflowData.nodes.length === 0) {
    return (
      <div className={`workflow-empty ${className}`} style={style}>
        <div>
          <h3>No Workflow Data</h3>
          <p>No workflow nodes found. Please provide valid workflow data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`workflow-container ${className}`} style={style}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={isInteractive ? onConnect : undefined}
        onNodeClick={isInteractive ? handleNodeClick : undefined}
        onEdgeClick={isInteractive ? handleEdgeClick : undefined}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        nodesDraggable={isInteractive}
        nodesConnectable={isInteractive}
        elementsSelectable={isInteractive}
      >
        {showBackground && <Background />}
        {showControls && <Controls />}
      </ReactFlow>
    </div>
  );
};

export default memo(WorkflowManager);

// Export all types and utilities for external use
export * from './types';
export * from './utils/dataTransform';
export * from './utils/layoutAlgorithms';
export * from './data/mockData';
export { nodeTypes } from './components/WorkflowNodes';