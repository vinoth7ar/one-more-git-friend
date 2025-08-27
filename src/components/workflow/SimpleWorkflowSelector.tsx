import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleWorkflow } from './mock-data';

interface SimpleWorkflowSelectorProps {
  workflows: Record<string, SimpleWorkflow>;
  selectedWorkflow: string;
  onWorkflowSelect: (workflowId: string) => void;
  currentWorkflow?: SimpleWorkflow;
}

export const SimpleWorkflowSelector = memo(({ 
  workflows, 
  selectedWorkflow, 
  onWorkflowSelect,
  currentWorkflow 
}: SimpleWorkflowSelectorProps) => {
  return (
    <Card className="w-80 h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Workflow Selection</CardTitle>
        <CardDescription>
          Choose a workflow to visualize
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Workflow:</label>
          <Select value={selectedWorkflow} onValueChange={onWorkflowSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose workflow..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(workflows).map(([key, workflow]) => (
                <SelectItem key={key} value={key}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentWorkflow && (
          <div className="space-y-3 pt-4 border-t">
            <div>
              <h4 className="font-medium text-sm">Current Workflow</h4>
              <p className="text-sm text-muted-foreground">{currentWorkflow.name}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">Description</h4>
              <p className="text-xs text-muted-foreground">{currentWorkflow.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm">Nodes</h4>
              <div className="space-y-1">
                {currentWorkflow.nodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{node.label}</span>
                    <span className={`
                      px-2 py-1 rounded text-xs
                      ${node.type === 'event' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                      }
                    `}>
                      {node.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm">Connections</h4>
              <div className="text-xs text-muted-foreground">
                {currentWorkflow.edges.length} edge{currentWorkflow.edges.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SimpleWorkflowSelector.displayName = 'SimpleWorkflowSelector';