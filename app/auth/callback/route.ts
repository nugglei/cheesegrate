import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/account"

  const supabase = await createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("player_name")
    .eq("id", user.id)
    .single()

  const hasLinkedPlayer = Boolean(profile?.player_name?.trim())

  if (!hasLinkedPlayer) {
    return NextResponse.redirect(new URL("/signup", request.url))
  }

  if (next === "/signup") {
    return NextResponse.redirect(new URL("/account", request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}