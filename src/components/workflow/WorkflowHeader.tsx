import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const WorkflowHeader = () => {
  return (
    <div>
      {/* Main Header */}
      <header className="bg-workflow-node-bg border-b border-workflow-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">EBM Studio</span>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <Input 
            placeholder="Search" 
            className="w-full border-primary/50 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-primary font-medium">Data Journeys</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Lineage</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">FDE</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Editor</a>
          </nav>
        </div>
      </header>

      {/* PMF Bar */}
      <div className="bg-black text-white px-6 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">PMF</span>
        <div className="text-sm">...</div>
      </div>
    </div>
  );
};

export default WorkflowHeader;