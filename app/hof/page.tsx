"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import CategorySelector from "../../components/CategorySelector"
import StatSelector from "../../components/StatSelector"
import TagBubble from "../../components/TagBubble"

import { useRuns } from "../../hooks/useRuns"

import { categoryPresets } from "../../lib/categories"
import { getMapsForCategory } from "../../lib/categoryMaps"
import { formatTime } from "../../lib/utils"
import {
  formatHoFRank,
  formatHoFValue,
  getHoFEntries,
  getHoFValueLabel,
  hofStatOptions,
  type HoFEntry,
  type HoFStat,
} from "../../lib/hof"

function slugifyPlayer(player: string) {
  return encodeURIComponent(player.toLowerCase())
}

function slugifyMap(map: string) {
  return map.toLowerCase().replaceAll(" ", "-")
}

export default function HoFPage() {
  const { runs, loading } = useRuns()

  const categories = categoryPresets.skip

  const [category, setCategory] =
    useState(categories[0])

  const [stat, setStat] =
    useState<HoFStat>("ap")

  const [expandedPlayer, setExpandedPlayer] =
    useState<string | null>(null)

  const categoryMaps = useMemo(
    () => getMapsForCategory(category),
    [category]
  )

  const entries = useMemo(
    () => getHoFEntries(runs, category, stat),
    [runs, category, stat]
  )

  const valueLabel = getHoFValueLabel(stat)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold">
          Hall of Fame
        </h1>

        <p className="mt-2 text-sm text-neutral-400">
          Overall leaderboards
        </p>
      </section>

      <div className="flex flex-col items-center gap-4">
        <CategorySelector
          categories={categories}
          category={category}
          setCategory={setCategory}
        />

        <StatSelector
          options={hofStatOptions}
          stat={stat}
          setStat={(value) =>
            setStat(value as HoFStat)
          }
        />
      </div>

      {loading ? (
        <p className="text-center text-neutral-400">
          Loading HoF...
        </p>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-neutral-800">
          <div className="grid grid-cols-[0.5fr_4fr_1fr] border-b border-neutral-800 bg-neutral-900/60 px-6 py-4 text-sm font-semibold text-neutral-300">
            <div>#</div>

            <div>Player</div>

            <div className="text-right">
              {valueLabel}
            </div>
          </div>

          {entries.map(
            (
              hofEntry: HoFEntry,
              index
            ) => {
              const isExpanded =
                expandedPlayer ===
                hofEntry.player

              const missingMaps =
                categoryMaps.filter(
                  (map) =>
                    !hofEntry.mapSet.has(map)
                )

              return (
                <div
                  key={hofEntry.player}
                  className="border-b border-neutral-900"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPlayer(
                        isExpanded
                          ? null
                          : hofEntry.player
                      )
                    }
                    className="grid w-full grid-cols-[0.5fr_4fr_1fr] items-center px-6 py-4 text-left transition-colors hover:bg-neutral-900/40"
                  >
                    <div className="text-neutral-500">
                      {formatHoFRank(index, stat)}
                    </div>

                    <div className="font-medium">
                      <Link
                        href={`/player/${slugifyPlayer(hofEntry.player)}`}
                        className="hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {hofEntry.player}
                      </Link>
                    </div>

                    <div className="text-right font-semibold">
                      {formatHoFValue(hofEntry.value, category, stat)}

                      {stat === "aap" && (
                        <span className="ml-2 text-xs font-medium text-neutral-500">
                          {hofEntry.mapSet.size}/{categoryMaps.length}
                        </span>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-neutral-900 bg-neutral-950/30 px-3 py-3">
                      <div className="mx-auto flex max-w-md flex-col gap-2">
                        {hofEntry.records.map(
                          (record) => (
                            <div
                              key={`${hofEntry.player}-${record.map}-${record.time}`}
                              className={`grid items-center rounded-md border border-neutral-800/60 bg-black/10 px-3 py-3 text-sm ${
                                stat === "ap" || stat === "aap"
                                  ? "grid-cols-[3fr_0.8fr_1.2fr]"
                                  : "grid-cols-[3fr_1fr]"
                              }`}
                            >
                              <div className="font-medium">
                                <Link
                                  href={`/lb/${slugifyMap(record.map)}`}
                                  className="hover:underline"
                                >
                                  {record.map}
                                </Link>
                              </div>

                              <div
                                className={`font-semibold ${
                                  stat === "ap" || stat === "aap"
                                    ? "text-center"
                                    : "text-right"
                                }`}
                              >
                                {formatTime(
                                  record.time,
                                  category
                                )}
                              </div>

                              {(stat === "ap" || stat === "aap") && (
                                <div className="text-right font-semibold">
                                  {record.placement
                                    ? `#${record.placement}`
                                    : ""}
                                </div>
                              )}
                            </div>
                          )
                        )}

                        {(stat === "wr" || stat === "aap") &&
                          missingMaps.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {missingMaps.map((map) => (
                                <TagBubble
                                  key={map}
                                  tone="red"
                                >
                                  {map}
                                </TagBubble>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          )}
        </section>
      )}
    </main>
  )
}