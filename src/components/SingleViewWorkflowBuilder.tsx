/* eslint-disable react/display-name */
import { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowGraphHttp } from '../hooks/singleView/useWorkflowGraphHttp';
import StatusNode from '../nodes/StatusNode';
import EventNode from '../nodes/EventNode';
import {
  computeNodeLayout,
  defaultLayoutConfig,
  createFlowNodes,
  createFlowEdges,
} from '../utils/singleView/layout-utils';
import {
  convertRawWorkflow,
  sanitizeWorkflowData,
} from '../utils/singleView/workflowDataUtils';
import { WorkflowData } from '../models/singleView/nodeTypes';

const nodeTypes = {
  status: StatusNode,
  event: EventNode,
};

interface SingleViewWorkflowBuilderProps {
  workflowId: string;
}

export const SingleViewWorkflowBuilder = ({ workflowId }: SingleViewWorkflowBuilderProps) => {
  const fallbackWorkflowId = workflowId || 'f564cd67-2502-46a1-8494-4f61df616811';
  const { data: workflowData } = useWorkflowGraphHttp(fallbackWorkflowId);

  const [isHorizontal, setIsHorizontal] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentWorkflowData: WorkflowData | null = useMemo(() => {
    if (!workflowData) return null;
    const transformed = convertRawWorkflow(workflowData);
    return sanitizeWorkflowData(transformed);
  }, [workflowData]);

  const { processedNodes, processedEdges } = useMemo(() => {
    if (!currentWorkflowData) return { processedNodes: [], processedEdges: [] };

    return computeNodeLayout(currentWorkflowData, {
      ...defaultLayoutConfig,
      isHorizontal,
    });
  }, [currentWorkflowData, isHorizontal]);

  useEffect(() => {
    if (processedNodes.length > 0) {
      setNodes(processedNodes);
      setIsInitialized(true);
    }
    if (processedEdges.length > 0) {
      setEdges(processedEdges);
    }
  }, [processedNodes, processedEdges]);

  if (!currentWorkflowData || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading workflow visualization...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50">
      <div className="p-1">
        <div className="relative w-full h-[calc(100vh-100px)] border-2 border-gray-300 bg-white rounded-lg shadow-sm">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionLineStyle={{ stroke: '#A3A3A3', strokeWidth: 2 }}
            defaultEdgeOptions={{
              style: { stroke: '#A3A3A3', strokeWidth: 2 },
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#A3A3A3',
              },
            }}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.5, minZoom: 0.1 }}
            minZoom={0.1}
            maxZoom={2}
            attributionPosition="top-right"
          >
            <Background color="#A3A3A3" gap={20} size={1.5} />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};