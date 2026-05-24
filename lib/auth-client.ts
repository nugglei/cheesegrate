import type { SupabaseClient } from "@supabase/supabase-js"

export async function signInWithDiscord(
  supabase: SupabaseClient,
  next = "/account"
) {
  return supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
    },
  })
}