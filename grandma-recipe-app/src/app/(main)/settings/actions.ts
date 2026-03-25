"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UnitPreference } from "@/src/lib/types/database";

export async function updateProfileAction(input: {
  displayName: string;
  preferredUnits: UnitPreference;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim(),
      preferred_units: input.preferredUnits,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
