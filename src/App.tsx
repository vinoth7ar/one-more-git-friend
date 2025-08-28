import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkflowBuilder />} />
        <Route path="/visualization/:type/:id" element={<WorkflowBuilder />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
