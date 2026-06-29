"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"

import { maps } from "@/lib/maps"
import { slugify } from "@/lib/slug"
import { swiftMaps } from "@/lib/swiftMaps"

function getMapsForGame(game: string) {
  if (game === "swift") {
    return swiftMaps.map((map) => map.name)
  }

  return maps
}

function getGameLabel(game: string) {
  if (game === "swift") {
    return "Swift"
  }

  if (game === "sr") {
    return "Speed Race"
  }

  return "Map"
}

export default function MapDirectoryPage() {
  const params = useParams<{ game: string }>()
  const game = params.game

  const [search, setSearch] = useState("")

  const gameMaps = useMemo(() => getMapsForGame(game), [game])
  const gameLabel = getGameLabel(game)

  const filteredMaps = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    if (!searchValue) {
      return gameMaps
    }

    return gameMaps.filter((map) => map.toLowerCase().includes(searchValue))
  }, [gameMaps, search])

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <h1 className="mb-6 text-3xl font-bold">{gameLabel} Map Directory</h1>

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search maps..."
        className="mb-6 w-full max-w-md rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
      />

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {filteredMaps.map((map) => {
          const slug = slugify(map)

          return (
            <Link
              key={map}
              href={`/${game}/lb/${slug}`}
              className="block text-center"
            >
              <Image
                src={`/maps/${slug}.png`}
                alt={map}
                width={500}
                height={300}
                className="mb-2 h-auto w-full"
              />

              <div className="text-sm font-bold">{map}</div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}