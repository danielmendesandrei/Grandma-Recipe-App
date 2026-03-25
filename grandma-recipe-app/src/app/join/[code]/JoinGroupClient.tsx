"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Database } from "@/src/lib/types/database";

interface JoinGroupClientProps {
  inviteCode: string;
  groupName: string | null;
}

export function JoinGroupClient({ inviteCode, groupName }: JoinGroupClientProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // We need a function that imports from the actions module for server-side joining
  // But since this page is outside (main) layout, we handle it differently

  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  async function handleJoin() {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/join/${inviteCode}`);
      return;
    }

    setJoining(true);
    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .eq("invite_code", inviteCode)
        .single();

      if (groupError || !group) {
        toast.error("Invalid invite code");
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast.success("You're already a member!");
        router.push(`/groups/${group.id}`);
        return;
      }

      // Join
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;

      toast.success("Joined group!");
      router.push(`/groups/${group.id}`);
    } catch (err) {
      toast.error("Failed to join group");
    } finally {
      setJoining(false);
    }
  }

  if (!groupName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Invalid invite link.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/")}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center space-y-4">
          <Users className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold">Join Group</h1>
          <p className="text-muted-foreground">
            You&apos;ve been invited to join <strong>{groupName}</strong>
          </p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : (
            <Button onClick={handleJoin} disabled={joining} className="w-full">
              {joining
                ? "Joining..."
                : user
                  ? "Join Group"
                  : "Sign in to Join"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
