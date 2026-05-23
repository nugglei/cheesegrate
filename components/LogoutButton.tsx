"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()

    router.push("/")
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      type="button"
      style={{
        padding: "8px 12px",
        borderRadius: "10px",
        border: "1px solid #ffffff33",
        background: "#ffffff12",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Log out
    </button>
  )
}