"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useRuns } from "@/hooks/useRuns"
import { slugify } from "@/lib/slug"

export default function PlayerProfilePage() {
  const params = useParams()
  const { runs, loading } = useRuns()

const playerSlug = String(params.player ?? "")

  const playerName = useMemo(() => {
    const matchingRun = runs.find(
  (run) => slugify(run.player) === playerSlug
)

    return matchingRun?.player ?? decodeURIComponent(String(params.player ?? ""))
  }, [runs, playerSlug, params.player])

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p>Loading player...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-3xl font-bold">{playerName}</h1>
    </main>
  )
}