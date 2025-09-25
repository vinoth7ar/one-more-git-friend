import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface EventNodeData {
  label: string;
}

export const EventNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as EventNodeData;
  return (
    <div className={`
      w-24 h-16 border-2 flex items-center justify-center text-center text-sm font-medium
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}
      hover:shadow-lg transition-all duration-200
    `}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <span className="text-slate-700 px-2">{nodeData.label}</span>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

EventNode.displayName = 'EventNode';