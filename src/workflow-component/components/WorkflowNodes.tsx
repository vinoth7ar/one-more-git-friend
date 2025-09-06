import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

/**
 * ============= WORKFLOW NODE COMPONENTS =============
 * Custom node types for different workflow elements
 */

// Status Node - Circular nodes representing workflow states
export const StatusNode: React.FC<NodeProps> = memo(({ data }) => {
  return (
    <div className="status-node">
      <Handle type="target" position={Position.Left} />
      <div className="status-node-content">
        {String(data.label)}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

StatusNode.displayName = 'StatusNode';

// Event Node - Rectangular nodes representing workflow events/actions
export const EventNode: React.FC<NodeProps> = memo(({ data }) => {
  return (
    <div className="event-node">
      <Handle type="target" position={Position.Left} />
      <div className="event-node-content">
        {String(data.label)}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

EventNode.displayName = 'EventNode';

// Node type mapping for ReactFlow
export const nodeTypes = {
  status: StatusNode,
  event: EventNode,
};