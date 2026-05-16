"use client"

import { useState } from "react"

import { useRuns } from "../../hooks/useRuns"

import {
  categoryPresets,
} from "../../lib/categories"

import {
  getWorldRecordsForCategory,
} from "../../lib/leaderboards"

import {
  formatTime,
} from "../../lib/utils"

import CategorySelector from "../../components/CategorySelector"

export default function WRsPage() {
  const { runs, loading } = useRuns()

  const categories = categoryPresets.skip

  const [category, setCategory] = useState(
    categories[0]
  )

  const wrs = getWorldRecordsForCategory(
    runs,
    category
  )

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-6">
        World Records
      </h1>

      {loading && (
        <p className="text-gray-500">
          Loading WRs...
        </p>
      )}

      <CategorySelector
        categories={categories}
        category={category}
        setCategory={setCategory}
      />

      <div className="border border-white/10 rounded-lg overflow-hidden">
        {wrs.map((run, index) => (
          <div
            key={index}
            className="grid grid-cols-[0.7fr_0.35fr_0.7fr_5fr] border-b border-white/10 last:border-b-0"
          >
            <div className="p-3 border-r border-white/10 flex items-center justify-center text-center">
              {run.map}
            </div>

            <div className="p-3 border-r border-white/10 flex items-center justify-center text-center">
              {formatTime(
                run.time,
                category
              )}
            </div>

            <div className="p-3 border-r border-white/10 flex items-center justify-center text-center gap-2">
              <span>
                {run.players[0]}
              </span>

              <a
                href={run.proofs[0]}
                target="_blank"
              >
                <img
                  src="/video.png"
                  alt="Video"
                  className="w-5 ml-1 object-contain hover:opacity-70"
                />
              </a>
            </div>

            <div className="p-3 flex items-center justify-center text-center flex-wrap gap-x-3 gap-y-1">
              {run.players.length > 1
                ? run.players
                    .slice(1)
                    .map((player, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center"
                      >
                        <span>
                          {player}
                        </span>

                        <a
                          href={run.proofs[i + 1]}
                          target="_blank"
                        >
                          <img
                            src="/video.png"
                            alt="Video"
                            className="w-5 ml-1 object-contain hover:opacity-70"
                          />
                        </a>
                      </span>
                    ))
                : "N/A"}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}