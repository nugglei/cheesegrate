"use client"

import Link from "next/link"
import Image from "next/image"
import { use } from "react"
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

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournament: string }>
}) {
  const { tournament } = use(params)
  const { matches, results, loading } = useTournamentData()

  const tournamentMatches = matches.filter(
    (match) => slugify(match.tournamentName) === tournament
  )

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
          {tournamentMatches.length === 1 ? "match" : "matches"}
        </p>
      </div>

      <div className="grid gap-4">
        {tournamentMatches.map((match) => (
          <Link
            key={match.matchId}
            href={`/tournament/${tournament}/match/${match.matchId}`}
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
            style={{ width: "860px" }}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-2xl font-bold">
                  {match.leftPlayer || "TBD"} VS {match.rightPlayer || "TBD"}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {match.round ? (
                    <TagBubble tone="blue" size="md">
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
                    <span
                      aria-label="Watch recording"
                      title="Watch recording"
                      className="inline-flex items-center"
                    >
                      <Image
                        src="/video.png"
                        alt="Watch recording"
                        width={22}
                        height={22}
                      />
                    </span>
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
          </Link>
        ))}
      </div>
    </main>
  )
}