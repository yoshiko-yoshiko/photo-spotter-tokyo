import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import SplashPage from "@/features/auth/pages/splash-page";
import LoginPage from "@/features/auth/pages/login-page";
import OnboardingPage from "@/features/auth/pages/onboarding-page";
import MapPage from "@/features/map/pages/map-page";
import CameraPage from "@/features/camera/pages/camera-page";
import CollectionPage from "@/features/rewards/pages/collection-page";
import ProfilePage from "@/features/profile/pages/profile-page";
import SpotDetailPage from "@/features/spots/pages/spot-detail-page";
import NotFound from "@/features/app/pages/not-found";
import DebugPage from "@/features/debug/pages/debug-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";

const TimelinePage = lazy(() => import('@/features/timeline/pages/timeline-page').then(m => ({ default: m.TimelinePage })));
const SpotPhotosPage = lazy(() => import('@/features/photos/pages/spot-photos-page'));

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
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/map" element={<MapPage />} />
            <Route path="/timeline" element={<Suspense fallback={null}><TimelinePage /></Suspense>} />
            <Route path="/spots/:slug" element={<SpotDetailPage />} />
            <Route path="/spots/:slug/photos" element={<Suspense fallback={null}><SpotPhotosPage /></Suspense>} />
            <Route path="/camera" element={<ProtectedRoute><CameraPage /></ProtectedRoute>} />
            <Route path="/collection" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/debug" element={<DebugPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
