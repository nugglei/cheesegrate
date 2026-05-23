"use client"

import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const supabase = createClient()

  async function handleDiscordLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

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

    <button
      onClick={handleDiscordLogin}
      type="button"
      style={{
        width: "230px",
        minHeight: "64px",
        border: "1px solid #ffffff33",
        background: "#ffffff12",
        padding: "12px 24px",
        borderRadius: "14px",
        cursor: "pointer",
        boxShadow: "0 8px 24px #00000033",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src="/dc.png"
        alt="Continue with Discord"
        width={180}
        height={40}
        style={{
          width: "180px",
          height: "auto",
          borderRadius: "8px",
          display: "block",
        }}
        priority
      />
    </button>

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