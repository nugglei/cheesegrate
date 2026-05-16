"use client"

import { useState } from "react"
import Link from "next/link"
import { maps } from "../lib/maps"

function mapToUrl(map: string) {
  return map.toLowerCase().replaceAll(" ", "-")
}

export default function MapSearch() {
  const [search, setSearch] = useState("")

const filteredMaps = maps
  .filter((map) =>
    map.toLowerCase().includes(search.toLowerCase())
  )
  .slice(0, 5)

  return (
    <div className="max-w-md">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search maps..."
        className="w-full border rounded-lg px-4 py-2"
      />

      {search.length > 0 && (
        <div className="flex flex-col mt-3">
          {filteredMaps.map((map) => (
            <Link
              key={map}
              href={`/lb/${mapToUrl(map)}`}
              className="border rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              {map}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
