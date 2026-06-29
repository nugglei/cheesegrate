"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { maps } from "../lib/maps"
import { swiftMaps } from "../lib/swiftMaps"

function mapToUrl(map: string) {
  return map.toLowerCase().trim().replaceAll(" ", "-")
}

function getCurrentGame(pathname: string) {
  if (pathname === "/swift" || pathname.startsWith("/swift/")) {
    return "swift"
  }

  if (pathname === "/sr" || pathname.startsWith("/sr/")) {
    return "sr"
  }

  return "sr"
}

type MapSearchProps = {
  selectedMap?: string
  onSelectMap?: (map: string) => void
}

export default function MapSearch({
  selectedMap = "",
  onSelectMap,
}: MapSearchProps) {
  const pathname = usePathname()
  const currentGame = getCurrentGame(pathname)

  const currentMaps =
    currentGame === "swift"
      ? swiftMaps.map((map) => map.name)
      : maps

  const [search, setSearch] = useState(selectedMap)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setSearch(selectedMap)
  }, [selectedMap])

  const filteredMaps = currentMaps
    .filter((map) => map.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5)

  return (
    <div className={onSelectMap ? "w-full" : "max-w-md"}>
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search maps..."
        className="w-full border rounded-lg px-4 py-2"
      />

      {isOpen && search.length > 0 && (
        <div className="flex flex-col mt-3 gap-2">
          {filteredMaps.map((map) => {
            const mapSlug = mapToUrl(map)

            const content = (
              <>
                <Image
                  src={`/maps/${mapSlug}.png`}
                  alt={map}
                  width={36}
                  height={36}
                  className="rounded object-cover"
                />

                <span>{map}</span>
              </>
            )

            if (onSelectMap) {
              return (
                <button
                  key={map}
                  type="button"
                  onClick={() => {
                    onSelectMap(map)
                    setSearch(map)
                    setIsOpen(false)
                  }}
                  className="border rounded-lg px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-left"
                >
                  {content}
                </button>
              )
            }

            return (
              <Link
                key={map}
                href={`/${currentGame}/lb/${mapSlug}`}
                className="border rounded-lg px-4 py-2 hover:bg-gray-100 flex items-center gap-3"
              >
                {content}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}