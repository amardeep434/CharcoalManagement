import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame, ChartLine, ShoppingCart, CreditCard, Building, FileText, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const navItems = [
  { path: "/", label: "Dashboard", icon: ChartLine },
  { path: "/sales", label: "Sales Records", icon: ShoppingCart },
  { path: "/payments", label: "Payments", icon: CreditCard },
  { path: "/hotels", label: "Hotel Management", icon: Building },
  { path: "/statements", label: "Statements", icon: FileText },
  { path: "/import", label: "Import Data", icon: Upload },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      // Remove user data from cache and invalidate auth queries
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed", 
        description: "There was an error logging out",
        variant: "destructive",
      });
    },
  });

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Flame className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CharcoalBiz</h1>
            <p className="text-sm text-gray-500">Sales Management</p>
          </div>
        </div>
        {user && (
          <div className="mt-4 text-sm text-gray-600">
            Welcome, {user.firstName || user.username}
            <div className="text-xs text-gray-500">{user.role}</div>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "sidebar-nav-active" : "sidebar-nav-inactive"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={() => logoutMutation.mutate()}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4" />
          <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
        </Button>
      </div>
    </aside>
  );
}
