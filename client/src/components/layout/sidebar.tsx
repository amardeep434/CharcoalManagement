import { Link, useLocation } from "wouter";
import { Flame, ChartLine, ShoppingCart, CreditCard, Building, FileText, Upload, User } from "lucide-react";

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
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">admin@charcoalbiz.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
