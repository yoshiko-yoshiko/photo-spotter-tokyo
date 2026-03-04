import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import SplashPage from "@/features/auth/pages/splash-page";
import LoginPage from "@/features/auth/pages/login-page";
import OnboardingPage from "@/features/auth/pages/onboarding-page";
import NotFound from "@/features/app/pages/not-found";
import DebugPage from "@/features/debug/pages/debug-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";
import "@/lib/hooks/use-theme"; // Apply saved theme immediately on app load

const MapPage = lazy(() => import('@/features/map/pages/map-page'));
const CameraPage = lazy(() => import('@/features/camera/pages/camera-page'));
const CollectionPage = lazy(() => import('@/features/rewards/pages/collection-page'));
const ProfilePage = lazy(() => import('@/features/profile/pages/profile-page'));
const SpotDetailPage = lazy(() => import('@/features/spots/pages/spot-detail-page'));
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
            <Route path="/map" element={<Suspense fallback={null}><MapPage /></Suspense>} />
            <Route path="/timeline" element={<Suspense fallback={null}><TimelinePage /></Suspense>} />
            <Route path="/spots/:slug" element={<Suspense fallback={null}><SpotDetailPage /></Suspense>} />
            <Route path="/spots/:slug/photos" element={<Suspense fallback={null}><SpotPhotosPage /></Suspense>} />
            <Route path="/camera" element={<ProtectedRoute><Suspense fallback={null}><CameraPage /></Suspense></ProtectedRoute>} />
            <Route path="/collection" element={<ProtectedRoute><Suspense fallback={null}><CollectionPage /></Suspense></ProtectedRoute>} />
            <Route path="/profile" element={<Suspense fallback={null}><ProfilePage /></Suspense>} />
          </Route>
          <Route path="/debug" element={<DebugPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
