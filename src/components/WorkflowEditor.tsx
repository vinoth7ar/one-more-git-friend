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
import { ChevronUp, ChevronDown, Trash2, X, Plus, ArrowRight, Grid3x3 } from 'lucide-react';

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
  icon: string;
  description: string;
}

interface NodeEditingState {
  // Basic fields
  name: string;
  
  // Business Event fields
  businessEventName?: string;
  focalEntity?: string;
  description?: string;
  createdEntities?: string[];
  modifiedEntities?: string[];
  
  // Transition Block fields  
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
    triggerExternal: false
  });
  
  // React Flow state - start with empty canvas
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
    
    // Initialize editing state based on node type
    if (node.type === 'status') {
      setEditingState({
        name: nodeData.label || '',
      });
    } else if (node.type === 'event') {
      setEditingState({
        name: nodeData.label || '',
        businessEventName: nodeData.label || '',
        focalEntity: focalEntityOptions[0],
        description: 'PMF enriches hypo loan positions.',
        createdEntities: ['Loan Commitment'],
        modifiedEntities: [],
        businessEvents: [nodeData.label || ''],
        condition: 'None',
        triggerAutomatic: true,
        triggerExternal: false
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
      x: event.clientX - reactFlowBounds.left - 320, // Adjust for sidebar width
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

  // Add/remove entities
  const addCreatedEntity = (entity: string) => {
    setEditingState(prev => ({
      ...prev,
      createdEntities: [...(prev.createdEntities || []), entity]
    }));
  };

  const removeCreatedEntity = (entity: string) => {
    setEditingState(prev => ({
      ...prev,
      createdEntities: (prev.createdEntities || []).filter(e => e !== entity)
    }));
  };

  const addModifiedEntity = (entity: string) => {
    setEditingState(prev => ({
      ...prev,
      modifiedEntities: [...(prev.modifiedEntities || []), entity]
    }));
  };

  const removeModifiedEntity = (entity: string) => {
    setEditingState(prev => ({
      ...prev,
      modifiedEntities: (prev.modifiedEntities || []).filter(e => e !== entity)
    }));
  };

  const addBusinessEvent = (event: string) => {
    setEditingState(prev => ({
      ...prev,
      businessEvents: [...(prev.businessEvents || []), event]
    }));
  };

  const removeBusinessEvent = (event: string) => {
    setEditingState(prev => ({
      ...prev,
      businessEvents: (prev.businessEvents || []).filter(e => e !== event)
    }));
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
            <ArrowRight className="w-4 h-4 rotate-180 mr-1" />
            Back
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
          <Button variant="destructive" className="w-full flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Workflow
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
            <Background variant={BackgroundVariant.Dots} color="#e5e7eb" gap={20} size={1} />
            <Controls position="bottom-left" />
            
            {/* Custom fit layout button */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button
                onClick={handleSmartLayout}
                size="sm"
                variant="outline"
                className="bg-white/90 backdrop-blur-sm shadow-lg"
                disabled={nodes.length === 0}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>
          </ReactFlow>
        </ReactFlowProvider>

        {/* Legend positioned at top-right corner */}
        {nodes.length > 0 && (
          <div className="absolute top-16 right-4 bg-cyan-100 rounded-lg border border-cyan-200 p-4 shadow-lg min-w-[200px] z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Legend</h3>
              <ChevronUp className="w-4 h-4" />
            </div>
            <div className="bg-white rounded border p-3">
              <div className="text-center mb-2">
                <div className="text-xs font-medium text-gray-700">Application</div>
                <div className="text-xs text-gray-500">Workflow</div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-6 bg-gray-200 rounded border flex items-center justify-center">
                    <span className="text-xs text-gray-600">Business Event</span>
                  </div>
                  <span className="text-xs text-gray-500">events</span>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full border border-gray-400"></div>
                  <span className="text-xs text-gray-500">state</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <div className="w-8 h-4 bg-gray-100 rounded border mx-auto"></div>
                <span className="text-xs text-gray-500">Data Entity</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State Message */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium mb-2">Start Building Your Workflow</p>
              <p className="text-sm">Drag a component from the sidebar to create your first node</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Node Editor */}
      {selectedNode && (
        <div className="w-80 bg-gray-900 text-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-white">
                <ChevronUp size={16} />
              </button>
              <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <button 
              onClick={deleteSelectedNode}
              className="text-gray-400 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Editor Content */}
          <div className="p-4 flex-1 overflow-y-auto">
            {selectedNode.type === 'status' ? (
              // State Editor
              <div className="space-y-4">
                <div>
                  <Label htmlFor="state-name" className="text-sm font-medium text-white">
                    State
                  </Label>
                  <Input
                    id="state-name"
                    value={editingState.name}
                    onChange={(e) => setEditingState(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2 bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter state name"
                  />
                </div>
              </div>
            ) : (
              // Business Event Editor
              <div className="space-y-6">
                {/* Business Event Name */}
                <div>
                  <Label htmlFor="business-event-name" className="text-sm font-medium text-white">
                    Business Event Name
                  </Label>
                  <Input
                    id="business-event-name"
                    value={editingState.businessEventName || ''}
                    onChange={(e) => setEditingState(prev => ({ ...prev, businessEventName: e.target.value }))}
                    className="mt-2 bg-gray-800 border-gray-600 text-white"
                    placeholder="Enrich"
                  />
                </div>

                {/* Focal Entity */}
                <div>
                  <Label htmlFor="focal-entity" className="text-sm font-medium text-white">
                    Focal Entity
                  </Label>
                  <div className="relative">
                    <select
                      id="focal-entity"
                      value={editingState.focalEntity || ''}
                      onChange={(e) => setEditingState(prev => ({ ...prev, focalEntity: e.target.value }))}
                      className="mt-2 w-full p-2 bg-gray-800 border border-gray-600 rounded text-white appearance-none pr-8"
                    >
                      {focalEntityOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-white">
                    Description
                  </Label>
                  <div className="relative mt-2">
                    <Textarea
                      id="description"
                      value={editingState.description || ''}
                      onChange={(e) => setEditingState(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white pr-12"
                      rows={3}
                      maxLength={240}
                      placeholder="PMF enriches hypo loan positions."
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {(editingState.description || '').length}/240
                    </div>
                  </div>
                </div>

                {/* Created Entities */}
                <div>
                  <Label className="text-sm font-medium text-white">
                    Created Entities
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addCreatedEntity(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white appearance-none pr-8"
                      >
                        <option value="">Select created entities</option>
                        {createdEntityOptions.filter(opt => !editingState.createdEntities?.includes(opt)).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button className="text-xs text-cyan-400 hover:text-cyan-300">
                      Advanced Select
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {editingState.createdEntities?.map(entity => (
                        <span key={entity} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-xs rounded">
                          {entity}
                          <button 
                            onClick={() => removeCreatedEntity(entity)}
                            className="hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modified Entities */}
                <div>
                  <Label className="text-sm font-medium text-white">
                    Modified Entities
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addModifiedEntity(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white appearance-none pr-8"
                      >
                        <option value="">Select modified entities</option>
                        {modifiedEntityOptions.filter(opt => !editingState.modifiedEntities?.includes(opt)).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button className="text-xs text-cyan-400 hover:text-cyan-300">
                      Advanced Select
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {editingState.modifiedEntities?.map(entity => (
                        <span key={entity} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-xs rounded">
                          {entity}
                          <button 
                            onClick={() => removeModifiedEntity(entity)}
                            className="hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Business Events & Subworkflows */}
                <div>
                  <Label className="text-sm font-medium text-white">
                    Business Event(s) and/or Subworkflow(s)
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <select className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white appearance-none pr-8">
                        <option value="">Select business event(s) and/or subworkflow(s)</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-600 text-xs rounded">
                        Enrich
                        <button className="hover:text-cyan-200">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                      {editingState.businessEvents?.map(event => (
                        <span key={event} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-600 text-xs rounded">
                          {event}
                          <button 
                            onClick={() => removeBusinessEvent(event)}
                            className="hover:text-cyan-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <Label htmlFor="condition" className="text-sm font-medium text-white">
                    Condition
                  </Label>
                  <div className="relative">
                    <select
                      id="condition"
                      value={editingState.condition || 'None'}
                      onChange={(e) => setEditingState(prev => ({ ...prev, condition: e.target.value }))}
                      className="mt-2 w-full p-2 bg-gray-800 border border-gray-600 rounded text-white appearance-none pr-8"
                    >
                      <option value="None">None</option>
                      <option value="If">If</option>
                      <option value="While">While</option>
                      <option value="When">When</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Trigger */}
                <div>
                  <Label className="text-sm font-medium text-white mb-3 block">
                    Trigger
                  </Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingState.triggerAutomatic || false}
                        onChange={(e) => setEditingState(prev => ({ ...prev, triggerAutomatic: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Automatic</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingState.triggerExternal || false}
                        onChange={(e) => setEditingState(prev => ({ ...prev, triggerExternal: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">External</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-4 border-t border-gray-700 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedNode(null)}
              className="text-gray-300 border-gray-600 hover:bg-gray-800"
            >
              Previous
            </Button>
            <Button 
              onClick={saveNodeEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {selectedNode.type === 'status' ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

WorkflowEditor.displayName = 'WorkflowEditor';