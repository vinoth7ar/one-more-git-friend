import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface CircularNodeData extends Record<string, unknown> {
  label: string;
  onClick?: () => void;
  color?: string;
}

const CircularNode = ({ data }: NodeProps) => {
  const nodeData = data as CircularNodeData;
  
  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log('Clicked status node:', nodeData.label);
  };

  const getCircleStyles = () => {
    return 'w-20 h-20 rounded-full bg-workflow-circular border-2 border-workflow-circular-border flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200';
  };

  return (
    <div 
      className={getCircleStyles()}
      onClick={handleClick}
    >
      <div className="text-xs font-bold text-center text-foreground px-2 leading-tight">
        {nodeData.label}
      </div>
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
    </div>
  );
};

export default memo(CircularNode);