"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { maps } from "@/lib/maps"
import { slugify } from "@/lib/slug"

export default function MapDirectoryPage() {
  const [search, setSearch] = useState("")

  const filteredMaps = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    if (!searchValue) {
      return maps
    }

    return maps.filter((map) =>
      map.toLowerCase().includes(searchValue)
    )
  }, [search])

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        Map Directory
      </h1>

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
              href={`/lb/${slug}`}
              className="block text-center"
            >
              <Image
                src={`/maps/${slug}.png`}
                alt={map}
                width={500}
                height={300}
                className="mb-2 h-auto w-full"
              />

              <div className="text-sm font-bold">
                {map}
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}