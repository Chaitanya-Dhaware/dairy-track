"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, BarChart3, Settings, User } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", adminOnly: true },
    { href: "/entry", icon: ClipboardList, label: "Entry", adminOnly: false },
    { href: "/reports", icon: BarChart3, label: "Reports", adminOnly: true },
    { href: "/settings", icon: Settings, label: "Settings", adminOnly: true },
    { href: "/profile", icon: User, label: "Profile", adminOnly: false },
  ];

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      <div className="p-6 font-bold text-xl text-primary flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">D</div>
        Dairy Track
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          User: {user.name} <br/>
          Role: <span className="capitalize">{user.role}</span>
        </div>
      )}
    </aside>
  );
}
