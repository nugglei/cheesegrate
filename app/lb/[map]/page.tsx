"use client"

import { use, useEffect, useState } from "react"
import {
  categoryPresets,
  mapCategoryPresets,
} from "../../../lib/categories"
import {
  formatTime,
  formatDate,
  formatMapName,
  getIncludedCategories,
} from "../../../lib/utils"
import type { Run } from "../../../lib/types"
import { useRuns } from "../../../hooks/useRuns"
import Leaderboard from "../../../components/Leaderboard"
import MapSearch from "../../../components/MapSearch"
import { getLeaderboardRuns } from "../../../lib/leaderboards"
import CategorySelector from "../../../components/CategorySelector"
import TagBubble from "./TagBubble"

export default function MapPage({
  params,
}: {
  params: Promise<{ map: string }>
}) {
  const { map } = use(params)

  const mapName = formatMapName(map)

  const preset =
    mapCategoryPresets[map] ?? "skip"

  const categories =
    categoryPresets[preset]

  const [category, setCategory] = useState(
    categories[0]
  )

  const { runs, loading } = useRuns()

{loading && (
  <p className="text-gray-500">
    Loading runs...
  </p>
)}

const filteredRuns = getLeaderboardRuns(
  runs,
  mapName,
  category
)

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-2">
        {mapName}
      </h1>

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

<Leaderboard
  runs={filteredRuns}
  category={category}
/>
    </main>
  )
}