import { loadEnvConfig } from "@next/env"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

loadEnvConfig(process.cwd())

type TournamentResultRow = {
  match_id: string
  set: string | null
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

function parseTournamentResultsCsv(csvText: string): TournamentResultRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const rows = lines.slice(1)

  return rows.map((line) => {
    const [
      matchId,
      set,
      map,
      format,
      seed,
      player,
      opponent,
      run1,
      run1category,
      run2,
      run2category,
      run3,
      run3category,
      run4,
      run4category,
      run5,
      run5category,
      run6,
      run6category,
      run7,
      run7category,
      run8,
      run8category,
      run9,
      run9category,
      run10,
      run10category,
      average,
      best,
      result,
    ] = parseCsvLine(line)

    return {
      match_id: matchId,
      set: emptyToNull(set),
      map: emptyToNull(map),
      format: emptyToNull(format),
      seed: emptyToNull(seed),
      player,
      opponent: emptyToNull(opponent),
      run1: emptyToNull(run1),
      run1category: emptyToNull(run1category),
      run2: emptyToNull(run2),
      run2category: emptyToNull(run2category),
      run3: emptyToNull(run3),
      run3category: emptyToNull(run3category),
      run4: emptyToNull(run4),
      run4category: emptyToNull(run4category),
      run5: emptyToNull(run5),
      run5category: emptyToNull(run5category),
      run6: emptyToNull(run6),
      run6category: emptyToNull(run6category),
      run7: emptyToNull(run7),
      run7category: emptyToNull(run7category),
      run8: emptyToNull(run8),
      run8category: emptyToNull(run8category),
      run9: emptyToNull(run9),
      run9category: emptyToNull(run9category),
      run10: emptyToNull(run10),
      run10category: emptyToNull(run10category),
      average: emptyToNull(average),
      best: emptyToNull(best),
      result: emptyToNull(result),
    }
  })
}

async function main() {
  const csvPath = path.join(process.cwd(), "public", "tournament-results.csv")
  const csvText = fs.readFileSync(csvPath, "utf8")
  const results = parseTournamentResultsCsv(csvText)

  const validResults = results.filter(
    (row) => row.match_id && row.player
  )

  const { error } = await supabase
    .from("tournament_results")
    .insert(validResults)

  if (error) {
    throw error
  }

  console.log(`Imported ${validResults.length} tournament results.`)
}

main()