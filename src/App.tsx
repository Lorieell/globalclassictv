import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import Index from "./pages/Index";
import CataloguePage from "./pages/CataloguePage";
import MediaDetailPageRoute from "./pages/MediaDetailPageRoute";
import PlayerPageRoute from "./pages/PlayerPageRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/catalogue/:slug" element={<MediaDetailPageRoute />} />
          <Route path="/catalogue/:slug/player" element={<PlayerPageRoute />} />
          <Route path="/catalogue/:slug/source" element={<PlayerPageRoute />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
