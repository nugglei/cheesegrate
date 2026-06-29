import type { SupabaseClient } from "@supabase/supabase-js"

export type UserProfile = {
  player_name: string | null
  role: string | null
  profile_picture_url: string | null
  bio: string | null
  goal_1: string | null
  goal_2: string | null
  goal_3: string | null
  country_code: string | null
  country_name: string | null
  roblox: string | null
}

export async function getProfileByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "player_name, role, profile_picture_url, bio, goal_1, goal_2, goal_3, country_code, country_name, roblox"
    )
    .eq("id", userId)
    .single()

  if (error) {
    return null
  }

  return profile
}