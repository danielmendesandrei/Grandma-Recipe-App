import { createClient } from "@/src/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { GroupDetailClient } from "./GroupDetailClient";
import type { GroupRole } from "@/src/lib/types/database";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !group) notFound();

  // Check membership
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!myMembership) notFound(); // Not a member

  // Fetch all members with profiles
  const { data: memberships } = await supabase
    .from("group_members")
    .select("user_id, role, profiles ( display_name, avatar_url )")
    .eq("group_id", id);

  const members = (memberships ?? []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role as GroupRole,
    profile: m.profiles ?? { display_name: "Unknown", avatar_url: null },
  }));

  return (
    <GroupDetailClient
      group={group as any}
      members={members}
      myRole={myMembership.role as GroupRole}
      myUserId={user.id}
    />
  );
}
