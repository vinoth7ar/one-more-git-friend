import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface StatusNodeData {
  label: string;
}

export const StatusNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as StatusNodeData;
  return (
    <div className={`
      w-20 h-20 rounded-full border-2 flex items-center justify-center text-center text-sm font-medium
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-amber-300 bg-amber-50'}
      hover:shadow-lg transition-all duration-200
    `}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <span className="text-amber-800 px-2">{nodeData.label}</span>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

StatusNode.displayName = 'StatusNode';