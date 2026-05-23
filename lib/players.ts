function parseCsvRows(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const headers = lines[0].split(",").map((header) => header.trim())
  const rows = lines.slice(1)

  return rows.map((row) => {
    const values = row.split(",").map((value) => value.trim())

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    )
  })
}

async function getPlayersFromCsv(path: string) {
  const response = await fetch(path)

  if (!response.ok) {
    return []
  }

  const csvText = await response.text()
  const rows = parseCsvRows(csvText)

  return rows
    .map((row) => row.player)
    .filter((player): player is string => Boolean(player?.trim()))
    .map((player) => player.trim())
}

export async function getKnownPlayerNames() {
  const [runPlayers, tournamentPlayers] = await Promise.all([
    getPlayersFromCsv("/runs.csv"),
    getPlayersFromCsv("/tournament-results.csv"),
  ])

  return Array.from(new Set([...runPlayers, ...tournamentPlayers])).sort(
    (a, b) => a.localeCompare(b)
  )
}