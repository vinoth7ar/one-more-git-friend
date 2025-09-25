import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ViewPage from "./pages/View";
import EditorPage from "./pages/Editor";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/view" element={<ViewPage />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;