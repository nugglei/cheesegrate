"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/lb", label: "Map LBs" },
  { href: "/wrs", label: "WRs" },
  { href: "/hof", label: "Hall of Fame" },
  { href: "/player", label: "Players" },
  { href: "/tournament", label: "Tournaments" },
]

export default function Navbar() {
  const supabase = createClient()
  const [playerName, setPlayerName] = useState<string | null>(null)

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setPlayerName(null)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("player_name")
        .eq("id", user.id)
        .single()

      setPlayerName(profile?.player_name || null)
    }

    loadAccount()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAccount()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <header className="border-b border-white/10 bg-black">
      <nav className="mx-auto flex max-w-6xl items-center px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="Cheesegrate icon"
            width={32}
            height={32}
            className="h-8 w-8"
          />

          <div className="text-lg font-bold text-white">Cheesegrate</div>
        </Link>

        <div
  className="flex items-center gap-6"
  style={{ marginLeft: "240px" }}
>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          {playerName ? (
            <Link
              href="/account"
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15"
            >
              {playerName}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}