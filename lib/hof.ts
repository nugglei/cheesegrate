import type { Run } from "./types"

import { getAPEntries } from "./ap"
import { getTotalTimeEntries } from "./totalTime"
import { getWRCountEntries } from "./wrCount"
import { formatTime } from "./utils"

export type HoFStat = "ap" | "wr" | "total"

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
export const hofStatOptions = [
  { value: "ap", label: "AP" },
  { value: "wr", label: "WR Count" },
  { value: "total", label: "Total Time" },
]

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

  if (stat === "ap") {
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

  return "Total"
}

export function formatHoFRank(
  index: number,
  stat: HoFStat
) {
  if (stat === "ap" && index === 0) {
    return "Champion"
  }

  return index + 1
}