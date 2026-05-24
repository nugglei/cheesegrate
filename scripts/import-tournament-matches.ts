import { loadEnvConfig } from "@next/env"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

loadEnvConfig(process.cwd())

type TournamentMatchRow = {
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
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === `"` && nextChar === `"`) {
      current += `"`
      i++
    } else if (char === `"`) {
      insideQuotes = !insideQuotes
    } else if (char === "," && !insideQuotes) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }

  values.push(current)

  return values.map((value) => value.trim())
}

function emptyToNull(value: string | undefined) {
  return value?.trim() ? value.trim() : null
}

function parseTournamentMatchesCsv(csvText: string): TournamentMatchRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const rows = lines.slice(1)

  return rows.map((line) => {
    const [
      matchId,
      tournamentName,
      round,
      division,
      date,
      recording,
      host,
      matchFormat,
      leftPlayer,
      leftResult,
      rightPlayer,
      rightResult,
    ] = parseCsvLine(line)

    return {
      match_id: matchId,
      tournament_name: tournamentName,
      round: emptyToNull(round),
      division: emptyToNull(division),
      date: emptyToNull(date),
      recording: emptyToNull(recording),
      host: emptyToNull(host),
      match_format: emptyToNull(matchFormat),
      left_player: leftPlayer,
      left_result: emptyToNull(leftResult),
      right_player: rightPlayer,
      right_result: emptyToNull(rightResult),
    }
  })
}

async function main() {
  const csvPath = path.join(process.cwd(), "public", "tournament-matches.csv")
  const csvText = fs.readFileSync(csvPath, "utf8")
  const matches = parseTournamentMatchesCsv(csvText)

  const validMatches = matches.filter(
    (match) =>
      match.match_id &&
      match.tournament_name &&
      match.left_player &&
      match.right_player
  )

  const { error } = await supabase
    .from("tournament_matches")
    .insert(validMatches)

  if (error) {
    throw error
  }

  console.log(`Imported ${validMatches.length} tournament matches.`)
}

main()