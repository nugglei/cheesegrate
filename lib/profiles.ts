import type { SupabaseClient } from "@supabase/supabase-js"

export type UserProfile = {
  player_name: string | null
  role: string | null
}

export async function getProfileByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("player_name, role")
    .eq("id", userId)
    .single()

  if (error) {
    return null
  }

  return profile
}