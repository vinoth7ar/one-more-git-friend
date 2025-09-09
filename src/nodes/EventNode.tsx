import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

/**
 * EventNode - Rectangular node component for workflow events/actions
 * Features: Multiple connection handles, selection highlighting, professional styling
 */
const EventNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className="relative">
      {/* Multiple input handles for flexible connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      
      {/* Rectangular event node with enhanced selection styling */}
      <div 
        className={`
          px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600
          border-3 border-white shadow-lg
          transition-all duration-200 ease-in-out
          min-w-[120px] max-w-[200px]
          ${selected 
            ? 'ring-4 ring-purple-300 ring-opacity-60 shadow-xl scale-105 from-purple-600 to-purple-700' 
            : 'hover:shadow-xl hover:scale-102 hover:from-purple-600 hover:to-purple-700'
          }
        `}
      >
        <div className="text-center">
          <span className="text-sm font-semibold text-white leading-tight drop-shadow-sm">
            {(data as any)?.label || 'Event'}
          </span>
        </div>
      </div>
      
      {/* Multiple output handles for flexible connections */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-out"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-out"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-out"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
      />
    </div>
  );
});

EventNode.displayName = 'EventNode';

export default EventNode;