"use client"

import { useState } from "react"

type PlayerSearchAdvancedProps = {
  value: string
  onChange: (value: string) => void
  players: string[]
}

export default function PlayerSearchAdvanced({
  value,
  onChange,
  players,
}: PlayerSearchAdvancedProps) {
  const [isOpen, setIsOpen] = useState(false)

  const filteredPlayers = players
    .filter((player) => player.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8)

  function selectPlayer(player: string) {
    onChange(player)
    setIsOpen(false)
  }

  return (
    <div className="w-full max-w-md">
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search players..."
        className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
      />

      {isOpen && value.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <button
                key={player}
                type="button"
                onClick={() => selectPlayer(player)}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-left text-sm text-white hover:bg-white/10"
              >
                {player}
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-400">
              No players found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}