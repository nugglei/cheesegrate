import type { Run } from "./types"
import { getIncludedCategories } from "./utils"
import { maps } from "./maps"

function parseRunDate(value: string) {
  if (!value) {
    return Infinity
  }

  if (!isNaN(Number(value))) {
    const excelEpoch = new Date(1899, 11, 30)

    return new Date(
      excelEpoch.getTime() +
        Number(value) * 24 * 60 * 60 * 1000
    ).getTime()
  }

  const parsed = new Date(value).getTime()

  return isNaN(parsed) ? Infinity : parsed
}

export function getLeaderboardRuns(
  runs: Run[],
  mapName: string,
  category: string
) {
  const includedCategories = getIncludedCategories(category)

  return Object.values(
    runs
      .filter(
        (run) =>
          typeof run?.map === "string" &&
          run.map.trim() === mapName
      )
      .filter(
        (run) =>
          typeof run?.category === "string" &&
          includedCategories.includes(run.category.trim())
      )
      .reduce<Record<string, Run>>((bestRuns, run) => {
        const player = run.player.trim()
        const time = Number(run.time)

        if (!bestRuns[player]) {
          bestRuns[player] = run
          return bestRuns
        }

        const currentBestTime = Number(bestRuns[player].time)

        if (time < currentBestTime) {
          bestRuns[player] = run
        }

        if (
          time === currentBestTime &&
          parseRunDate(run.date) < parseRunDate(bestRuns[player].date)
        ) {
          bestRuns[player] = run
        }

        return bestRuns
      }, {})
  ).sort((a, b) => {
    const timeDiff = Number(a.time) - Number(b.time)

    if (timeDiff !== 0) {
      return timeDiff
    }

    return parseRunDate(a.date) - parseRunDate(b.date)
  })
}

export function getWorldRecords(runs: Run[]) {
  const wrs = new Map<string, Run>()

  for (const run of runs) {
    if (
      typeof run?.map !== "string" ||
      typeof run?.category !== "string"
    ) {
      continue
    }

    const key = `${run.map.trim()}-${run.category.trim()}`
    const time = Number(run.time)

    const currentWR = wrs.get(key)

    if (!currentWR || time < Number(currentWR.time)) {
      wrs.set(key, run)
    }

    if (
      currentWR &&
      time === Number(currentWR.time) &&
      parseRunDate(run.date) < parseRunDate(currentWR.date)
    ) {
      wrs.set(key, run)
    }
  }

  return Array.from(wrs.values()).sort((a, b) => {
    const mapA = a.map.trim()
    const mapB = b.map.trim()

    const mapIndexA = maps.findIndex(
      (map) => map.toLowerCase() === mapA.toLowerCase()
    )

    const mapIndexB = maps.findIndex(
      (map) => map.toLowerCase() === mapB.toLowerCase()
    )

    return mapIndexA - mapIndexB
  })
}

export function getWorldRecordsForCategory(
  runs: Run[],
  category: string
) {
  const includedCategories = getIncludedCategories(category)

  return maps
    .map((map) => {
      const matchingRuns = runs
        .filter(
          (run) =>
            typeof run?.map === "string" &&
            typeof run?.category === "string" &&
            run.map.trim() === map &&
            includedCategories.includes(run.category.trim())
        )
        .sort((a, b) => {
          const timeDiff = Number(a.time) - Number(b.time)

          if (timeDiff !== 0) {
            return timeDiff
          }

          return parseRunDate(a.date) - parseRunDate(b.date)
        })

      if (matchingRuns.length === 0) {
        return null
      }

      const bestTime = Number(matchingRuns[0].time)

      const tiedRuns = matchingRuns.filter(
        (run) => Number(run.time) === bestTime
      )

      return {
  map,
  category: matchingRuns[0].category.trim(),
  time: matchingRuns[0].time,
  date: matchingRuns[0].date,
  players: [...new Set(tiedRuns.map((run) => run.player.trim()))],
  proofs: [...new Set(tiedRuns.map((run) => run.proof.trim()))],
}
    })
    .filter(
      (
        record
      ): record is {
  map: string
  category: string
  time: string
  date: string
  players: string[]
  proofs: string[]
} => record !== null
    )   
}