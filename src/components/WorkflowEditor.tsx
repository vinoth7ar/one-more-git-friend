import React, { useState, useCallback, useMemo } from 'react';
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
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  KeyboardArrowLeft,
  Delete,
  Close,
  ExpandLess,
  ExpandMore,
  AspectRatio
} from '@mui/icons-material';

import { StatusNode } from '../nodes/StatusNode';
import { EventNode } from '../nodes/EventNode';
import { AnimatedEdge } from '../edges/AnimatedEdge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { calculateSmartLayout } from '../utils/singleView/layout-utils';
import { WorkflowData } from '../models/singleView/nodeTypes';

interface WorkflowEditorProps {
  workflowId?: string;
}

interface ComponentPaletteItem {
  id: string;
  type: 'status' | 'event';
  label: string;
  description: string;
}

interface NodeEditingState {
  name: string;
  businessEventName?: string;
  focalEntity?: string;
  showSecondPage?: boolean;
  description?: string;
  createdEntities?: string[];
  modifiedEntities?: string[];
  businessEvents?: string[];
  condition?: string;
  triggerAutomatic?: boolean;
  triggerExternal?: boolean;
}

const componentPalette: ComponentPaletteItem[] = [
  {
    id: 'transition-block',
    type: 'event',
    label: 'Transition Block',
    description: 'Includes business events'
  },
  {
    id: 'state',
    type: 'status', 
    label: 'State',
    description: ''
  }
];

const focalEntityOptions = [
  'Loan Commitment',
  'Application',
  'Customer',
  'Account'
];

const createdEntityOptions = [
  'Loan Commitment',
  'Application Data',
  'Credit Report',
  'Assessment'
];

const modifiedEntityOptions = [
  'Loan Commitment',
  'Application Status',
  'Customer Profile',
  'Account Details'
];

const conditionOptions = [
  'None',
  'Approved',
  'Rejected',
  'Pending Review'
];

const businessEventOptions = [
  'Stage',
  'Approve',
  'Reject',
  'Submit',
  'Review'
];

export const WorkflowEditor = ({ workflowId }: WorkflowEditorProps) => {
  // Workflow metadata
  const [workflowName, setWorkflowName] = useState('Hypo Loan Position');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [autoPositioning, setAutoPositioning] = useState(true);
  
  // Selected node for editing
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingState, setEditingState] = useState<NodeEditingState>({
    name: '',
    businessEventName: '',
    focalEntity: focalEntityOptions[0],
    description: '',
    createdEntities: [],
    modifiedEntities: [],
    businessEvents: [],
    condition: 'None',
    triggerAutomatic: true,
    triggerExternal: false,
    showSecondPage: false
  });
  
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

  // Smart layout positioning
  const handleSmartLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const workflowData: WorkflowData = {
      id: 'current-workflow',
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type as 'status' | 'event',
        label: node.data?.label || 'Untitled'
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: ''
      }))
    };

    const layout = calculateSmartLayout(workflowData);
    
    const updatedNodes = nodes.map(node => {
      const position = layout.positions.get(node.id);
      if (position) {
        return {
          ...node,
          position: { x: position.x, y: position.y }
        };
      }
      return node;
    });

    setNodes(updatedNodes);
  }, [nodes, edges, workflowName, workflowDescription, setNodes]);

  // Handle node clicks for editing
  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNode(node);
    const nodeData = node.data as { label?: string };
    
    if (node.type === 'status') {
      setEditingState({
        name: nodeData.label || '',
      });
    } else if (node.type === 'event') {
      setEditingState({
        name: nodeData.label || '',
        businessEventName: nodeData.label || '',
        focalEntity: focalEntityOptions[0],
        description: 'FLUME stages commitment data in PMF database.',
        createdEntities: ['Loan Commitment'],
        modifiedEntities: [],
        businessEvents: [nodeData.label || ''],
        condition: 'None',
        triggerAutomatic: true,
        triggerExternal: false,
        showSecondPage: false
      });
    }
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

    const reactFlowBounds = (event.currentTarget as Element).getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left - 320,
      y: event.clientY - reactFlowBounds.top - 100,
    };

    const newNode: Node = {
      id: `${Date.now()}`,
      type: type,
      position,
      data: { 
        label: type === 'status' ? 'New State' : 'New Block' 
      },
    };

    setNodes((nds) => nds.concat(newNode));
    
    // Auto-select the new node for immediate editing
    setSelectedNode(newNode);
    if (type === 'status') {
      setEditingState({
        name: 'New State',
        showSecondPage: false
      });
    } else {
      setEditingState({
        name: 'New Block',
        businessEventName: 'New Block',
        focalEntity: focalEntityOptions[0],
        description: '',
        createdEntities: [],
        modifiedEntities: [],
        businessEvents: ['New Block'],
        condition: 'None',
        triggerAutomatic: true,
        triggerExternal: false
      });
    }
  }, [setNodes]);

  // Handle drag start from palette
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Save edited node
  const saveNodeEdit = () => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  label: editingState.businessEventName || editingState.name || 'Unnamed'
                } 
              }
            : node
        )
      );
      setSelectedNode(null);
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
    }
  };

  // Add alternate node functionality
  const addAlternateNode = useCallback((sourceNodeId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;
    
    // Position alternate node below the source node
    const alternatePosition = {
      x: sourceNode.position.x,
      y: sourceNode.position.y + 150
    };
    
    // Determine alternate type (opposite of source)
    const alternateType = sourceNode.type === 'status' ? 'event' : 'status';
    
    const newNode: Node = {
      id: `${alternateType}-${Date.now()}`,
      type: alternateType,
      position: alternatePosition,
      data: { 
        label: alternateType === 'status' ? 'New State' : 'New Event',
        onAddAlternate: addAlternateNode
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    
    // Create connection from source to alternate
    const newEdge = {
      id: `${sourceNodeId}-${newNode.id}`,
      source: sourceNodeId,
      target: newNode.id,
      type: 'animated',
    };
    setEdges((eds) => eds.concat(newEdge));
    
    // Auto-select the new node for editing
    setSelectedNode(newNode);
    if (alternateType === 'status') {
      setEditingState({
        name: 'New State',
        showSecondPage: false
      });
    } else {
      setEditingState({
        name: 'New Event',
        businessEventName: 'New Event',
        focalEntity: focalEntityOptions[0],
        description: '',
        createdEntities: [],
        modifiedEntities: [],
        businessEvents: ['New Event'],
        condition: 'None',
        triggerAutomatic: true,
        triggerExternal: false,
        showSecondPage: false
      });
    }
  }, [nodes, setNodes, setEdges, focalEntityOptions]);

  return (
    <div className="h-screen flex bg-[#F5F5DC]">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300">
          <button className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
            <KeyboardArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Application</h1>
        </div>

        {/* Workflow Details */}
        <div className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-bold text-gray-700 mb-1 block">
              Workflow Name
            </Label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-gray-50 border-gray-300"
            />
          </div>

          <div>
            <Label className="text-sm font-bold text-gray-700 mb-1 block">
              Workflow Description
            </Label>
            <div className="relative">
              <Textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Enter workflow description"
                className="bg-gray-50 border-gray-300 pr-12"
                rows={4}
                maxLength={240}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {workflowDescription.length}/240
              </div>
            </div>
          </div>
        </div>

        {/* Component Palette */}
        <div className="p-4 flex-1">
          <p className="text-sm text-gray-600 mb-4">
            Drag components below onto the canvas and connect them together to build your workflow.
          </p>

          <div className="space-y-3">
            {componentPalette.map((component) => (
              <div
                key={component.id}
                className="flex items-center gap-3 p-3 bg-gray-100 rounded border border-gray-300 cursor-move hover:bg-gray-200 transition-colors"
                draggable
                onDragStart={(event) => onDragStart(event, component.type)}
              >
                <div className="w-5 h-4 bg-gray-400 rounded flex items-center justify-center">
                  <div className="w-3 h-2 bg-gray-600 rounded-sm"></div>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-900">{component.label}</div>
                  {component.description && (
                    <div className="text-xs text-gray-500">{component.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Auto-positioning toggle */}
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm font-bold text-gray-700">Auto-positioning</span>
            <button
              onClick={() => setAutoPositioning(!autoPositioning)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoPositioning ? 'bg-blue-600' : 'bg-gray-300'
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
        <div className="p-4 border-t border-gray-300 space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-gray-400 text-gray-700">
              Save Draft
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              Publish Draft
            </Button>
          </div>
          <Button variant="destructive" className="w-full flex items-center justify-center gap-2 text-red-600 border-red-300 bg-white hover:bg-red-50">
            <Delete className="w-4 h-4" />
            Delete Workflow
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                onAddAlternate: addAlternateNode
              }
            }))}
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
            className="bg-[#F5F5DC]"
          >
            <Background variant={BackgroundVariant.Dots} color="#C0C0C0" gap={16} size={1} />
            <Controls 
              position="bottom-right"
              showZoom={true}
              showFitView={true}
              showInteractive={false}
              className="bg-white border border-gray-300 rounded shadow-sm"
            />
          </ReactFlow>
        </ReactFlowProvider>

        {/* Legend - Bottom right to match Figma */}
        <div className="absolute bottom-4 right-4 bg-white border border-gray-400 rounded p-3 shadow-sm w-32 h-24">
          <div className="text-xs text-gray-700 font-medium mb-2">Mini-map</div>
          <div className="bg-gray-100 rounded border border-gray-300 h-16 relative">
            {/* Mini representation of the workflow */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded"></div>
            <div className="absolute top-2 left-6 w-2 h-1 bg-gray-400 rounded"></div>
            <div className="absolute top-2 left-10 w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Node Editor */}
      {selectedNode && (
        <div className="w-96 bg-gray-800 text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExpandLess className="w-5 h-5" />
              <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
              </div>
            </div>
            <button 
              onClick={deleteSelectedNode}
              className="text-gray-400 hover:text-white"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            {selectedNode.type === 'status' ? (
              // State Node Editor
              <>
                <div>
                  <Label className="text-sm font-medium text-white mb-3 block">State</Label>
                  <Input
                    value={editingState.name}
                    onChange={(e) => setEditingState(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white h-12"
                    placeholder="Enter state name"
                  />
                </div>
              </>
            ) : (
              // Event Node Editor - Matches Figma exactly
              <>
                <div>
                  <Label className="text-sm font-medium text-white mb-3 block">
                    Business Event(s) and/or Subworkflow(s)
                  </Label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white h-12">
                    <option>Stage</option>
                    {businessEventOptions.map(event => (
                      <option key={event} value={event}>{event}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-white mb-3 block">Condition</Label>
                  <select 
                    value={editingState.condition || 'None'}
                    onChange={(e) => setEditingState(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white h-12"
                  >
                    <option value="None">None</option>
                    {conditionOptions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-white mb-3 block">Trigger</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editingState.triggerAutomatic}
                        onChange={(e) => setEditingState(prev => ({ ...prev, triggerAutomatic: e.target.checked }))}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600"
                      />
                      <span className="text-sm">Automatic</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editingState.triggerExternal}
                        onChange={(e) => setEditingState(prev => ({ ...prev, triggerExternal: e.target.checked }))}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600"
                      />
                      <span className="text-sm">External</span>
                    </label>
                  </div>
                </div>

                {/* Second page fields - shown when Next is clicked */}
                {editingState.showSecondPage && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-white mb-3 block">Business Event Name</Label>
                      <Input
                        value={editingState.businessEventName || ''}
                        onChange={(e) => setEditingState(prev => ({ ...prev, businessEventName: e.target.value }))}
                        className="bg-gray-700 border-gray-600 text-white h-12"
                        placeholder="Enrich"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-white mb-3 block">Focal Entity</Label>
                      <select 
                        value={editingState.focalEntity || 'Loan Commitment'}
                        onChange={(e) => setEditingState(prev => ({ ...prev, focalEntity: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white h-12"
                      >
                        <option value="Loan Commitment">Loan Commitment</option>
                        {focalEntityOptions.map(entity => (
                          <option key={entity} value={entity}>{entity}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-white mb-3 block">Description</Label>
                      <div className="relative">
                        <Textarea
                          value={editingState.description || 'PMF enriches hypo loan positions.'}
                          onChange={(e) => setEditingState(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white pr-16 min-h-[120px]"
                          rows={4}
                          maxLength={240}
                          placeholder="Enter description..."
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {editingState.description?.length || 0}/240
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-white mb-3 block">Created Entities</Label>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white h-12 mb-3">
                        <option>Select created entities</option>
                        {createdEntityOptions.map(entity => (
                          <option key={entity} value={entity}>{entity}</option>
                        ))}
                      </select>
                      <button className="text-cyan-400 text-sm hover:text-cyan-300 font-medium">Advanced Select</button>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-white mb-3 block">Modified Entities</Label>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white h-12 mb-3">
                        <option>Select modified entities</option>
                        {modifiedEntityOptions.map(entity => (
                          <option key={entity} value={entity}>{entity}</option>
                        ))}
                      </select>
                      <button className="text-cyan-400 text-sm hover:text-cyan-300 font-medium">Advanced Select</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-600 flex gap-3">
            {selectedNode.type === 'status' ? (
              <Button 
                onClick={saveNodeEdit}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-12 font-medium"
              >
                Done
              </Button>
            ) : (
              <>
                {editingState.showSecondPage ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingState(prev => ({ ...prev, showSecondPage: false }))}
                      className="flex-1 border-gray-600 text-white bg-gray-700 hover:bg-gray-600 h-12 font-medium"
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={saveNodeEdit}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-12 font-medium"
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setEditingState(prev => ({ ...prev, showSecondPage: true }))}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-12 font-medium"
                  >
                    Next
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

WorkflowEditor.displayName = 'WorkflowEditor';