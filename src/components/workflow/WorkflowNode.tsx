import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface WorkflowNodeData extends Record<string, unknown> {
  title: string;
  description?: string;
  type: 'workflow' | 'stage' | 'data' | 'process' | 'pmf-tag' | 'entities-group';
  items?: string[];
  entities?: Array<{ id: string; title: string; color?: string }>;
  onClick?: () => void;
  entitiesExpanded?: boolean;
  onToggleEntities?: () => void;
  isSelected?: boolean;
  color?: string;
}

const WorkflowNode = ({ data }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const getNodeStyles = () => {
    switch (nodeData.type) {
      case 'workflow':
        return 'bg-workflow-canvas border-2 border-dashed border-workflow-border rounded-lg min-w-[900px] min-h-[500px] p-8 relative shadow-lg';
      case 'stage':
        return 'bg-workflow-node-bg border-2 border-workflow-stage-border rounded-md p-6 min-w-[200px] min-h-[120px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md';
      case 'data':
        let bgColor = 'bg-workflow-data-bg';
        if (nodeData.color === 'yellow') {
          bgColor = 'bg-workflow-data-bg';
        }
        return `${bgColor} border border-workflow-data-border px-4 py-2 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow transform rotate-[-2deg] shadow-sm rounded`;
      case 'pmf-tag':
        return 'bg-workflow-pmf-bg text-workflow-pmf-text px-4 py-2 text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity rounded shadow-md';
      case 'process':
        return 'bg-workflow-process-bg text-workflow-process-text border-workflow-stage-border border rounded px-3 py-1 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow';
      case 'entities-group':
        return 'bg-workflow-node-bg border border-workflow-stage-border rounded-md p-6 min-w-[600px] cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md';
      default:
        return 'bg-workflow-node-bg border-workflow-node-border border rounded p-3 cursor-pointer hover:shadow-md transition-shadow';
    }
  };

  const handleClick = () => {
    if (nodeData.onClick) {
      nodeData.onClick();
    }
    console.log(`Clicked ${nodeData.type} node:`, nodeData.title);
  };

  if (nodeData.type === 'pmf-tag') {
    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="font-bold">
          {nodeData.title}
        </div>
      </div>
    );
  }

  if (nodeData.type === 'data') {
    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="flex items-center gap-2">
          <span className="font-medium">{nodeData.title}</span>
          <span className="text-xs font-bold">⋮</span>
        </div>
      </div>
    );
  }

  if (nodeData.type === 'entities-group') {
    const handleIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nodeData.onToggleEntities) {
        nodeData.onToggleEntities();
      }
    };

    return (
      <div className={getNodeStyles()} onClick={handleClick}>
        <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <span 
            className="cursor-pointer select-none text-lg leading-none"
            onClick={handleIconClick}
          >
            {nodeData.entitiesExpanded ? '▼' : '▲'}
          </span>
          <span>Modified Data Entities</span>
        </div>
        {nodeData.entitiesExpanded && (
          <div className="flex flex-wrap gap-3">
            {nodeData.entities?.map((entity) => {
              const bgColor = entity.color === 'yellow' ? 'bg-workflow-data-bg' : 'bg-muted';
              const borderColor = entity.color === 'yellow' ? 'border-workflow-data-border' : 'border-border';
              return (
                <div
                  key={entity.id}
                  className={`${bgColor} ${borderColor} border px-3 py-2 text-sm font-medium transform rotate-[-2deg] shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <div className="flex items-center gap-1">
                    <span>{entity.title}</span>
                    <span className="text-xs font-bold">⋮</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.type === 'workflow') {
    return (
      <div className={getNodeStyles()}>        
        <div className="text-2xl font-bold text-foreground mb-2">
          {nodeData.title}
        </div>
        
        {nodeData.description && (
          <div className="text-base text-muted-foreground mb-8">
            {nodeData.description}
          </div>
        )}

        <div className="space-y-4">
          {/* Stage and Enrich boxes will be positioned inside */}
        </div>
      </div>
    );
  }

  return (
    <div className={getNodeStyles()} onClick={handleClick}>
      <div className="text-lg font-bold text-foreground mb-3">
        {nodeData.title}
      </div>
      {nodeData.description && (
        <div className="text-sm text-muted-foreground leading-relaxed">
          {nodeData.description}
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-workflow-border rounded-none border border-workflow-border opacity-0" />
    </div>
  );
};

export default memo(WorkflowNode);