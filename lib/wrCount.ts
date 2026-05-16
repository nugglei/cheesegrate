import type { Run } from "./types"
import type { HoFEntry } from "./hof"

import { getWorldRecordsForCategory } from "./leaderboards"

export function getWRCountEntries(
  runs: Run[],
  category: string
): HoFEntry[] {
  const playerMap = new Map<string, HoFEntry>()
  const wrs = getWorldRecordsForCategory(runs, category)

  wrs.forEach((record) => {
    const uniquePlayers = [...new Set(record.players)]

    uniquePlayers.forEach((player) => {
      const current =
        playerMap.get(player) ??
        {
          player,
          value: 0,
          mapSet: new Set<string>(),
          records: [],
        }

      if (!current.mapSet.has(record.map)) {
        current.mapSet.add(record.map)
        current.value = current.mapSet.size

        current.records.push({
          map: record.map,
          time: record.time,
        })
      }

      playerMap.set(player, current)
    })
  })

  return [...playerMap.values()].sort(
    (a, b) => b.value - a.value || a.player.localeCompare(b.player)
  )
}