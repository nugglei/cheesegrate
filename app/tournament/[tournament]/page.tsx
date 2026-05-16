"use client"

import Link from "next/link"
import { use } from "react"

import { useTournamentData } from "../../../hooks/useTournamentData"
import { slugify } from "../../../lib/slug"

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournament: string }>
}) {
  const { tournament } = use(params)
  const { matches, loading } = useTournamentData()

  const tournamentMatches = matches.filter(
    (match) => slugify(match.tournamentName) === tournament
  )

  const tournamentName =
    tournamentMatches[0]?.tournamentName || "Untitled Tournament"

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-zinc-500">Loading tournament...</p>
      </main>
    )
  }

  if (tournamentMatches.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/tournament" className="text-sm text-zinc-400 underline">
          Back to tournaments
        </Link>

        <h1 className="mt-4 text-4xl font-bold">Tournament not found</h1>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/tournament" className="text-sm text-zinc-400 underline">
        Back to tournaments
      </Link>

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
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {match.round || "Untitled Match"}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-300">
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                    {match.division || "No division"}
                  </span>

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                    {match.date || "No date"}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                {match.recording ? (
                  <span className="inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-200">
                    Recording
                  </span>
                ) : (
                  <span className="inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-600">
                    No recording
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}