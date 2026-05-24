import { getTournamentMatchesFromSupabase } from "./supabase/tournamentMatches"

import type { TournamentMatch } from "./types"

let cachedTournamentMatches: TournamentMatch[] | null = null

export async function loadTournamentMatches() {
  if (cachedTournamentMatches) {
    return cachedTournamentMatches
  }

  const matches = await getTournamentMatchesFromSupabase()

  console.log(
    "Supabase tournament matches loaded:",
    matches.length,
    matches.slice(0, 3)
  )

  cachedTournamentMatches = matches.map((match) => ({
    matchId: match.match_id,
    tournamentName: match.tournament_name,
    round: match.round ?? "",
    division: match.division ?? "",
    date: match.date ?? "",
    recording: match.recording ?? "",
    host: match.host ?? "",
    matchFormat: match.match_format ?? "",
    leftPlayer: match.left_player,
    leftResult: match.left_result ?? "",
    rightPlayer: match.right_player,
    rightResult: match.right_result ?? "",
  }))

  return cachedTournamentMatches
}