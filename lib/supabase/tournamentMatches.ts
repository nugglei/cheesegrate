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
  left_score: number | null
  right_player: string
  right_result: string | null
  right_score: number | null
  created_at: string
}

function normalizeTournamentRound(round: string | null) {
  const value = String(round ?? "").trim()

  if (!value) return null

  const lower = value.toLowerCase()

  if (lower.startsWith("round ")) {
    return value
  }

  if (lower.startsWith("losers ")) {
    return `Losers Round ${value.slice("losers ".length).trim()}`
  }

  if (
    lower === "finals" ||
    lower === "grand finals" ||
    lower === "group stage" ||
    lower === "3rd place" ||
    lower === "qualifiers"
  ) {
    return value
  }

  return `Round ${value}`
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
        "id, match_id, tournament_name, round, division, date, recording, host, match_format, left_player, left_result, left_score, right_player, right_result, right_score, created_at"
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

    const normalizedData = data.map((match) => ({
      ...match,
      round: normalizeTournamentRound(match.round),
    }))

    allMatches = [...allMatches, ...normalizedData]

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return allMatches
}