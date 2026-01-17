import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Gamepad2,
  LogOut,
  Home,
} from "lucide-react";
import { Button } from "./ui/button";

export default function AdminLayout({ children, onLogout }) {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Quản lý người dùng", href: "/admin/users", icon: Users },
    { name: "Thống kê", href: "/admin/statistics", icon: BarChart3 },
    { name: "Quản lý Game", href: "/admin/games", icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card text-card-foreground border-r border-border shadow-sm flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}

            {/* link to user site in navbar list */}
            <li>
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-foreground hover:bg-muted"
              >
                <Home className="w-5 h-5" />
                <span>Người dùng</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full flex items-center gap-2 border-border"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 bg-background">{children}</main>
    </div>
  );
}