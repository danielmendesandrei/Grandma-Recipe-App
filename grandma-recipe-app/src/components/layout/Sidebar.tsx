"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, CalendarDays, ShoppingCart, Settings, Users, ChefHat } from "lucide-react";
import { cn } from "@/src/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/categories", label: "Categories", icon: ChefHat },
  { href: "/meal-plan", label: "Meal Plan", icon: CalendarDays },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingCart },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex flex-col flex-grow border-r bg-sidebar-background pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center gap-2 px-6 mb-8">
          <ChefHat className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-sidebar-foreground">Grandma&apos;s Recipes</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
