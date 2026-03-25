"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, CalendarDays, ShoppingCart, Settings } from "lucide-react";
import { cn } from "@/src/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/meal-plan", label: "Meal Plan", icon: CalendarDays },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
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
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors min-w-[3rem]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
