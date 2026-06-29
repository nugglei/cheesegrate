import { getSwiftRowsFromSupabase } from "@/lib/supabase/swiftlbs"
import type {
  SwiftLbRow,
  SwiftLeaderboardEntry,
} from "@/lib/supabase/swiftlbs"
import { formatSwiftTime } from "@/lib/supabase/swiftlbs"
import { swiftMaps } from "./swiftMaps"

export type SwiftLeaderboardByMap = {
  map: string
  dataVer: string
  entries: SwiftLeaderboardEntry[]
}

let cachedSwiftLBs: SwiftLeaderboardByMap[] | null = null

function createEntries(rows: SwiftLbRow[]) {
  return rows
    .sort((a, b) => a.time - b.time)
    .map((row, index) => ({
      rank: index + 1,
      player: row.player,
      timeMs: row.time,
      timeText: formatSwiftTime(row.time),
      updatedAt: row.updated_at ?? null,
    }))
}

export async function loadSwiftLBs() {
  if (cachedSwiftLBs) {
    return cachedSwiftLBs
  }

  const rows = await getSwiftRowsFromSupabase()
  const rowsByDataVer = new Map<string, SwiftLbRow[]>()

  for (const row of rows) {
    const currentRows = rowsByDataVer.get(row.data_ver) ?? []
    currentRows.push(row)
    rowsByDataVer.set(row.data_ver, currentRows)
  }

  cachedSwiftLBs = swiftMaps.map((map) => ({
    map: map.name,
    dataVer: map.dataVer,
    entries: createEntries(rowsByDataVer.get(map.dataVer) ?? []),
  }))

  return cachedSwiftLBs
}