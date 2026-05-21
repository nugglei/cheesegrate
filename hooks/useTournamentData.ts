"use client"

import { useEffect, useState } from "react"

import { loadTournamentMatches } from "../lib/loadTournamentMatches"
import { loadTournamentResults } from "../lib/loadTournamentResults"
import type { TournamentMatch, TournamentResult } from "../lib/types"

export function useTournamentData() {
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [results, setResults] = useState<TournamentResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTournamentData() {
      const [matchData, resultData] = await Promise.all([
        loadTournamentMatches(),
        loadTournamentResults(),
      ])

      setMatches(matchData ?? [])
      setResults(resultData ?? [])
      setLoading(false)
    }

    fetchTournamentData()
  }, [])

  return {
    matches,
    results,
    loading,
  }
}