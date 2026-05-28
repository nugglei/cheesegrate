import { createClient } from "@supabase/supabase-js"

export type Run = {
  id: string
  player: string
  map: string
  category: string
  time: number
  proof: string | null
  date: string | null
  tag: string | null
  created_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getRunsFromSupabase(): Promise<Run[]> {
  const pageSize = 1000
  let from = 0
  let allRuns: Run[] = []

  while (true) {
    const { data, error } = await supabase
      .from("runs")
      .select("id, player, map, category, time, proof, date, tag, created_at")
      .order("time", { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error("Failed to fetch runs:", error)
      return allRuns
    }

    if (!data || data.length === 0) {
      break
    }

    allRuns = [...allRuns, ...data]

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return allRuns
}

export type TournamentResult = {
  id: string
  player: string
  map: string
  match_id: string | null
  flag: string | null
  run1: number | null
  run1category: string | null
  run2: number | null
  run2category: string | null
  run3: number | null
  run3category: string | null
  run4: number | null
  run4category: string | null
  run5: number | null
  run5category: string | null
  run6: number | null
  run6category: string | null
  run7: number | null
  run7category: string | null
  run8: number | null
  run8category: string | null
  run9: number | null
  run9category: string | null
  run10: number | null
  run10category: string | null
}

type TournamentMatch = {
  match_id: string
  date: string | null
  recording: string | null
}

export async function getTournamentRunsFromSupabase(): Promise<Run[]> {
  const pageSize = 1000
  let from = 0
  let allRows: TournamentResult[] = []

  while (true) {
    const { data, error } = await supabase
      .from("tournament_results")
      .select(`
        id,
        player,
        map,
        match_id,
        flag,
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
        run10category
      `)
      .range(from, from + pageSize - 1)

    if (error) {
      console.error("Failed to fetch tournament results:", error)
      return []
    }

    if (!data || data.length === 0) {
      break
    }

    allRows = [...allRows, ...data]

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  const matchIds = Array.from(
    new Set(
      allRows
        .map((row) => row.match_id)
        .filter((matchId): matchId is string => Boolean(matchId?.trim()))
    )
  )

  const { data: matches, error: matchesError } = await supabase
    .from("tournament_matches")
    .select("match_id, date, recording")
    .in("match_id", matchIds)

  if (matchesError) {
    console.error("Failed to fetch tournament matches:", matchesError)
  }

  const matchesById = new Map(
    (matches ?? []).map((match) => [match.match_id, match as TournamentMatch])
  )

  return allRows.flatMap((row) => {
    if (row.flag?.trim()) {
      return []
    }

    const runs: Run[] = []

    for (let i = 1; i <= 10; i++) {
      const time = row[`run${i}` as keyof TournamentResult]
      const category = row[`run${i}category` as keyof TournamentResult]

      const numericTime =
        typeof time === "number"
          ? time
          : typeof time === "string"
          ? Number(time)
          : NaN

      if (!Number.isFinite(numericTime)) continue
      if (typeof category !== "string" || !category.trim()) continue

      const match = row.match_id ? matchesById.get(row.match_id) : null

      runs.push({
        id: `${row.id}-run${i}`,
        player: row.player,
        map: row.map,
        category: category.trim(),
        time: numericTime,
        proof: match?.recording ?? row.match_id,
        date: match?.date ?? "",
        tag: "Tournament",
        created_at: "",
      })
    }

    return runs
  })
}