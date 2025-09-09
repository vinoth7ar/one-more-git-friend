import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

/**
 * StatusNode - Circular node component for workflow status states
 * Features: Multiple connection handles, selection highlighting, contrasted text
 */
const StatusNode = memo(({ data, selected }: NodeProps) => {
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
      
      {/* Circular status node with enhanced selection styling */}
      <div 
        className={`
          w-20 h-20 rounded-full flex items-center justify-center text-center
          bg-gradient-to-br from-blue-500 to-blue-600
          border-4 border-white shadow-lg
          transition-all duration-200 ease-in-out
          ${selected 
            ? 'ring-4 ring-blue-300 ring-opacity-60 shadow-xl scale-110 from-blue-600 to-blue-700' 
            : 'hover:shadow-xl hover:scale-105 hover:from-blue-600 hover:to-blue-700'
          }
        `}
      >
        <span className="text-xs font-semibold text-white leading-tight px-1 drop-shadow-sm">
          {(data as any)?.label || 'Status'}
        </span>
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

StatusNode.displayName = 'StatusNode';

export default StatusNode;