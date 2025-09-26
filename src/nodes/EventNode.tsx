import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Add } from '@mui/icons-material';

export interface EventNodeData {
  label: string;
  onAddAlternate?: (nodeId: string) => void;
}

export const EventNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as EventNodeData;
  
  const handleAddAlternate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.onAddAlternate && id) {
      nodeData.onAddAlternate(id);
    }
  };

  return (
    <div className="relative group">
      <div className={`
        w-24 h-16 border-2 flex items-center justify-center text-center text-sm font-medium
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}
        hover:shadow-lg transition-all duration-200
      `}>
        <Handle type="target" position={Position.Left} className="w-3 h-3" />
        <span className="text-slate-700 px-2">{nodeData.label}</span>
        <Handle type="source" position={Position.Right} className="w-3 h-3" />
      </div>
      
      {/* Add Alternate Button */}
      <button
        onClick={handleAddAlternate}
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700"
        title="Add alternate node"
      >
        <Add className="w-4 h-4" />
      </button>
    </div>
  );
});

EventNode.displayName = 'EventNode';