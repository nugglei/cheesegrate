import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

type RunRow = {
  player: string
  map: string
  category: string
  time: number
  proof: string | null
  date: string | null
  tag: string | null
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

function parseRunsCsv(csvText: string): RunRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const rows = lines.slice(1)

  return rows.map((line) => {
    const [player, map, category, time, proof, date, tag] = parseCsvLine(line)

    return {
      player,
      map,
      category,
      time: Number(time),
      proof: proof || null,
      date: date || null,
      tag: tag || null,
    }
  })
}

async function main() {
  const csvPath = path.join(process.cwd(), "public", "runs.csv")
  const csvText = fs.readFileSync(csvPath, "utf8")
  const runs = parseRunsCsv(csvText)

  const validRuns = runs.filter(
    (run) =>
      run.player &&
      run.map &&
      run.category &&
      Number.isFinite(run.time)
  )

  const { error } = await supabase.from("runs").insert(validRuns)

  if (error) {
    throw error
  }

  console.log(`Imported ${validRuns.length} runs.`)
}

main()