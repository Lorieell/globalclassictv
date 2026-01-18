import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeInitializer } from "@/components/ThemeInitializer";

// Register PropellerAds Service Worker
const registerPropellerSW = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('PropellerAds SW registered'))
      .catch((err) => console.log('PropellerAds SW registration failed:', err));
  }
};

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const CataloguePage = lazy(() => import("./pages/CataloguePage"));
const MediaDetailPageRoute = lazy(() => import("./pages/MediaDetailPageRoute"));
const PlayerPageRoute = lazy(() => import("./pages/PlayerPageRoute"));
const PlayerRedirect = lazy(() => import("./pages/PlayerRedirect"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - reduce refetches
      gcTime: 1000 * 60 * 30, // 30 minutes cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  // Register PropellerAds Service Worker on mount
  useEffect(() => {
    registerPropellerSW();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeInitializer />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/films" element={<Index />} />
              <Route path="/series" element={<Index />} />
              <Route path="/watchlist" element={<Index />} />
              <Route path="/favorites" element={<Index />} />
              <Route path="/settings" element={<Index />} />
              <Route path="/detail" element={<Index />} />
              <Route path="/player" element={<PlayerRedirect />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/catalogue/:slug" element={<MediaDetailPageRoute />} />
              <Route path="/catalogue/:slug/player" element={<PlayerPageRoute />} />
              <Route path="/catalogue/:slug/saison-:seasonNum" element={<PlayerPageRoute />} />
              <Route path="/catalogue/:slug/saison-:seasonNum/episode-:episodeNum" element={<PlayerPageRoute />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
