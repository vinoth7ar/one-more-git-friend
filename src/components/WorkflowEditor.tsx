import { useState, useCallback, useMemo } from 'react';
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
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StatusNode } from '../nodes/StatusNode';
import { EventNode } from '../nodes/EventNode';
import { AnimatedEdge } from '../edges/AnimatedEdge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface WorkflowEditorProps {
  workflowId?: string;
}

interface ComponentPaletteItem {
  id: string;
  type: 'status' | 'event';
  label: string;
  icon: string;
  description: string;
}

const componentPalette: ComponentPaletteItem[] = [
  {
    id: 'transition-block',
    type: 'event',
    label: 'Transition Block',
    icon: '📦',
    description: 'Includes business events'
  },
  {
    id: 'state',
    type: 'status', 
    label: 'State',
    icon: '⭕',
    description: 'Status node'
  }
];

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'status',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
  {
    id: '2', 
    type: 'event',
    position: { x: 300, y: 100 },
    data: { label: 'Stage' },
  },
  {
    id: '3',
    type: 'status',
    position: { x: 500, y: 100 },
    data: { label: 'staged' },
  },
  {
    id: '4',
    type: 'event',
    position: { x: 300, y: 250 },
    data: { label: 'Enrich' },
  },
  {
    id: '5',
    type: 'status', 
    position: { x: 500, y: 250 },
    data: { label: 'enriched' },
  }
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'animated',
  },
  {
    id: 'e2-3',
    source: '2', 
    target: '3',
    type: 'animated',
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'animated',
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5', 
    type: 'animated',
  }
];

export const WorkflowEditor = ({ workflowId }: WorkflowEditorProps) => {
  // Workflow metadata
  const [workflowName, setWorkflowName] = useState('Hypo Loan Position');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [autoPositioning, setAutoPositioning] = useState(true);
  
  // Selected node for editing
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingNodeName, setEditingNodeName] = useState('');
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Node types for React Flow
  const nodeTypes = useMemo(() => ({
    status: StatusNode,
    event: EventNode,
  }), []);

  // Edge types for React Flow  
  const edgeTypes = useMemo(() => ({
    animated: AnimatedEdge,
  }), []);

  // Handle node clicks for editing
  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNode(node);
    const nodeData = node.data as { label?: string };
    setEditingNodeName(nodeData.label || '');
  }, []);

  // Handle new connections
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'animated' }, eds));
  }, [setEdges]);

  // Handle drag and drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    
    if (typeof type === 'undefined' || !type) {
      return;
    }

    const position = {
      x: event.clientX - 250, // Adjust for sidebar width
      y: event.clientY - 100,
    };

    const newNode: Node = {
      id: `${Date.now()}`, // Use timestamp for unique ID
      type: type,
      position,
      data: { label: `New ${type === 'status' ? 'State' : 'Block'}` },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  // Handle drag start from palette
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Save edited node
  const saveNodeEdit = () => {
    if (selectedNode && editingNodeName.trim()) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, label: editingNodeName.trim() } }
            : node
        )
      );
      setSelectedNode(null);
      setEditingNodeName('');
    }
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
      setEditingNodeName('');
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Application</h1>
        </div>

        {/* Workflow Details */}
        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="workflow-name" className="text-sm font-medium text-gray-700">
              Workflow Name
            </Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="workflow-description" className="text-sm font-medium text-gray-700">
              Workflow Description
            </Label>
            <div className="relative mt-1">
              <Textarea
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Enter workflow description"
                className="pr-12"
                rows={4}
                maxLength={240}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {workflowDescription.length}/240
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Component Palette */}
        <div className="p-4 flex-1">
          <p className="text-sm text-gray-600 mb-4">
            Drag components below onto the canvas and connect them together to build your workflow.
          </p>

          <div className="space-y-3">
            {componentPalette.map((component) => (
              <div
                key={component.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                draggable
                onDragStart={(event) => onDragStart(event, component.type)}
              >
                <div className="w-6 h-4 bg-gray-300 rounded flex items-center justify-center text-xs">
                  {component.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{component.label}</div>
                  <div className="text-xs text-gray-500">{component.description}</div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Auto-positioning toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Auto-positioning</span>
            <button
              onClick={() => setAutoPositioning(!autoPositioning)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoPositioning ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoPositioning ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Save Draft
            </Button>
            <Button className="flex-1">
              Publish Draft
            </Button>
          </div>
          <Button variant="destructive" className="w-full">
            🗑️ Delete Workflow
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
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
            className="bg-gray-100"
          >
            <Background color="#e5e7eb" gap={20} size={1} />
            <Controls position="bottom-left" />
          </ReactFlow>
        </ReactFlowProvider>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2">
            ↗️ Legend
          </div>
          <div className="bg-white rounded p-2 text-xs">
            <div className="font-medium mb-1">Application</div>
            <div className="space-y-1 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 bg-gray-100 border rounded text-xs flex items-center justify-center">WF</div>
                <span>Workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 bg-gray-100 border rounded text-xs flex items-center justify-center">BE</div>
                <span>Business Event</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border rounded-full"></div>
                <span>State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-gray-100 border rounded text-xs flex items-center justify-center">DE</div>
                <span>Data Entity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Node Editor */}
      {selectedNode && (
        <div className="w-72 bg-gray-900 text-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-white">
                ↑ ↓
              </button>
              <button className="text-gray-400 hover:text-white">
                ⋮⋮⋮
              </button>
            </div>
            <button 
              onClick={deleteSelectedNode}
              className="text-gray-400 hover:text-red-400"
            >
              🗑️
            </button>
          </div>

          {/* Editor Content */}
          <div className="p-4 flex-1">
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-name" className="text-sm font-medium text-gray-300">
                  {selectedNode.type === 'status' ? 'State' : 'Transition Block'}
                </Label>
                <Input
                  id="node-name"
                  value={editingNodeName}
                  onChange={(e) => setEditingNodeName(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-600 text-white"
                  placeholder={`Enter ${selectedNode.type === 'status' ? 'state' : 'block'} name`}
                />
              </div>

              <Button 
                onClick={saveNodeEdit}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Save {selectedNode.type === 'status' ? 'State' : 'Block'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

WorkflowEditor.displayName = 'WorkflowEditor';