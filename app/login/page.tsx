"use client"

import Link from "next/link"
import { useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { signInWithDiscord } from "@/lib/auth-client"
import DiscordAuthButton from "@/components/DiscordAuthButton"

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), [])

  async function handleDiscordLogin() {
    const { error } = await signInWithDiscord(supabase)

    if (error) {
      console.error(error.message)
    }
  }

  return (
    <main
      style={{
        maxWidth: "420px",
        margin: "80px auto 0",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "16px" }}>
        Log in
      </h1>

      <p style={{ marginBottom: "20px", opacity: 0.8 }}>
        Sign in with Discord to access your Cheesegrate account.
      </p>

      <DiscordAuthButton onClick={handleDiscordLogin} />

      <Link
        href="/signup"
        style={{
          marginTop: "16px",
          fontSize: "14px",
          color: "#d4d4d8",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        Sign up for Cheesegrate
      </Link>
    </main>
  )
}