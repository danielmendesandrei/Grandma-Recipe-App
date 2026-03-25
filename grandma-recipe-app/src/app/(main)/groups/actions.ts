"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function createGroupAction(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const inviteCode = generateInviteCode();

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      created_by: user.id,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Add creator as admin
  await supabase.from("group_members").insert({
    group_id: (group as any).id,
    user_id: user.id,
    role: "admin",
  });

  revalidatePath("/groups");
  return (group as any).id;
}

export async function joinGroupAction(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode.trim())
    .single();

  if (groupError || !group) throw new Error("Invalid invite code");

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", (group as any).id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) throw new Error("You are already a member of this group");

  const { error } = await supabase.from("group_members").insert({
    group_id: (group as any).id,
    user_id: user.id,
    role: "member",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/groups");
  return (group as any).id;
}

export async function leaveGroupAction(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

export async function deleteGroupAction(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify user is admin
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership as any).role !== "admin") {
    throw new Error("Only admins can delete groups");
  }

  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

export async function removeMemberAction(groupId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify current user is admin
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership as any).role !== "admin") {
    throw new Error("Only admins can remove members");
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/groups/${groupId}`);
}
