"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { ChefHat, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Grandma&apos;s Recipes</span>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
