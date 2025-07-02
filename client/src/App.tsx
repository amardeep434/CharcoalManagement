import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/login-form";
import Dashboard from "@/pages/dashboard";
import Sales from "@/pages/sales";
import Payments from "@/pages/payments";
import Hotels from "@/pages/hotels";
import Statements from "@/pages/statements";
import Import from "@/pages/import";
import Users from "@/pages/users";
import AuditLogs from "@/pages/audit-logs";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/sales" component={Sales} />
          <Route path="/payments" component={Payments} />
          <Route path="/hotels" component={Hotels} />
          <Route path="/statements" component={Statements} />
          <Route path="/import" component={Import} />
          <Route path="/users" component={Users} />
          <Route path="/audit-logs" component={AuditLogs} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
