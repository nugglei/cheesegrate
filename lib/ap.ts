import type { Run } from "./types"
import type { HoFEntry } from "./hof"

import { getMapsForCategory } from "./categoryMaps"
import { getPlacedLeaderboardRuns } from "./placements"

export function getAPEntries(
  runs: Run[],
  category: string
): HoFEntry[] {
  const maps = getMapsForCategory(category)

  const playerMap = new Map<string, HoFEntry>()

  maps.forEach((map) => {
    const leaderboard =
      getPlacedLeaderboardRuns(
        runs,
        map,
        category
      )

    leaderboard.forEach(
      ({ run, placement }) => {
        const player = run.player.trim()

        const current =
          playerMap.get(player) ??
          {
            player,
            value: 0,
            mapSet: new Set<string>(),
            records: [],
          }

        if (!current.mapSet.has(map)) {
          current.mapSet.add(map)

          current.records.push({
            map,
            time: run.time,
            placement,
          })
        }

        playerMap.set(player, current)
      }
    )
  })

  return [...playerMap.values()]
    .filter(
      (entry) =>
        entry.mapSet.size === maps.length
    )
    .map((entry) => {
      const totalPlacement =
        entry.records.reduce(
          (sum, record) =>
            sum + (record.placement ?? 0),
          0
        )

      return {
        ...entry,
        value:
          totalPlacement /
          entry.records.length,
      }
    })
    .sort(
      (a, b) =>
        a.value - b.value ||
        a.player.localeCompare(b.player)
    )
}