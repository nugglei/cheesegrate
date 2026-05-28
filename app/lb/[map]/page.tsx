"use client"

import { use, useState } from "react"
import { getCategoriesForMap } from "../../../lib/categories"
import { formatMapName } from "../../../lib/utils"
import { useRuns } from "../../../hooks/useRuns"
import Leaderboard from "../../../components/Leaderboard"
import MapSearch from "../../../components/MapSearch"
import { getLeaderboardRuns } from "../../../lib/leaderboards"
import CategorySelector from "../../../components/CategorySelector"

export default function MapPage({
  params,
}: {
  params: Promise<{ map: string }>
}) {
  const { map } = use(params)

  const mapName = formatMapName(map)

  const categories = getCategoriesForMap(mapName)

  const [category, setCategory] = useState(
    categories[0]
  )

  const { runs, loading } = useRuns()

  const filteredRuns = getLeaderboardRuns(
  runs,
  mapName.toLowerCase(),
  category
)

  return (
<main
  className="py-10"
  style={{ paddingLeft: "130px" }}
>
<div className="flex items-center gap-3 mb-6">
  <h1 className="text-4xl font-bold">
    {mapName}
  </h1>

  <div
    className="overflow-hidden rounded border border-gray-200 shrink-0"
    style={{ width: "56px", height: "56px" }}
  >
    <img
      src={`/maps/${map}.png`}
      alt={mapName}
      className="h-full w-full object-cover"
    />
  </div>
</div>

<p className="mb-6 text-gray-500">
  {category}
</p>

      <div className="mb-6">
        <MapSearch />
      </div>

      <CategorySelector
        categories={categories}
        category={category}
        setCategory={setCategory}
      />

      {loading ? (
        <p className="text-gray-500">
          Loading runs...
        </p>
      ) : (
        <Leaderboard
          runs={filteredRuns}
          category={category}
        />
      )}
    </main>
  )
}