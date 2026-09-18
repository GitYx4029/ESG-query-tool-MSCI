import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DisclaimerWatermark from "./components/DisclaimerWatermark";
import TopNotificationBar from "./components/TopNotificationBar";
import BottomEmphasisBar from "./components/BottomEmphasisBar";
import Home from "./pages/Home";
import IndustryDetail from "./pages/IndustryDetail";
import CompanyAnalysis from "./pages/CompanyAnalysis";
import MaterialityMap from "./pages/MaterialityMap";
import RealEstateDrilldown from "./pages/RealEstateDrilldown";
import SolarDrilldown from "./pages/SolarDrilldown";
import DrilldownList from "./pages/DrilldownList";
import DrilldownDetail from "./pages/DrilldownDetail";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/industry/:name" component={IndustryDetail} />
      <Route path="/company" component={CompanyAnalysis} />
      <Route path="/materiality-map" component={MaterialityMap} />
      <Route path="/drilldown/real-estate" component={RealEstateDrilldown} />
      <Route path="/drilldown/solar" component={SolarDrilldown} />
      <Route path="/drilldowns" component={DrilldownList} />
      <Route path="/drilldown/:id" component={DrilldownDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DisclaimerWatermark />
          <div className="relative z-10 flex flex-col min-h-screen">
            <TopNotificationBar />
            <div className="flex-1">
              <Router />
            </div>
            <BottomEmphasisBar />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
