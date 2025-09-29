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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowDataHttp } from '../hooks/singleView/useWorkflowDataHttp';
import { StatusNode } from '../nodes/StatusNode';
import { EventNode } from '../nodes/EventNode';
import { AnimatedEdge } from '../edges/AnimatedEdge';
import { calculateFocusMode, calculateEdgeFocusMode, applyFocusModeStyling, hasMultipleConnections, type FocusModeResult } from '../utils/focusMode';
import { transformWorkflowData, validateWorkflowData, mockWorkflows, defaultWorkflow } from '../utils/singleView/workflowDataUtils';
import { calculateSmartLayout, defaultLayoutConfig } from '../utils/singleView/layout-utils';

export interface SingleViewWorkflowBuilderProps {
  workflowId: string;
}

export const SingleViewWorkflowBuilder = ({ workflowId }: SingleViewWorkflowBuilderProps) => {
  const fallbackWorkflowId = workflowId || defaultWorkflow;
  
  const {
    data: workflowData,
    error,
    isError,
    isLoading,
    isFetching
  } = useWorkflowDataHttp(fallbackWorkflowId);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hideWhileSelection, setHideWhileSelection] = useState(true);
  
  // State for focus mode
  const [focusMode, setFocusMode] = useState<FocusModeResult | null>(null);
  const [focusModeTimeout, setFocusModeTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Current workflow data (either external or mock)
  const currentWorkflowData = useMemo(() => {
    if (workflowData) {
      return validateWorkflowData(transformWorkflowData(workflowData));
    }
    return validateWorkflowData(mockWorkflows[fallbackWorkflowId] || mockWorkflows[defaultWorkflow]);
  }, [workflowData, fallbackWorkflowId]);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Node types for React Flow
  const nodeTypes = useMemo(() => ({
    status: StatusNode,
    event: EventNode,
  }), []);
  
  // Edge types for React Flow  
  const edgeTypes = useMemo(() => ({
    animated: AnimatedEdge,
  }), []);
  
  // Convert workflow data to React Flow format
  const convertToReactFlowFormat = useCallback((workflowData: any) => {
    const layout = calculateSmartLayout(workflowData, defaultLayoutConfig);
    
    const flowNodes: Node[] = workflowData.nodes.map((node: any) => {
      const position = layout.positions.get(node.id) || { x: 0, y: 0 };
      
      return {
        id: node.id,
        type: node.type,
        position,
        data: { label: node.label },
        style: {
          background: 'transparent',
          border: 'none',
        },
      };
    });
    
    const flowEdges: Edge[] = workflowData.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'animated',
      animated: true,
      label: edge.label || '',
      style: {
        stroke: '#94a3b8',
        strokeWidth: 2,
      },
      markerEnd: {
        type: 'arrowclosed',
        width: 20,
        height: 20,
        color: '#94a3b8',
      },
    }));
    
    return { nodes: flowNodes, edges: flowEdges };
  }, []);
  
  // Initialize workflow data
  useEffect(() => {
    if (currentWorkflowData && !isInitialized) {
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlowFormat(currentWorkflowData);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setIsInitialized(true);
    }
  }, [currentWorkflowData, convertToReactFlowFormat, setNodes, setEdges, isInitialized]);
  
  // Apply focus mode styling to nodes and edges
  const { processedNodes, processedEdges } = useMemo(() => {
    const { styledNodes, styledEdges } = applyFocusModeStyling(nodes, edges, focusMode);
    return {
      processedNodes: styledNodes,
      processedEdges: styledEdges
    };
  }, [nodes, edges, focusMode]);
  
  // Handle node selection and focus mode
  useEffect(() => {
    // Clear any existing timeout
    if (focusModeTimeout) {
      clearTimeout(focusModeTimeout);
      setFocusModeTimeout(null);
    }
    
    // If a node is selected and has multiple connections, trigger focus mode (only if enabled)
    if (selectedNodeId && hideWhileSelection && hasMultipleConnections(selectedNodeId, processedEdges)) {
      const focusResult = calculateFocusMode(selectedNodeId, processedNodes, processedEdges);
      setFocusMode(focusResult);
      
      // Auto-clear focus mode after 4 seconds
      const timeout = setTimeout(() => {
        setFocusMode(null);
        setFocusModeTimeout(null);
      }, 4000);
      setFocusModeTimeout(timeout);
    } else {
      setFocusMode(null);
    }
  }, [selectedNodeId, processedEdges, processedNodes, focusModeTimeout, hideWhileSelection]);
  
  // Handle edge selection and focus mode
  useEffect(() => {
    // Clear any existing timeout
    if (focusModeTimeout) {
      clearTimeout(focusModeTimeout);
      setFocusModeTimeout(null);
    }
    
    // If an edge is selected, trigger focus mode (only if enabled)
    if (selectedEdgeId && hideWhileSelection) {
      const focusResult = calculateEdgeFocusMode(selectedEdgeId, processedNodes, processedEdges);
      setFocusMode(focusResult);
      
      // Auto-clear focus mode after 4 seconds
      const timeout = setTimeout(() => {
        setFocusMode(null);
        setFocusModeTimeout(null);
      }, 4000);
      setFocusModeTimeout(timeout);
    } else {
      setFocusMode(null);
    }
  }, [selectedEdgeId, processedNodes, processedEdges, focusModeTimeout, hideWhileSelection]);
  
  // Handle node clicks
  const onNodeClick = useCallback((_: unknown, node: Node) => {
    const newSelectedNodeId = selectedNodeId === node.id ? undefined : node.id;
    setSelectedNodeId(newSelectedNodeId);
    setSelectedEdgeId(undefined);
  }, [selectedNodeId]);
  
  // Handle edge clicks
  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    const newSelectedEdgeId = selectedEdgeId === edge.id ? undefined : edge.id;
    setSelectedEdgeId(newSelectedEdgeId);
    setSelectedNodeId(undefined);
  }, [selectedEdgeId]);
  
  // Handle new connections
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);
  
  if (!currentWorkflowData || !isInitialized) {
    return (
      <div className="relative w-full h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading workflow visualization...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Hide While Selection Toggle */}
      <div className="p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setHideWhileSelection(!hideWhileSelection)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            hideWhileSelection 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          } hover:opacity-80`}
        >
          {hideWhileSelection ? '👁️ Hide While Selection' : '👁️‍🗨️ Show All'}
        </button>
      </div>

      {/* Main Workflow Canvas */}
      <div className="flex-1 p-4">
        <div className="relative w-full h-full border-2 border-gray-300 bg-white rounded-lg shadow-sm">
          <ReactFlow
            nodes={processedNodes}
            edges={processedEdges}
            onNodeClick={onNodeClick}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={onEdgeClick}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineStyle={{
              stroke: '#94a3b8',
              strokeWidth: 2,
            }}
            defaultEdgeOptions={{
              style: {
                stroke: '#94a3b8',
                strokeWidth: 2,
              },
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#94a3b8',
              },
            }}
            fitView
            fitViewOptions={{
              padding: 0.2,
              maxZoom: 1.5,
              minZoom: 0.1,
            }}
            minZoom={0.1}
            maxZoom={2}
            attributionPosition="top-right"
          >
            {/* Background Pattern */}
            <Background
              color="#e2e8f0"
              gap={20}
              size={1}
            />
            
            {/* React Flow Controls */}
            <Controls
              position="bottom-right"
              className="bg-white border border-gray-300 rounded-lg shadow-lg"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

SingleViewWorkflowBuilder.displayName = 'SingleViewWorkflowBuilder';