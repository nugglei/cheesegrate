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
    id:
      run.id ??
      `${run.player}-${run.map}-${run.category}-${run.time}-${run.date}-${run.proof}`,
    player: run.player,
    map: run.map,
    category: run.category,
    time: String(run.time),
    proof: run.proof ?? "",
    date: run.date ?? "",
    tag: run.tag ?? "",
  }))

  console.log(
    "Nugglei Heights 16.7 after loadRuns:",
    cachedRuns.filter(
      (run) =>
        run.player.trim() === "Nugglei" &&
        run.map.trim() === "Heights" &&
        Number(run.time) === 16.7
    )
  )

  return cachedRuns
}