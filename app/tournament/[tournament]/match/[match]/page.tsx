"use client"

import Link from "next/link"
import { use } from "react"

import TagBubble from "../../../../../components/TagBubble"
import { useTournamentData } from "../../../../../hooks/useTournamentData"
import { slugify } from "../../../../../lib/slug"
import {
  getCategoryTone,
  getDidWin,
  getDisplayCategoryLabel,
  getHasDraw,
  getMatchPlayers,
  getMatchScore,
  getMatchSets,
  getResultLabel,
  getResultTone,
  getRuns,
  getScoreLabel,
  getScoreTone,
  getWinningAverage,
  type MatchPlayer,
  type MatchSet,
  type TournamentMatchResult,
} from "../../../../../lib/tournamentMatch"

function PlayerNameLink({
  player,
  className = "",
}: {
  player: string
  className?: string
}) {
  return (
    <Link href={`/player/${slugify(player)}`} className={className}>
      {player}
    </Link>
  )
}

function MatchMeta({
  division,
  date,
  host,
}: {
  division?: string
  date?: string
  host?: string
}) {
  if (!division && !date && !host) return null

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {(division || date) && (
        <div className="flex flex-wrap justify-center gap-2">
          {division && (
            <TagBubble tone="white" size="md">
              {division}
            </TagBubble>
          )}

          {date && (
            <TagBubble tone="white" size="md">
              {date}
            </TagBubble>
          )}
        </div>
      )}

      {host && (
        <TagBubble tone="blue" size="md">
          Host: {host}
        </TagBubble>
      )}
    </div>
  )
}

function ScoreBubble({
  score,
  opponentScore,
}: {
  score: number
  opponentScore: number
}) {
  return (
    <TagBubble tone={getScoreTone(score, opponentScore)} size="lg">
      <span className="translate-y-[2px]">
        {getScoreLabel(score, opponentScore)}
      </span>
    </TagBubble>
  )
}

function PlayerVsPlayer({
  leftPlayer,
  rightPlayer,
}: {
  leftPlayer: MatchPlayer
  rightPlayer: MatchPlayer
}) {
  return (
    <div
      className="mt-8 grid items-start justify-center text-white"
      style={{
        gridTemplateColumns: "40px 85px 60px 85px 40px",
columnGap: "12px",
      }}
    >
      <div />

      <div className="flex flex-col items-center">
        <PlayerNameLink
          player={leftPlayer.player}
          className="text-3xl font-bold hover:underline"
        />

        <span className="mt-2 text-sm font-medium text-zinc-500">
          {leftPlayer.seed || ""}
        </span>
      </div>

      <div className="flex justify-center" style={{ paddingTop: "10px" }}>
  <span className="text-sm font-bold text-zinc-400">VS</span>
</div>

      <div className="flex flex-col items-center">
        <PlayerNameLink
          player={rightPlayer.player}
          className="text-3xl font-bold hover:underline"
        />

        <span className="mt-2 text-sm font-medium text-zinc-500">
          {rightPlayer.seed || ""}
        </span>
      </div>

      <div />
    </div>
  )
}

function MatchScoreboard({
  leftScore,
  rightScore,
  drawScore,
}: {
  leftScore: number
  rightScore: number
  drawScore: number
}) {
  return (
    <div className="flex flex-col items-center" style={{ marginTop: "10px" }}>
      <div
        className="grid items-center justify-center"
        style={{
          gridTemplateColumns: "40px 85px 60px 85px 40px",
columnGap: "12px",
        }}
      >
        <div className="flex justify-center">
          <ScoreBubble score={leftScore} opponentScore={rightScore} />
        </div>

        <span className="text-center text-5xl font-bold text-white">
          {leftScore}
        </span>

        <span className="text-center text-4xl font-bold text-zinc-500">
          –
        </span>

        <span className="text-center text-5xl font-bold text-white">
          {rightScore}
        </span>

        <div className="flex justify-center">
          <ScoreBubble score={rightScore} opponentScore={leftScore} />
        </div>
      </div>
    </div>
  )
}

function MatchHeader({
  tournament,
  tournamentName,
  round,
  division,
  date,
  host,
  recording,
  leftPlayer,
  rightPlayer,
  leftScore,
  rightScore,
  drawScore,
}: {
  tournament: string
  tournamentName: string
  round?: string
  division?: string
  date?: string
  host?: string
  recording?: string
  leftPlayer?: MatchPlayer
  rightPlayer?: MatchPlayer
  leftScore: number
  rightScore: number
  drawScore: number
}) {
  return (
    <>
      <Link
        href={`/tournament/${tournament}`}
        className="text-sm text-zinc-400 underline"
      >
        Back to {tournamentName}
      </Link>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <h1 className="text-4xl font-bold">
          {tournamentName || "Untitled Tournament"}
        </h1>

        <p className="mt-2 text-zinc-400">{round || "Untitled Match"}</p>

        {leftPlayer && rightPlayer && (
          <>
            <PlayerVsPlayer
              leftPlayer={leftPlayer}
              rightPlayer={rightPlayer}
            />

            <MatchScoreboard
              leftScore={leftScore}
              rightScore={rightScore}
              drawScore={drawScore}
            />
          </>
        )}

        <MatchMeta division={division} date={date} host={host} />

        {recording && (
          <div
  className="flex justify-center"
  style={{ marginTop: "10px" }}
>
            <a href={recording} target="_blank" rel="noreferrer">
              <img
                src="/video.png"
                alt="Video"
                className="h-6 w-6 object-contain opacity-80 hover:opacity-100"
              />
            </a>
          </div>
        )}
      </section>
    </>
  )
}

function RunCard({
  run,
  category,
  index,
  isRightPlayer,
}: {
  run: string
  category?: string
  index: number
  isRightPlayer: boolean
}) {
  const categoryLabel = category || "Unknown"
  const displayCategoryLabel = getDisplayCategoryLabel(categoryLabel)
  const categoryTone = getCategoryTone(categoryLabel)

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
      <div className="text-xs text-zinc-500">Run {index + 1}</div>

      <div className="relative mt-1 text-center">
        {!["DNF", "DNP", "DQ"].includes(run.trim().toUpperCase()) && (
  <div
    className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap"
    style={
      isRightPlayer
        ? { left: "calc(50% + 65px)" }
        : { right: "calc(50% + 65px)" }
    }
  >
    <span className="inline-flex items-center">
  <TagBubble tone={categoryTone} size="sm">
    {displayCategoryLabel}
  </TagBubble>
</span>
  </div>
)}

        <div className="text-center text-lg font-semibold text-white">
          {run}
        </div>
      </div>
    </div>
  )
}

function PlayerResultCard({
  result,
  playerIndex,
  winningAverage,
  hasDraw,
}: {
  result: TournamentMatchResult
  playerIndex: number
  winningAverage: number
  hasDraw: boolean
}) {
  const isRightPlayer = playerIndex % 2 === 1
  const didWin = getDidWin(result.average, winningAverage, hasDraw)
  const runs = getRuns(result)

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
      <div className="mb-4">
        <h3 className="text-2xl font-bold">
          <PlayerNameLink player={result.player} className="hover:underline" />
        </h3>

        <div className="mt-3 flex justify-center">
          <TagBubble tone={getResultTone(didWin, hasDraw)} size="lg">
            {getResultLabel(didWin, hasDraw)}
          </TagBubble>
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        {runs.map((runResult, index) => (
          <RunCard
            key={index}
            run={runResult.run}
            category={runResult.category}
            index={index}
            isRightPlayer={isRightPlayer}
          />
        ))}

        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-3 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Average
          </div>

          <div className="mt-1 text-2xl font-bold text-white">
            {result.average || "—"}
          </div>
        </div>
      </div>
    </div>
  )
}

function SetCard({ set }: { set: MatchSet }) {
  const winningAverage = getWinningAverage(set.results)
  const hasDraw = getHasDraw(set.results, winningAverage)

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold">
          {set.map ? (
            <Link href={`/lb/${slugify(set.map)}`} className="hover:underline">
              {set.map}
            </Link>
          ) : (
            "Unknown Map"
          )}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {set.results.map((result, playerIndex) => (
          <PlayerResultCard
            key={`${result.matchId}-${result.map}-${result.player}`}
            result={result}
            playerIndex={playerIndex}
            winningAverage={winningAverage}
            hasDraw={hasDraw}
          />
        ))}
      </div>
    </article>
  )
}

export default function TournamentMatchPage({
  params,
}: {
  params: Promise<{ tournament: string; match: string }>
}) {
  const { tournament, match } = use(params)
  const { matches, results, loading } = useTournamentData()

  const matchData = matches.find(
  (item) =>
    slugify(item.tournamentName) === tournament &&
    String(item.matchId).trim() === String(match).trim()
)

const currentMatchId = String(matchData?.matchId ?? match).trim().toLowerCase()

const matchResults = results.filter(
  (result) => String(result.matchId).trim().toLowerCase() === currentMatchId
)

  const matchPlayers =
  matchData
    ? [
        {
          player: matchData.leftPlayer,
          seed: "",
        },
        {
          player: matchData.rightPlayer,
          seed: "",
        },
      ]
    : getMatchPlayers(matchResults)

const leftPlayer = matchPlayers[0]
const rightPlayer = matchPlayers[1]

  const sets = getMatchSets(matchResults)
  const { leftScore, rightScore, drawScore } = getMatchScore(
    sets,
    leftPlayer,
    rightPlayer
  )

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-zinc-500">Loading match...</p>
      </main>
    )
  }

  if (!matchData) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/tournament" className="text-sm text-zinc-400 underline">
          Back to tournaments
        </Link>

        <h1 className="mt-4 text-4xl font-bold">Match not found</h1>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <MatchHeader
        tournament={tournament}
        tournamentName={matchData.tournamentName}
        round={matchData.round ? `Round ${matchData.round}` : ""}
        division={matchData.division}
        date={matchData.date}
        host={matchData.host}
        recording={matchData.recording}
        leftPlayer={leftPlayer}
        rightPlayer={rightPlayer}
        leftScore={leftScore}
        rightScore={rightScore}
        drawScore={drawScore}
      />

      <section className="mt-8">
        {matchResults.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-400">
            No results found for this match.
          </div>
        )}

        {sets.length > 0 && (
          <div className="grid gap-6">
            {sets.map((set) => (
  <SetCard key={set.map || "unknown"} set={set} />
))}
          </div>
        )}
      </section>
    </main>
  )
}