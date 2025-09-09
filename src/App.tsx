import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import NotFound from "./pages/NotFound";
import { SingleViewWorkflowBuilder } from "@/components/SingleViewWorkflowBuilder";
import { Button } from "@/components/ui/button";


const App = () => {
  const [currentWorkflowId, setCurrentWorkflowId] = useState('ebm-version');

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        {/* Demo Controls */}
        <div className="bg-gray-100 p-4 border-b flex items-center gap-4">
          <Button
            variant={currentWorkflowId === 'ebm-version' ? "default" : "outline"}
            onClick={() => setCurrentWorkflowId('ebm-version')}
          >
            📋 EBM Version
          </Button>
          <Button
            variant={currentWorkflowId === 'mortgage-origination' ? "default" : "outline"}
            onClick={() => setCurrentWorkflowId('mortgage-origination')}
          >
            🏠 Mortgage Workflow
          </Button>
          <span className="text-sm text-gray-600">
            Choose different workflows to visualize
          </span>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={
                <SingleViewWorkflowBuilder 
                  workflowId={currentWorkflowId}
                />
              } 
            />
            <Route 
              path="/visualization/:type/:id" 
              element={
                <SingleViewWorkflowBuilder 
                  workflowId={currentWorkflowId}
                />
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
