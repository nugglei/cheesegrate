import { createClient } from "@/lib/supabase/client"

type PlayerRow = Record<string, string | null>

async function getPlayersFromTable(table: string, column: string) {
  const supabase = createClient()
  const allRows: PlayerRow[] = []
  const batchSize = 1000

  let from = 0
  let hasMoreRows = true

  while (hasMoreRows) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .range(from, from + batchSize - 1)

    if (error || !data) {
      console.error(`Failed to load players from ${table}.${column}`, error)
      break
    }

    allRows.push(...(data as unknown as PlayerRow[]))

    hasMoreRows = data.length === batchSize
    from += batchSize
  }

  return allRows
    .map((row) => row[column])
    .filter((player): player is string => Boolean(player?.trim()))
    .map((player) => player.trim())
}

export async function getKnownPlayerNames() {
  const [runPlayers, tournamentPlayers, accountPlayers] = await Promise.all([
    getPlayersFromTable("runs", "player"),
    getPlayersFromTable("tournament_results", "player"),
    getPlayersFromTable("profiles", "player_name"),
  ])

  console.log({
    runPlayers,
    tournamentPlayers,
    accountPlayers,
  })

  return Array.from(
    new Set([...runPlayers, ...tournamentPlayers, ...accountPlayers])
  ).sort((a, b) => a.localeCompare(b))
}