import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { trackEvent } from "./lib/community";
import {
  AnalysisGateProvider,
  ProtectedAnalysis,
} from "./components/AnalysisGate";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DisclaimerWatermark from "./components/DisclaimerWatermark";
import TopNotificationBar from "./components/TopNotificationBar";
import BottomEmphasisBar from "./components/BottomEmphasisBar";
import Home from "./pages/Home";
import IndustryDetail from "./pages/IndustryDetail";
const AdminInsights = lazy(() => import("./pages/AdminInsights"));
const CompanyAnalysis = lazy(() => import("./pages/CompanyAnalysis"));
const ReportAnalysis = lazy(() => import("./pages/ReportAnalysis"));
import MaterialityMap from "./pages/MaterialityMap";
const RealEstateDrilldown = lazy(() => import("./pages/RealEstateDrilldown"));
const SolarDrilldown = lazy(() => import("./pages/SolarDrilldown"));
const DrilldownList = lazy(() => import("./pages/DrilldownList"));
const DrilldownDetail = lazy(() => import("./pages/DrilldownDetail"));
function AppRoutes() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/report-analysis">
        <Suspense fallback={<div className="container py-12">加载报告分析工具…</div>}>
          <ReportAnalysis />
        </Suspense>
      </Route>
      <Route path="/industry/:name" component={IndustryDetail} />
      <Route path="/company">
        <ProtectedAnalysis>
          <Suspense fallback={<div className="container py-12">加载中…</div>}>
            <CompanyAnalysis />
          </Suspense>
        </ProtectedAnalysis>
      </Route>
      <Route path="/materiality-map" component={MaterialityMap} />
      <Route path="/drilldown/real-estate">
        <ProtectedAnalysis>
          <Suspense fallback={<div className="container py-12">加载中…</div>}>
            <RealEstateDrilldown />
          </Suspense>
        </ProtectedAnalysis>
      </Route>
      <Route path="/drilldown/solar">
        <ProtectedAnalysis>
          <Suspense fallback={<div className="container py-12">加载中…</div>}>
            <SolarDrilldown />
          </Suspense>
        </ProtectedAnalysis>
      </Route>
      <Route path="/drilldowns">
        <ProtectedAnalysis>
          <Suspense fallback={<div className="container py-12">加载中…</div>}>
            <DrilldownList />
          </Suspense>
        </ProtectedAnalysis>
      </Route>
      <Route path="/drilldown/:id">
        <ProtectedAnalysis>
          <Suspense fallback={<div className="container py-12">加载中…</div>}>
            <DrilldownDetail />
          </Suspense>
        </ProtectedAnalysis>
      </Route>
      <Route path="/admin/insights">
        <ProtectedAnalysis>
          <Suspense fallback={<div className="container py-12">加载中…</div>}>
            <AdminInsights />
          </Suspense>
        </ProtectedAnalysis>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const routeBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DisclaimerWatermark />
          <div className="relative z-10 flex flex-col min-h-screen">
            <TopNotificationBar />
            <div className="flex-1">
              <Router base={routeBase}>
                <AnalysisGateProvider>
                  <RouterContent />
                </AnalysisGateProvider>
              </Router>
            </div>
            <BottomEmphasisBar />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function RouterContent() {
  useEffect(() => {
    trackEvent("entry");
  }, []);
  return <AppRoutes />;
}

export default App;
