import type { Run } from "../lib/types"
import { formatDate, formatTime } from "../lib/utils"
import LeaderboardRow from "./LeaderboardRow"

type Props = {
  runs: Run[]
  category: string
}

export default function Leaderboard({
  runs,
  category,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      {runs.map((run, index) => {
        const previousRun = runs[index - 1]

        const rank =
          previousRun &&
          Number(previousRun.time) === Number(run.time)
            ? runs.findIndex(
                (otherRun) =>
                  Number(otherRun.time) === Number(run.time)
              ) + 1
            : index + 1

        return (
          <LeaderboardRow
            key={`${run.player}-${run.time}-${index}`}
            rank={rank}
            player={run.player}
            time={formatTime(run.time, category)}
            proof={run.proof}
            date={formatDate(run.date)}
          />
        )
      })}
    </div>
  )
}