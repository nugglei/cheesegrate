"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { use, useState } from "react"
import TagBubble from "@/components/TagBubble"
import { useTournamentData } from "../../../hooks/useTournamentData"
import { slugify } from "../../../lib/slug"
import {
  getMatchPlayers,
  getMatchScore,
  getMatchSets,
} from "../../../lib/tournamentMatch"

function getFallbackResultText(match: {
  leftPlayer: string
  rightPlayer: string
  leftResult: string
  rightResult: string
}) {
  if (match.leftResult === "W") {
    return `${match.leftPlayer || "TBD"} won`
  }

  if (match.rightResult === "W") {
    return `${match.rightPlayer || "TBD"} won`
  }

  if (match.leftResult === "D" || match.rightResult === "D") {
    return "Draw"
  }

  return "No result yet"
}

function getMatchResultText(
  match: {
    matchId: string
    leftPlayer: string
    rightPlayer: string
    leftResult: string
    rightResult: string
  },
  results: {
    matchId: string
    player: string
    seed?: string
    map?: string
    average: string
  }[]
) {
  const matchResults = results.filter(
    (result) =>
      String(result.matchId).trim().toLowerCase() ===
      String(match.matchId).trim().toLowerCase()
  )

  if (matchResults.length === 0) {
    return getFallbackResultText(match)
  }

  const players = getMatchPlayers(matchResults)

  const leftPlayer =
    players.find((player) => player.player === match.leftPlayer) ?? players[0]

  const rightPlayer =
    players.find((player) => player.player === match.rightPlayer) ?? players[1]

  if (!leftPlayer || !rightPlayer) {
    return getFallbackResultText(match)
  }

  const sets = getMatchSets(matchResults)

  const { leftScore, rightScore } = getMatchScore(
    sets,
    leftPlayer,
    rightPlayer
  )

  if (leftScore === 0 && rightScore === 0) {
    return getFallbackResultText(match)
  }

  if (leftScore > rightScore) {
    return `${leftPlayer.player || "TBD"} won ${leftScore}–${rightScore}`
  }

  if (rightScore > leftScore) {
    return `${rightPlayer.player || "TBD"} won ${rightScore}–${leftScore}`
  }

  return `Draw ${leftScore}-${rightScore}`
}

function getTournamentPlayerCount(
  matches: {
    leftPlayer: string
    rightPlayer: string
  }[]
) {
  const players = new Set<string>()

  matches.forEach((match) => {
    if (match.leftPlayer.trim()) {
      players.add(match.leftPlayer.trim().toLowerCase())
    }

    if (match.rightPlayer.trim()) {
      players.add(match.rightPlayer.trim().toLowerCase())
    }
  })

  return players.size
}

function normalizeRound(round: string | null | undefined) {
  const cleanRound = String(round ?? "").trim()

  if (!cleanRound) {
    return ""
  }

  const lowerRound = cleanRound.toLowerCase()

  if (lowerRound === "final" || lowerRound === "finals") {
    return "Finals"
  }

  const losersMatch = lowerRound.match(/^losers(?: round)? (\d+)$/)

  if (losersMatch) {
    return `Losers ${losersMatch[1]}`
  }

  const roundMatch = lowerRound.match(/^round (\d+)$/)

  if (roundMatch) {
    return roundMatch[1]
  }

  return cleanRound
}

function getRoundSortValue(round: string | null | undefined, playerCount: number) {
  const roundOrder12 = [
    "Qualifiers",
    "Group Stage",
    "1",
    "2",
    "Losers 1",
    "Losers 2",
    "3",
    "Losers 3",
    "4",
    "Losers 4",
    "Losers 5",
    "Losers 6",
    "3rd Place",
    "Finals",
    "Grand Finals",
  ]

  const roundOrder16 = [
    "Qualifiers",
    "Group Stage",
    "1",
    "Losers 1",
    "2",
    "Losers 2",
    "3",
    "Losers 3",
    "Losers 4",
    "4",
    "Losers 5",
    "Losers 6",
    "3rd Place",
    "Finals",
    "Grand Finals",
  ]

  const roundOrder = playerCount >= 14 ? roundOrder16 : roundOrder12
  const normalizedRound = normalizeRound(round)
  const roundIndex = roundOrder.indexOf(normalizedRound)

  if (roundIndex !== -1) {
    return roundIndex
  }

  return 999
}

function getDivisionSortValue(division: string | null | undefined) {
  const divisionOrder = [
    "Masters",
    "Division I",
    "Challengers",
    "Division II",
    "Futures",
    "A",
    "B",
    "C",
    "D",
  ]

  const cleanDivision = String(division ?? "").trim()

  if (!cleanDivision) {
    return 999
  }

  const divisionIndex = divisionOrder.findIndex(
    (divisionName) =>
      divisionName.toLowerCase() === cleanDivision.toLowerCase()
  )

  if (divisionIndex !== -1) {
    return divisionIndex
  }

  return 999
}

function getDateSortValue(date: string | null | undefined) {
  if (!date) {
    return 9999999999999
  }

  const parsedDate = new Date(date).getTime()

  if (Number.isNaN(parsedDate)) {
    return 9999999999999
  }

  return parsedDate
}

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournament: string }>
}) {
  const { tournament } = use(params)
  const router = useRouter()
  const { matches, results, loading } = useTournamentData()
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const tournamentMatches = matches.filter(
  (match) => slugify(match.tournamentName) === tournament
)

const tournamentPlayerCount = getTournamentPlayerCount(tournamentMatches)

const sortedTournamentMatches = [...tournamentMatches].sort((a, b) => {
  const directionMultiplier = sortDirection === "asc" ? 1 : -1

  const roundDifference =
    getRoundSortValue(a.round, tournamentPlayerCount) -
    getRoundSortValue(b.round, tournamentPlayerCount)

  if (roundDifference !== 0) {
    return roundDifference * directionMultiplier
  }

  const divisionDifference =
    getDivisionSortValue(a.division) - getDivisionSortValue(b.division)

  if (divisionDifference !== 0) {
    return divisionDifference * directionMultiplier
  }

  const dateDifference = getDateSortValue(a.date) - getDateSortValue(b.date)

  if (dateDifference !== 0) {
    return dateDifference * directionMultiplier
  }

  return (
    String(a.matchId).localeCompare(String(b.matchId), undefined, {
      numeric: true,
    }) * directionMultiplier
  )
})

function getRoundBubbleTone(
  round: string | null | undefined
): "white" | "blue" | "lightred" | "silver" | "gold" {
  const normalizedRound = normalizeRound(round)

  if (
    normalizedRound === "Qualifiers" ||
    normalizedRound === "Group Stage"
  ) {
    return "white"
  }

  if (normalizedRound.startsWith("Losers")) {
    return "lightred"
  }

  if (normalizedRound === "3rd Place") {
    return "silver"
  }

  if (
    normalizedRound === "Finals" ||
    normalizedRound === "Grand Finals"
  ) {
    return "gold"
  }

  return "blue"
}

const tournamentName =
  tournamentMatches[0]?.tournamentName || "Untitled Tournament"

  if (loading) {
    return (
      <main className="mx-auto px-5 py-8" style={{ width: "900px" }}>
        <p className="text-zinc-500">Loading tournament...</p>
      </main>
    )
  }

  if (tournamentMatches.length === 0) {
    return (
      <main className="mx-auto px-5 py-8" style={{ width: "900px" }}>
        <h1 className="mt-4 text-4xl font-bold">Tournament not found</h1>
      </main>
    )
  }

  return (
    <main className="mx-auto px-5 py-8" style={{ width: "900px" }}>
      <div className="mt-6 mb-8">
        <h1 className="text-4xl font-bold">{tournamentName}</h1>

        <p className="mt-2 text-zinc-400">
  {tournamentMatches.length}{" "}
  {tournamentMatches.length === 1 ? "match" : "matches"} /{" "}
  {tournamentPlayerCount}{" "}
  {tournamentPlayerCount === 1 ? "player" : "players"}
</p>
      </div>

<button
  type="button"
  onClick={() =>
    setSortDirection((currentDirection) =>
      currentDirection === "asc" ? "desc" : "asc"
    )
  }
  className="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
>
  <span>{sortDirection === "asc" ? "↓" : "↑"}</span>
</button>
      <div className="grid gap-4">
  {sortedTournamentMatches.map((match, index) => {
    const previousMatch = sortedTournamentMatches[index - 1]
    const currentRound = normalizeRound(match.round)
    const previousRound = normalizeRound(previousMatch?.round)
    const shouldShowRoundBar = index === 0 || currentRound !== previousRound

    return (
      <div key={match.matchId} className="grid gap-2">
  {shouldShowRoundBar ? (
    <div className={index === 0 ? "flex items-center gap-3" : "mt-1 flex items-center gap-3"}>
      <div className="h-px flex-1 bg-white/10" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        {match.round || "Unlisted Round"}
      </p>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  ) : null}

        <div
  key={match.matchId}
  role="link"
  tabIndex={0}
  onClick={() =>
    router.push(`/tournament/${tournament}/match/${match.matchId}`)
  }
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      router.push(`/tournament/${tournament}/match/${match.matchId}`)
    }
  }}
  className="block cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
  style={{ width: "860px" }}
>
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-2xl font-bold">
                  {match.leftPlayer || "TBD"} VS {match.rightPlayer || "TBD"}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {match.round ? (
  <TagBubble tone={getRoundBubbleTone(match.round)} size="md">
    {match.round}
  </TagBubble>
) : null}

                  {match.division ? (
                    <TagBubble tone="purple" size="md">
                      {match.division}
                    </TagBubble>
                  ) : null}

                  {match.date ? (
                    <TagBubble tone="white" size="md">
                      {match.date}
                    </TagBubble>
                  ) : null}

                  {match.recording ? (
  <a
    href={match.recording}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Watch recording"
    title="Watch recording"
    className="inline-flex items-center"
    onClick={(event) => event.stopPropagation()}
  >
    <Image
      src="/video.png"
      alt="Watch recording"
      width={22}
      height={22}
    />
  </a>
) : null}
                </div>
              </div>

              <div
  className="ml-auto flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center"
  style={{ width: "220px", minHeight: "72px" }}
>
  <p className="whitespace-nowrap text-lg font-bold text-zinc-100">
    {getMatchResultText(match, results)}
  </p>
</div>
            </div>
                  </div>
      </div>
    )
  })}
</div>
    </main>
  )
}