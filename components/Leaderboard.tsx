import type { ReactNode } from "react"

import type { Run } from "../lib/types"
import { formatDate, formatTime } from "../lib/utils"
import LeaderboardRow from "./LeaderboardRow"

type TimeMarker = {
  id: string
  time: number
  content: ReactNode
}

type Props = {
  runs: Run[]
  category: string
  timeMarkers?: TimeMarker[]
}

export default function Leaderboard({ runs, category, timeMarkers = [] }: Props) {
  const sortedMarkers = [...timeMarkers].sort((a, b) => a.time - b.time)

  const usedMarkerIds = new Set<string>()

  function getMarkersBeforeRun(index: number) {
    const currentTime = Number(runs[index].time)
    const previousRun = runs[index - 1]
    const previousTime = previousRun ? Number(previousRun.time) : null

    return sortedMarkers.filter((marker) => {
      if (usedMarkerIds.has(marker.id)) return false

      if (previousTime === null) {
        return marker.time < currentTime
      }

      return marker.time >= previousTime && marker.time < currentTime
    })
  }

  function getMarkersAfterLastRun(index: number) {
    if (index !== runs.length - 1) return []

    const currentTime = Number(runs[index].time)

    return sortedMarkers.filter((marker) => {
      if (usedMarkerIds.has(marker.id)) return false
      return marker.time >= currentTime
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {runs.map((run, index) => {
        const previousRun = runs[index - 1]

        const rank =
          previousRun && Number(previousRun.time) === Number(run.time)
            ? runs.findIndex(
                (otherRun) => Number(otherRun.time) === Number(run.time)
              ) + 1
            : index + 1

        const timeText =
          category === "Swift"
            ? Number(run.time).toFixed(3)
            : formatTime(run.time, category)

        const markersBeforeRun = getMarkersBeforeRun(index)
        const markersAfterLastRun = getMarkersAfterLastRun(index)

        markersBeforeRun.forEach((marker) => usedMarkerIds.add(marker.id))
        markersAfterLastRun.forEach((marker) => usedMarkerIds.add(marker.id))

        return (
          <div
            key={`${run.player}-${run.time}-${index}`}
            className="flex w-fit flex-col gap-2"
          >
            {markersBeforeRun.map((marker) => (
              <div key={marker.id}>{marker.content}</div>
            ))}

            <LeaderboardRow
              rank={rank}
              player={run.player}
              time={timeText}
              proof={run.proof}
              date={formatDate(run.date)}
              tag={run.tag}
            />

            {markersAfterLastRun.map((marker) => (
              <div key={marker.id}>{marker.content}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}