import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { GroupsClient } from "./GroupsClient";
import type { GroupRole } from "@/src/lib/types/database";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch groups the user belongs to
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return <GroupsClient groups={[]} />;
  }

  const groupIds = (memberships as any[]).map((m: any) => m.group_id);
  const roleMap = new Map((memberships as any[]).map((m: any) => [m.group_id, m.role as GroupRole]));

  const { data: groups } = await supabase
    .from("groups")
    .select("*, group_members ( user_id )")
    .in("id", groupIds)
    .order("name");

  const enriched = (groups ?? []).map((g: any) => ({
    ...g,
    member_count: (g.group_members as unknown[])?.length ?? 0,
    my_role: roleMap.get(g.id) ?? "member" as GroupRole,
  }));

  return <GroupsClient groups={enriched as any} />;
}
