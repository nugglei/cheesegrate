import type { Run } from "./types"

import { getAPEntries } from "./ap"
import { getMapsForCategory } from "./categoryMaps"
import { getPlacedLeaderboardRuns } from "./placements"
import { getTotalTimeEntries } from "./totalTime"
import { getWRCountEntries } from "./wrCount"
import { formatTime } from "./utils"

export type HoFStat = "ap" | "wr" | "aap" | "total"

export type HoFEntry = {
  player: string
  value: number
  mapSet: Set<string>
  records: {
    map: string
    time: string
    placement?: number
  }[]
}

export const hofStatOptions: { value: HoFStat; label: string }[] = [
  { value: "ap", label: "AP" },
  { value: "wr", label: "WR Count" },
  { value: "aap", label: "AAP" },
  { value: "total", label: "Total Time" },
]

function getAAPEntries(runs: Run[], category: string): HoFEntry[] {
  const categoryMaps = getMapsForCategory(category)
  const totalMaps = categoryMaps.length
  const playerMap = new Map<string, HoFEntry>()

  categoryMaps.forEach((map) => {
    const leaderboard = getPlacedLeaderboardRuns(runs, map, category)

    leaderboard.forEach(({ run, placement }) => {
      const player = run.player.trim()

      const current = playerMap.get(player) ?? {
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
    })
  })

  return [...playerMap.values()]
    .filter((entry) => entry.mapSet.size > 0)
    .map((entry) => {
      const mapsSubmitted = entry.mapSet.size

      const totalPlacement = entry.records.reduce(
        (sum, record) => sum + (record.placement ?? 0),
        0
      )

      const ap = totalPlacement / mapsSubmitted
      const aap = (ap * totalMaps) / mapsSubmitted

      return {
        ...entry,
        value: aap,
      }
    })
    .sort((a, b) => a.value - b.value || a.player.localeCompare(b.player))
}

export function getHoFEntries(
  runs: Run[],
  category: string,
  stat: HoFStat
): HoFEntry[] {
  if (stat === "wr") {
    return getWRCountEntries(runs, category)
  }

  if (stat === "ap") {
    return getAPEntries(runs, category)
  }

  if (stat === "aap") {
    return getAAPEntries(runs, category)
  }

  return getTotalTimeEntries(runs, category)
}

export function formatHoFValue(
  value: number,
  category: string,
  stat: HoFStat
) {
  if (stat === "wr") {
    return String(value)
  }

  if (stat === "ap" || stat === "aap") {
    return value.toFixed(3)
  }

  return formatTime(String(value), category)
}

export function getHoFValueLabel(stat: HoFStat) {
  if (stat === "wr") {
    return "WRs"
  }

  if (stat === "ap") {
    return "AP"
  }

  if (stat === "aap") {
    return "AAP"
  }

  return "Total"
}

export function formatHoFRank(rank: number, stat: HoFStat) {
  if (stat === "ap" && rank === 1) {
    return "Champion"
  }

  return rank
}
