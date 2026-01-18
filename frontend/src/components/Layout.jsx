import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Gamepad2,
  User,
  Users,
  MessageSquare,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const { isAdmin, user } = useAuth();

  // fallback check in case useAuth doesn't expose isAdmin but exposes user.role / user.roles
  const showAdmin =
    Boolean(isAdmin) ||
    Boolean(
      user &&
      (user.role === "admin" ||
        (Array.isArray(user.roles) && user.roles.includes("admin"))),
    );

  const baseNavigation = [
    { name: "Trang chủ", href: "/", icon: Home },
    { name: "Trò chơi", href: "/games", icon: Gamepad2 },
    { name: "Hồ sơ", href: "/profile", icon: User },
    { name: "Bạn bè", href: "/friends", icon: Users },
    { name: "Tin nhắn", href: "/messages", icon: MessageSquare },
    { name: "Thành tựu", href: "/achievements", icon: Trophy },
    { name: "Xếp hạng", href: "/ranking", icon: BarChart3 },
  ];

  const navigation = showAdmin
    ? [...baseNavigation, { name: "Admin", href: "/admin", icon: Settings }]
    : baseNavigation;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Board Game
            </span>
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
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
