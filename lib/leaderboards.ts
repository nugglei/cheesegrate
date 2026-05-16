import type { Run } from "./types"
import { getIncludedCategories } from "./utils"
import { maps } from "./maps"

export function getLeaderboardRuns(
  runs: Run[],
  mapName: string,
  category: string
) {
  const includedCategories = getIncludedCategories(category)

  return Object.values(
    runs
      .filter((run) => run.map.trim() === mapName)
      .filter((run) =>
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

        return bestRuns
      }, {})
  ).sort((a, b) => {
    const timeDiff = Number(a.time) - Number(b.time)

    if (timeDiff !== 0) {
      return timeDiff
    }

    return Number(a.date) - Number(b.date)
  })
}

export function getWorldRecords(runs: Run[]) {
  const wrs = new Map<string, Run>()

  for (const run of runs) {
    const key = `${run.map.trim()}-${run.category.trim()}`
    const time = Number(run.time)

    const currentWR = wrs.get(key)

    if (!currentWR || time < Number(currentWR.time)) {
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
  const fallbackCategories: Record<string, string[]> = {
    "Skip IGT": ["Skip IGT", "Skipless IGT"],
    "Skip EGT": ["Skip EGT", "Skipless EGT"],
    "R15 Skip": ["R15 Skip", "R15 Skipless"],
    "R6 Skip": ["R6 Skip", "R6 Skipless"],
  }

  const categoriesToTry =
    fallbackCategories[category] ?? [category]

  return maps
    .map((map) => {
      for (const cat of categoriesToTry) {
        const matchingRuns = runs
          .filter(
            (run) =>
              run.map.trim() === map &&
              run.category.trim() === cat
          )
          .sort((a, b) => {
            const timeDiff =
              Number(a.time) - Number(b.time)

            if (timeDiff !== 0) {
              return timeDiff
            }

            return Number(a.date) - Number(b.date)
          })

        if (matchingRuns.length > 0) {
          const bestTime = Number(
            matchingRuns[0].time
          )

          const tiedRuns =
            matchingRuns.filter(
              (run) =>
                Number(run.time) === bestTime
            )

          return {
            map,
            category: cat,
            time: matchingRuns[0].time,
            players: tiedRuns.map((run) =>
              run.player.trim()
            ),
            proofs: tiedRuns.map((run) =>
              run.proof.trim()
            ),
          }
        }
      }

      return null
    })
    .filter(
      (
        record
      ): record is {
        map: string
        category: string
        time: string
        players: string[]
        proofs: string[]
      } => record !== null
    )
}