import {
  getRunsFromSupabase,
  getTournamentRunsFromSupabase,
} from "@/lib/supabase/runs"
import type { Run } from "./types"

let cachedRuns: Run[] | null = null

export async function loadRuns() {
  if (cachedRuns) {
    return cachedRuns
  }

  const [submittedRuns, tournamentRuns] = await Promise.all([
  getRunsFromSupabase(),
  getTournamentRunsFromSupabase(),
])

const runs = [...submittedRuns, ...tournamentRuns]

  console.log("Supabase runs loaded:", runs.length, runs.slice(0, 3))

  cachedRuns = runs.map((run) => ({
    player: run.player,
    map: run.map,
    category: run.category,
    time: String(run.time),
    proof: run.proof ?? "",
    date: run.date ?? "",
    tag: run.tag ?? "",
  }))

  return cachedRuns
}