import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import SplashPage from "@/pages/splash-page";
import LoginPage from "@/pages/login-page";
import OnboardingPage from "@/pages/onboarding-page";
import MapPage from "@/pages/map-page";
import CameraPage from "@/pages/camera-page";
import CollectionPage from "@/pages/collection-page";
import ProfilePage from "@/pages/profile-page";
import SpotDetailPage from "@/pages/spot-detail-page";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/map" element={<MapPage />} />
            <Route path="/spots/:id" element={<SpotDetailPage />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
