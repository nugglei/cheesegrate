import type { Run } from "./types"
import { getLeaderboardRuns } from "./leaderboards"

export type PlacedRun = {
  run: Run
  placement: number
}

export function getPlacedLeaderboardRuns(
  runs: Run[],
  map: string,
  category: string
): PlacedRun[] {
  const leaderboard = getLeaderboardRuns(runs, map, category)

  let currentPlacement = 1

  return leaderboard.map((run, index) => {
    if (
      index > 0 &&
      Number(run.time) !== Number(leaderboard[index - 1].time)
    ) {
      currentPlacement = index + 1
    }

    return {
      run,
      placement: currentPlacement,
    }
  })
}