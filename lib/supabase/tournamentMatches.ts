import { supabase } from "./runs"

export type TournamentMatchFromSupabase = {
  id: string
  match_id: string
  tournament_name: string
  round: string | null
  division: string | null
  date: string | null
  recording: string | null
  host: string | null
  match_format: string | null
  left_player: string
  left_result: string | null
  right_player: string
  right_result: string | null
  created_at: string
}

export async function getTournamentMatchesFromSupabase(): Promise<
  TournamentMatchFromSupabase[]
> {
  const pageSize = 1000
  let from = 0
  let allMatches: TournamentMatchFromSupabase[] = []

  while (true) {
    const { data, error } = await supabase
      .from("tournament_matches")
      .select(
        "id, match_id, tournament_name, round, division, date, recording, host, match_format, left_player, left_result, right_player, right_result, created_at"
      )
      .order("date", { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error("Failed to fetch tournament matches:", error)
      return allMatches
    }

    if (!data || data.length === 0) {
      break
    }

    allMatches = [...allMatches, ...data]

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return allMatches
}