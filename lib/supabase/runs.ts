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