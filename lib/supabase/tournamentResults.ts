import { supabase } from "./runs"

export type TournamentResultFromSupabase = {
  id: string
  match_id: string
  number: number
  map: string | null
  format: string | null
  seed: string | null
  player: string
  opponent: string | null
  run1: string | null
  run1category: string | null
  run2: string | null
  run2category: string | null
  run3: string | null
  run3category: string | null
  run4: string | null
  run4category: string | null
  run5: string | null
  run5category: string | null
  run6: string | null
  run6category: string | null
  run7: string | null
  run7category: string | null
  run8: string | null
  run8category: string | null
  run9: string | null
  run9category: string | null
  run10: string | null
  run10category: string | null
  average: string | null
  best: string | null
  result: string | null
  created_at: string
}

export async function getTournamentResultsFromSupabase(): Promise<
  TournamentResultFromSupabase[]
> {
  const pageSize = 1000
  let from = 0
  let allResults: TournamentResultFromSupabase[] = []

  while (true) {
    const { data, error } = await supabase
      .from("tournament_results")
      .select(
        "id, match_id, number, map, format, seed, player, opponent, run1, run1category, run2, run2category, run3, run3category, run4, run4category, run5, run5category, run6, run6category, run7, run7category, run8, run8category, run9, run9category, run10, run10category, average, best, result, created_at"
      )
      .order("match_id", { ascending: true })
      .order("number", { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error("Failed to fetch tournament results:", error)
      return allResults
    }

    if (!data || data.length === 0) {
      break
    }

    allResults = [...allResults, ...data]

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return allResults
}