"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"
import { createClient } from "@/lib/supabase/client"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/lb", label: "Map LBs" },
  { href: "/wrs", label: "WRs" },
  { href: "/hof", label: "Hall of Fame" },
  { href: "/player", label: "Players" },
  { href: "/tournament", label: "Tournaments" },
  { href: "/submit", label: "Submit Run" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  const loadAccount = useCallback(async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setPlayerName(null)
      setProfilePictureUrl(null)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("player_name, profile_picture_url")
      .eq("id", user.id)
      .single()

    setPlayerName(profile?.player_name || null)
    setProfilePictureUrl(profile?.profile_picture_url || null)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    loadAccount()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAccount()
    })

    window.addEventListener("profile-updated", loadAccount)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("profile-updated", loadAccount)
    }
  }, [loadAccount, pathname])

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
          style={{ marginLeft: "200px" }}
        >
          {navLinks.map((link) => (
  <Link
    key={link.href}
    href={link.href}
    className={
      link.href === "/submit"
        ? "rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15"
        : "text-sm font-medium text-zinc-300 hover:text-white"
    }
  >
    {link.label}
  </Link>
))}

<div style={{ marginLeft: "24px" }}>
          {playerName ? (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15"
            >
              <PlayerProfilePicture
                player={playerName}
                src={profilePictureUrl ?? undefined}
                size={24}
              />

              <span>{playerName}</span>
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
        </div>
      </nav>
    </header>
  )
}