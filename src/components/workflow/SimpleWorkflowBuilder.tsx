import { memo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SimpleWorkflow, SimpleWorkflowNode } from './mock-data';

// Node component for status nodes
const StatusNode = memo(({ data }: { data: { label: string; type: string } }) => {
  const isEvent = data.type === 'event';
  
  return (
    <div 
      className={`
        px-4 py-2 rounded-lg border-2 text-sm font-medium
        ${isEvent 
          ? 'bg-primary text-primary-foreground border-primary' 
          : 'bg-card text-card-foreground border-border'
        }
        shadow-sm min-w-[100px] text-center
      `}
    >
      {data.label}
    </div>
  );
});

StatusNode.displayName = 'StatusNode';

const nodeTypes = {
  status: StatusNode,
  event: StatusNode,
};

interface SimpleWorkflowBuilderProps {
  workflow: SimpleWorkflow;
  className?: string;
}

export const SimpleWorkflowBuilder = memo(({ workflow, className }: SimpleWorkflowBuilderProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Convert simple workflow data to React Flow format
  useEffect(() => {
    if (!workflow) return;

    // Create nodes with automatic positioning
    const flowNodes: Node[] = workflow.nodes.map((node: SimpleWorkflowNode, index: number) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      return {
        id: node.id,
        type: node.type,
        position: { 
          x: col * 200 + 100, 
          y: row * 150 + 100 
        },
        data: { 
          label: node.label, 
          type: node.type 
        },
        draggable: false, // Make nodes non-draggable
        connectable: true,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    // Create edges
    const flowEdges: Edge[] = workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: 'hsl(var(--primary))',
        strokeWidth: 2,
      },
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: 'hsl(var(--foreground))',
      },
      labelBgStyle: {
        fill: 'hsl(var(--background))',
        fillOpacity: 0.8,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [workflow, setNodes, setEdges]);

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ 
          padding: 0.2,
          includeHiddenNodes: false 
        }}
        style={{ 
          backgroundColor: 'hsl(var(--background))',
        }}
        nodesDraggable={false} // Disable node dragging globally
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background 
          color="hsl(var(--border))" 
          gap={20} 
          size={1}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
});

SimpleWorkflowBuilder.displayName = 'SimpleWorkflowBuilder';