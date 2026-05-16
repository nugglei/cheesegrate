import Papa from "papaparse"

import type { TournamentResult } from "./types"

let cachedTournamentResults: TournamentResult[] | null = null

export async function loadTournamentResults() {
  if (cachedTournamentResults) {
    return cachedTournamentResults
  }

  const response = await fetch("/tournament-results.csv")
  const text = await response.text()

  const parsed = Papa.parse<TournamentResult>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
  })

  cachedTournamentResults = parsed.data

  return cachedTournamentResults
}