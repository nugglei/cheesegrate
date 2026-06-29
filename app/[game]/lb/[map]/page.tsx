"use client"

import { use, useState } from "react"

import CategorySelector from "@/components/CategorySelector"
import Leaderboard from "@/components/Leaderboard"
import MapSearch from "@/components/MapSearch"
import { useRuns } from "@/hooks/useRuns"
import { useSwiftLBs } from "@/hooks/useSwiftLBs"
import { getCategoriesForMap } from "@/lib/categories"
import { getLeaderboardRuns } from "@/lib/leaderboards"
import { swiftMaps } from "@/lib/swiftMaps"
import type { Run } from "@/lib/types"
import { formatMapName } from "@/lib/utils"

export default function MapPage({
  params,
}: {
  params: Promise<{ game: string; map: string }>
}) {
  const { game, map } = use(params)

  const mapName = formatMapName(map)
  const isSwift = game.toLowerCase() === "swift"

  if (isSwift) {
    return <SwiftMapPage mapSlug={map} mapName={mapName} />
  }

  return <SpeedRaceMapPage mapSlug={map} mapName={mapName} />
}

function SpeedRaceMapPage({
  mapSlug,
  mapName,
}: {
  mapSlug: string
  mapName: string
}) {
  const categories = getCategoriesForMap(mapName)
  const [category, setCategory] = useState(categories[0])

  const { runs, loading } = useRuns()

  const filteredRuns = getLeaderboardRuns(
    runs,
    mapName.toLowerCase(),
    category
  )

  return (
    <main className="py-10" style={{ paddingLeft: "130px" }}>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-4xl font-bold">{mapName}</h1>

        <div
          className="shrink-0 overflow-hidden rounded border border-gray-200"
          style={{ width: "56px", height: "56px" }}
        >
          <img
            src={`/maps/${mapSlug}.png`}
            alt={mapName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <p className="mb-6 text-gray-500">{category}</p>

      <div className="mb-6">
        <MapSearch />
      </div>

      <CategorySelector
        categories={categories}
        category={category}
        setCategory={setCategory}
      />

      {loading ? (
        <p className="text-gray-500">Loading runs...</p>
      ) : (
        <Leaderboard runs={filteredRuns} category={category} />
      )}
    </main>
  )
}

function SwiftMapPage({
  mapSlug,
  mapName,
}: {
  mapSlug: string
  mapName: string
}) {
  const { leaderboards, loading } = useSwiftLBs()

  const leaderboard = leaderboards.find(
    (lb) => lb.map.trim().toLowerCase() === mapName.trim().toLowerCase()
  )

  const swiftMap = swiftMaps.find(
    (map) => map.name.trim().toLowerCase() === mapName.trim().toLowerCase()
  )

  const runs: Run[] =
    leaderboard?.entries.map((entry) => {
      const dateOnly = entry.updatedAt ? entry.updatedAt.split("T")[0] : ""

      return {
        id: `${leaderboard.dataVer}-${entry.player}-${entry.timeMs}`,
        player: entry.player,
        map: leaderboard.map,
        category: "Swift",
        time: (entry.timeMs / 1000).toFixed(3),
        proof: "",
        date: dateOnly,
        tag: "",
      }
    }) ?? []

  const timeMarkers =
    swiftMap?.stars == null
      ? []
      : [
          {
            id: "star-1",
            time: swiftMap.stars.one ?? Infinity,
            content: <StarValueBar label="1" value={swiftMap.stars.one} />,
          },
          {
            id: "star-2",
            time: swiftMap.stars.two ?? Infinity,
            content: <StarValueBar label="2" value={swiftMap.stars.two} />,
          },
          {
            id: "star-3",
            time: swiftMap.stars.three ?? Infinity,
            content: <StarValueBar label="3" value={swiftMap.stars.three} />,
          },
        ]

  return (
    <main className="py-10" style={{ paddingLeft: "130px" }}>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-4xl font-bold">{mapName}</h1>

        <div
          className="shrink-0 overflow-hidden rounded border border-gray-200"
          style={{ width: "56px", height: "56px" }}
        >
          <img
            src={`/maps/${mapSlug}.png`}
            alt={mapName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <p className="mb-6 text-gray-500">Swift</p>

      <div className="mb-6">
        <MapSearch />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading Swift leaderboard...</p>
      ) : !leaderboard ? (
        <p className="text-gray-500">No Swift leaderboard found for this map.</p>
      ) : runs.length === 0 ? (
        <p className="text-gray-500">
          Swift leaderboard found for {mapName}, but it has no times yet.
        </p>
      ) : (
        <Leaderboard
          runs={runs}
          category="Swift"
          timeMarkers={timeMarkers}
        />
      )}
    </main>
  )
}

function StarValueBar({
  label,
  value,
}: {
  label: string
  value?: number | null
}) {
  const valueText = value == null ? "xx.xxx" : value.toFixed(3)

  return (
    <div className="relative flex items-center py-2">
      <div className="h-px w-full bg-[#FFAC33]" />

      <div className="absolute left-full ml-2 flex items-center gap-1">
        <img
          src="/star.png"
          alt={`Star ${label}`}
          className="h-5 w-5 shrink-0 object-contain"
        />

        <span className="whitespace-nowrap text-sm font-bold text-[#FFAC33]">
          {label}: {valueText}
        </span>
      </div>
    </div>
  )
}