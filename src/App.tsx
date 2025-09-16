import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import NotFound from "./pages/NotFound";
import { WorkflowManager } from "@/components/WorkflowManager";
import { Button } from "@/components/ui/button";

// Example of real-time data structure (replace with your actual API response)
const sampleRealTimeData = {
  id: "real-time-workflow-001",
  name: "Real-Time Workflow",
  description: "This is real-time workflow data from your API",
  nodes: [
    { id: "start-node", type: "status", label: "Start Process" },
    { id: "process-1", type: "event", label: "Validate Input" },
    { id: "decision-1", type: "status", label: "Review Required" },
    { id: "process-2", type: "event", label: "Auto Approve" },
    { id: "end-success", type: "status", label: "Completed" },
    { id: "end-failure", type: "status", label: "Rejected" }
  ],
  edges: [
    { id: "e1", source: "start-node", target: "process-1", label: "" },
    { id: "e2", source: "process-1", target: "decision-1", label: "" },
    { id: "e3", source: "decision-1", target: "process-2", label: "approved" },
    { id: "e4", source: "process-2", target: "end-success", label: "" },
    { id: "e5", source: "decision-1", target: "end-failure", label: "rejected" }
  ]
};

const App = () => {
  const [useRealTimeData, setUseRealTimeData] = useState(false);
  const [currentData, setCurrentData] = useState(sampleRealTimeData);

  // Simulate receiving new real-time data
  const simulateDataUpdate = () => {
    const updatedData = {
      ...sampleRealTimeData,
      name: "Updated Real-Time Workflow",
      nodes: [
        ...sampleRealTimeData.nodes,
        { id: "new-process", type: "event", label: "New Step Added" }
      ],
      edges: [
        ...sampleRealTimeData.edges,
        { id: "e6", source: "process-2", target: "new-process", label: "new" },
        { id: "e7", source: "new-process", target: "end-success", label: "" }
      ]
    };
    setCurrentData(updatedData);
  };

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        {/* Demo Controls */}
        <div className="bg-gray-100 p-4 border-b flex items-center gap-4">
          <Button
            variant={useRealTimeData ? "default" : "outline"}
            onClick={() => setUseRealTimeData(!useRealTimeData)}
          >
            {useRealTimeData ? "📡 Using Real-Time Data" : "🏗️ Using Mock Data"}
          </Button>
          {useRealTimeData && (
            <Button onClick={simulateDataUpdate} variant="outline">
              🔄 Simulate Data Update
            </Button>
          )}
          <span className="text-sm text-gray-600">
            Toggle between mock data and real-time data to see the difference
          </span>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={
                <WorkflowManager 
                  workflowData={useRealTimeData ? currentData : undefined}
                  useExternalData={useRealTimeData}
                />
              } 
            />
            <Route 
              path="/visualization/:type/:id" 
              element={
                <WorkflowManager 
                  workflowData={useRealTimeData ? currentData : undefined}
                  useExternalData={useRealTimeData}
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
