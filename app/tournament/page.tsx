"use client"

import Link from "next/link"

import { useTournamentData } from "../../hooks/useTournamentData"
import { slugify } from "../../lib/slug"

export default function TournamentPage() {
  const { matches, loading } = useTournamentData()

  const tournaments = Array.from(
    new Map(
      matches.map((match) => [
        slugify(match.tournamentName),
        {
          slug: slugify(match.tournamentName),
          name: match.tournamentName || "Untitled Tournament",
          matchCount: matches.filter(
            (item) =>
              slugify(item.tournamentName) === slugify(match.tournamentName)
          ).length,
        },
      ])
    ).values()
  )

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Tournaments</h1>

        <p className="mt-2 text-zinc-400">
          Tournament results and match archives.
        </p>
      </div>

      {loading && <p className="text-zinc-500">Loading tournaments...</p>}

      {!loading && tournaments.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-400">
          No tournaments found.
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.slug}
              href={`/tournament/${tournament.slug}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
            >
              <h2 className="text-2xl font-bold">{tournament.name}</h2>

              <p className="mt-2 text-sm text-zinc-400">
                {tournament.matchCount}{" "}
                {tournament.matchCount === 1 ? "match" : "matches"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}