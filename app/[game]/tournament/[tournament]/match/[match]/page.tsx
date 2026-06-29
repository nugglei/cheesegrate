"use client"

import Link from "next/link"
import { use } from "react"

import TagBubble from "@/components/TagBubble"
import { useTournamentData } from "@/hooks/useTournamentData"
import { slugify } from "@/lib/slug"
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
  getWinningAverage,
  type MatchPlayer,
  type MatchSet,
  type TournamentMatchResult,
} from "@/lib/tournamentMatch"

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
  result,
}: {
  score: number
  opponentScore: number
  result?: string | null
}) {
  const normalizedResult = result?.trim().toUpperCase()

  const resultLabel =
    normalizedResult === "W" ||
    normalizedResult === "L" ||
    normalizedResult === "D"
      ? normalizedResult
      : getScoreLabel(score, opponentScore)

  const didWin =
    resultLabel === "W"
      ? true
      : resultLabel === "L"
        ? false
        : score > opponentScore

  const hasDraw = resultLabel === "D"

  return (
    <TagBubble tone={getResultTone(didWin, hasDraw)} size="lg">
      <span className="translate-y-[2px]">{resultLabel}</span>
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
        gridTemplateColumns: "40px 150px 120px 150px 40px",
        columnGap: "20px",
      }}
    >
      <div />

      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-zinc-500">
          {leftPlayer.seed || ""}
        </span>

        <PlayerNameLink
          player={leftPlayer.player}
          className="text-3xl font-bold hover:underline"
        />
      </div>

      <div className="flex justify-center" style={{ paddingTop: "10px" }}>
        <span className="text-sm font-bold text-zinc-400">VS</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <PlayerNameLink
          player={rightPlayer.player}
          className="text-3xl font-bold hover:underline"
        />

        <span className="text-sm font-medium text-zinc-500">
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
  leftResult,
  rightResult,
}: {
  leftScore: number
  rightScore: number
  drawScore: number
  leftResult?: string | null
  rightResult?: string | null
}) {
  return (
    <div className="flex flex-col items-center" style={{ marginTop: "10px" }}>
      <div
        className="grid items-center justify-center"
        style={{
          gridTemplateColumns: "40px 150px 120px 150px 40px",
          columnGap: "20px",
        }}
      >
        <div className="flex justify-center">
          <ScoreBubble
            score={leftScore}
            opponentScore={rightScore}
            result={leftResult}
          />
        </div>

        <span className="text-center text-5xl font-bold text-white">
          {leftScore}
        </span>

        <span className="text-center text-4xl font-bold text-zinc-500">–</span>

        <span className="text-center text-5xl font-bold text-white">
          {rightScore}
        </span>

        <div className="flex justify-center">
          <ScoreBubble
            score={rightScore}
            opponentScore={leftScore}
            result={rightResult}
          />
        </div>
      </div>
    </div>
  )
}

function MatchHeader({
  game,
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
  leftResult,
  rightResult,
}: {
  game: string
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
  leftResult?: string | null
  rightResult?: string | null
}) {
  return (
    <>
      <Link
        href={`/${game}/tournament/${tournament}`}
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
              leftResult={leftResult}
              rightResult={rightResult}
            />
          </>
        )}

        <MatchMeta division={division} date={date} host={host} />

        {recording && (
          <div className="flex justify-center" style={{ marginTop: "10px" }}>
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
  const categoryLabel = category?.trim() || ""
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
              {categoryLabel && (
                <TagBubble tone={categoryTone} size="sm">
                  {displayCategoryLabel}
                </TagBubble>
              )}
            </span>
          </div>
        )}

        <div className="text-center text-lg font-semibold text-white">{run}</div>
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
  const storedResult = result.result?.trim().toUpperCase()
  const hasStoredResult =
    storedResult === "W" || storedResult === "L" || storedResult === "D"

  const didWin = hasStoredResult
    ? storedResult === "W"
    : getDidWin(result.average, winningAverage, hasDraw)

  const displayHasDraw = hasStoredResult ? storedResult === "D" : hasDraw

  const resultLabel = hasStoredResult
    ? storedResult
    : getResultLabel(didWin, displayHasDraw)

  const runs = getRuns(result)

  const hasAverage =
    result.average !== null &&
    result.average !== undefined &&
    String(result.average).trim() !== ""

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
      <div className="mb-4">
        <h3 className="text-2xl font-bold">
          <PlayerNameLink player={result.player} className="hover:underline" />
        </h3>

        <div className="mt-3 flex justify-center">
          <TagBubble tone={getResultTone(didWin, displayHasDraw)} size="lg">
            {resultLabel}
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

        {hasAverage && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-3 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Average
            </div>

            <div className="mt-1 text-2xl font-bold text-white">
              {result.average}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SetCard({
  game,
  set,
  leftPlayer,
  rightPlayer,
}: {
  game: string
  set: MatchSet
  leftPlayer?: MatchPlayer
  rightPlayer?: MatchPlayer
}) {
  const winningAverage = getWinningAverage(set.results)
  const hasDraw = getHasDraw(set.results, winningAverage)

  const orderedResults =
    leftPlayer && rightPlayer
      ? [
          set.results.find((result) => result.player === leftPlayer.player),
          set.results.find((result) => result.player === rightPlayer.player),
        ].filter((result): result is TournamentMatchResult => Boolean(result))
      : set.results

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold">
          {set.map ? (
            <Link
              href={`/${game}/lb/${slugify(set.map)}`}
              className="hover:underline"
            >
              {set.map}
            </Link>
          ) : (
            "Unknown Map"
          )}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {orderedResults.map((result, playerIndex) => (
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
  params: Promise<{ game: string; tournament: string; match: string }>
}) {
  const { game, tournament, match } = use(params)
  const { matches, results, loading } = useTournamentData()

  const matchData = matches.find(
    (item) =>
      slugify(item.tournamentName) === tournament &&
      String(item.matchId).trim() === String(match).trim()
  )

  const currentMatchId = String(matchData?.matchId ?? match)
    .trim()
    .toLowerCase()

  const matchResults = results
    .filter(
      (result) => String(result.matchId).trim().toLowerCase() === currentMatchId
    )
    .sort((a, b) => {
      const aNumber = a.number ?? Number.MAX_SAFE_INTEGER
      const bNumber = b.number ?? Number.MAX_SAFE_INTEGER

      return aNumber - bNumber
    })

  const resultPlayers = getMatchPlayers(matchResults)

  const getSeedForPlayer = (player: string) =>
    resultPlayers.find((resultPlayer) => resultPlayer.player === player)
      ?.seed || ""

  const matchPlayers = matchData
    ? [
        {
          player: matchData.leftPlayer,
          seed: getSeedForPlayer(matchData.leftPlayer),
        },
        {
          player: matchData.rightPlayer,
          seed: getSeedForPlayer(matchData.rightPlayer),
        },
      ]
    : resultPlayers

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
        <Link
          href={`/${game}/tournament`}
          className="text-sm text-zinc-400 underline"
        >
          Back to tournaments
        </Link>

        <h1 className="mt-4 text-4xl font-bold">Match not found</h1>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <MatchHeader
        game={game}
        tournament={tournament}
        tournamentName={matchData.tournamentName}
        round={matchData.round || ""}
        division={matchData.division}
        date={matchData.date}
        host={matchData.host}
        recording={matchData.recording}
        leftPlayer={leftPlayer}
        rightPlayer={rightPlayer}
        leftScore={leftScore}
        rightScore={rightScore}
        drawScore={drawScore}
        leftResult={matchData.leftResult}
        rightResult={matchData.rightResult}
      />

      <section className="mt-8">
        {matchResults.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-400">
            No extra data found for this match.
          </div>
        )}

        {sets.length > 0 && (
          <div className="grid gap-6">
            {sets.map((set, index) => (
              <SetCard
                key={`${set.number ?? index}-${set.map || "unknown"}`}
                game={game}
                set={set}
                leftPlayer={leftPlayer}
                rightPlayer={rightPlayer}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}