"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getKnownPlayerNames } from "@/lib/players"
import PlayerSearch from "@/components/PlayerSearch"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"
import { slugify } from "@/lib/slug"

export default function PlayerDirectoryPage() {
  const supabase = createClient()

  const [players, setPlayers] = useState<string[]>([])
  const [profilePictures, setProfilePictures] = useState<Record<string, string>>(
    {}
  )
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadPlayers() {
      const knownPlayers = await getKnownPlayerNames()

      if (!isMounted) return

      setPlayers(knownPlayers)
      setLoading(false)
    }

    loadPlayers()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProfilePictures() {
      if (players.length === 0) {
        setProfilePictures({})
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("player_name, profile_picture_url")
        .in("player_name", players)

      if (!isMounted || error || !data) return

      const nextProfilePictures: Record<string, string> = {}

      data.forEach((profile) => {
        if (profile.player_name && profile.profile_picture_url) {
          nextProfilePictures[profile.player_name] = profile.profile_picture_url
        }
      })

      setProfilePictures(nextProfilePictures)
    }

    loadProfilePictures()

    return () => {
      isMounted = false
    }
  }, [players, supabase])

  const filteredPlayers = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    if (!searchValue) return players

    return players.filter((player) =>
      player.toLowerCase().includes(searchValue)
    )
  }, [players, search])

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="mb-6 text-3xl font-bold">Player Directory</h1>

      <PlayerSearch value={search} onChange={setSearch} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map((player) => (
          <Link
            key={player}
            href={`/player/${slugify(player)}`}
            className="flex items-center gap-3 border border-white/10 p-4 text-lg font-medium hover:border-white/30"
          >
            <PlayerProfilePicture
              player={player}
              src={profilePictures[player]}
              size={44}
            />

            <span>{player}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}