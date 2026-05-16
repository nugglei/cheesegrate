import Papa from "papaparse"

import type { TournamentMatch } from "./types"

let cachedTournamentMatches: TournamentMatch[] | null = null

export async function loadTournamentMatches() {
  if (cachedTournamentMatches) {
    return cachedTournamentMatches
  }

  const response = await fetch("/tournament-matches.csv")
  const text = await response.text()

  const parsed = Papa.parse<TournamentMatch>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
  })

  cachedTournamentMatches = parsed.data

  return cachedTournamentMatches
}