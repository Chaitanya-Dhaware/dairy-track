"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, BarChart3, Settings, User } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export function BottomNav() {
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-gray-400"}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
