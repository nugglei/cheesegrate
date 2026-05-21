"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRuns } from "@/hooks/useRuns"
import PlayerSearch from "@/components/PlayerSearch"

function slugifyPlayer(player: string) {
  return encodeURIComponent(player.toLowerCase())
}

export default function PlayerDirectoryPage() {
  const { runs, loading } = useRuns()
  const [search, setSearch] = useState("")

  const players = useMemo(() => {
    const uniquePlayers = Array.from(
      new Set(runs.map((run) => run.player).filter(Boolean))
    )

    return uniquePlayers.sort((a, b) => a.localeCompare(b))
  }, [runs])

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
        <p>Loading players...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="mb-6 text-3xl font-bold">Players</h1>

      <PlayerSearch value={search} onChange={setSearch} />

      <div className="mb-4 text-sm text-zinc-400">
        Showing {filteredPlayers.length} of {players.length} players
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map((player) => (
          <Link
            key={player}
            href={`/player/${slugifyPlayer(player)}`}
            className="border border-white/10 p-4 text-lg font-medium hover:border-white/30"
          >
            {player}
          </Link>
        ))}
      </div>
    </main>
  )
}