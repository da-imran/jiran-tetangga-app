import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityMenu } from "@/components/accessibility-menu";
import NotFound from "@/pages/not-found";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import AdminPage from "@/app/admin/page";
import AdminGuard from "@/app/admin/layout";
import MapPage from "@/app/map/page";
import MarketplacePage from "@/app/marketplace/page";
import LostFoundPage from "@/app/lost-found/page";
import ForgotPasswordPage from "@/app/forgot-password/page";
import ResetPasswordPage from "@/app/reset-password/page";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/lost-found" component={LostFoundPage} />
      <Route path="/admin">
        <AdminGuard>
          <AdminPage />
        </AdminGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <Router />
            </div>
            <footer className="border-t py-6">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} JiranTetangga. All rights reserved.</p>
              </div>
            </footer>
          </div>
          <Toaster />
          <AccessibilityMenu />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
