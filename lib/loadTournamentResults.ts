import { getTournamentResultsFromSupabase } from "./supabase/tournamentResults"

import type { TournamentResult } from "./types"

let cachedTournamentResults: TournamentResult[] | null = null

export async function loadTournamentResults() {
  if (cachedTournamentResults) {
    return cachedTournamentResults
  }

  const results = await getTournamentResultsFromSupabase()

  console.log(
    "Supabase tournament results loaded:",
    results.length,
    results.slice(0, 3)
  )

  cachedTournamentResults = results.map((result) => ({
    matchId: result.match_id,
    map: result.map ?? "",
    format: result.format ?? "",
    seed: result.seed ?? "",
    player: result.player,
    opponent: result.opponent ?? "",
    run1: result.run1 ?? "",
    run1category: result.run1category ?? "",
    run2: result.run2 ?? "",
    run2category: result.run2category ?? "",
    run3: result.run3 ?? "",
    run3category: result.run3category ?? "",
    run4: result.run4 ?? "",
    run4category: result.run4category ?? "",
    run5: result.run5 ?? "",
    run5category: result.run5category ?? "",
    run6: result.run6 ?? "",
    run6category: result.run6category ?? "",
    run7: result.run7 ?? "",
    run7category: result.run7category ?? "",
    run8: result.run8 ?? "",
    run8category: result.run8category ?? "",
    run9: result.run9 ?? "",
    run9category: result.run9category ?? "",
    run10: result.run10 ?? "",
    run10category: result.run10category ?? "",
    average: result.average ?? "",
    best: result.best ?? "",
    result: result.result ?? "",
  }))

  return cachedTournamentResults
}