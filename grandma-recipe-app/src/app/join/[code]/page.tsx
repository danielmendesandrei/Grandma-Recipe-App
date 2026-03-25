import { createClient } from "@/src/lib/supabase/server";
import { JoinGroupClient } from "./JoinGroupClient";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up group name for display
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("invite_code", code)
    .maybeSingle();

  return (
    <JoinGroupClient
      inviteCode={code}
      groupName={(group as any)?.name ?? null}
    />
  );
}
