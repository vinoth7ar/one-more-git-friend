import { useState, useMemo } from 'react';
import { SimpleWorkflowBuilder } from '@/components/workflow/SimpleWorkflowBuilder';
import { SimpleWorkflowSelector } from '@/components/workflow/SimpleWorkflowSelector';
import { mockSimpleWorkflows, defaultWorkflow } from '@/components/workflow/mock-data';

export const SimpleWorkflowPage = () => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(defaultWorkflow);

  const currentWorkflow = useMemo(() => {
    return mockSimpleWorkflows[selectedWorkflowId];
  }, [selectedWorkflowId]);

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <div className="p-4 border-r border-border bg-card">
        <SimpleWorkflowSelector
          workflows={mockSimpleWorkflows}
          selectedWorkflow={selectedWorkflowId}
          onWorkflowSelect={handleWorkflowSelect}
          currentWorkflow={currentWorkflow}
        />
      </div>

      {/* Main workflow canvas */}
      <div className="flex-1 relative">
        {currentWorkflow && (
          <>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-card/90 backdrop-blur-sm border-b border-border p-4">
              <h1 className="text-2xl font-bold">{currentWorkflow.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{currentWorkflow.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{currentWorkflow.nodes.length} nodes</span>
                <span>•</span>
                <span>{currentWorkflow.edges.length} connections</span>
                <span>•</span>
                <span className="text-primary">Non-draggable nodes</span>
              </div>
            </div>

            {/* Workflow Builder */}
            <div className="pt-24 h-full">
              <SimpleWorkflowBuilder 
                workflow={currentWorkflow}
                className="h-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};