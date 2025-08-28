import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Settings, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-workflow-bg">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Pipeline Management Framework
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Visualize and manage your workflows and entities with our intuitive single-view system
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/single-view/workflow-1')}
              className="gap-2"
            >
              <Eye className="h-5 w-5" />
              Start Visualization
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/builder')}
              className="gap-2"
            >
              <Settings className="h-5 w-5" />
              Workflow Builder
            </Button>
          </div>

          <div className="mt-12 text-sm text-muted-foreground">
            <p>
              Choose from available workflows and entities • Customize your view • 
              Visualize with interactive React Flow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
