import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { WorkflowManager } from "@/components/WorkflowManager";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkflowManager />} />
        <Route path="/visualization/:type/:id" element={<WorkflowManager />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
