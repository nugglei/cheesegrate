"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { slugify } from "@/lib/slug"

import CategorySelector from "../../../components/CategorySelector"
import PlayerProfilePicture from "../../../components/PlayerProfilePicture"
import StatSelector from "../../../components/StatSelector"
import TagBubble from "../../../components/TagBubble"

import { useRuns } from "../../../hooks/useRuns"
import { useSwiftLBs } from "../../../hooks/useSwiftLBs"

import { categoryPresets } from "../../../lib/categories"
import { getMapsForCategory } from "../../../lib/categoryMaps"
import { getRankColor } from "../../../lib/rankColors"
import { formatTime } from "../../../lib/utils"
import {
  formatHoFRank,
  formatHoFValue,
  getHoFEntries,
  getHoFValueLabel,
  hofStatOptions,
  type HoFEntry,
  type HoFStat,
} from "../../../lib/hof"
import { swiftMaps } from "../../../lib/swiftMaps"

type SwiftRecord = {
  map: string
  timeMs: number
  placement: number
}

type SwiftHoFEntry = {
  player: string
  value: number
  mapSet: Set<string>
  records: SwiftRecord[]
}

function formatSwiftTime(ms: number) {
  return (ms / 1000).toFixed(3)
}

function getSwiftHoFValueLabel(stat: HoFStat) {
  if (stat === "ap") {
    return "Average Placement"
  }

  if (stat === "aap") {
    return "Average Placement"
  }

  if (stat === "wr") {
    return "WRs"
  }

  if (stat === "total") {
    return "Total Time"
  }

  return getHoFValueLabel(stat)
}

function formatSwiftHoFValue(value: number, stat: HoFStat) {
  if (stat === "ap" || stat === "aap") {
    return value.toFixed(3)
  }

  if (stat === "wr") {
    return String(value)
  }

  if (stat === "total") {
    return formatSwiftTime(value)
  }

  return String(value)
}

function getSwiftHoFEntries(
  leaderboards: ReturnType<typeof useSwiftLBs>["leaderboards"],
  stat: HoFStat
): {
  entries: SwiftHoFEntry[]
  mapCount: number
  mapNames: string[]
} {
  const swiftMapOrder = new Map(
    swiftMaps.map((map, index) => [map.name, index])
  )

  const activeLeaderboards = leaderboards.filter(
    (leaderboard) => leaderboard.entries.length > 0
  )

  const mapNames = activeLeaderboards.map((leaderboard) => leaderboard.map)
  const mapCount = activeLeaderboards.length

  const byPlayer = new Map<string, SwiftHoFEntry>()

  for (const leaderboard of activeLeaderboards) {
    for (const entry of leaderboard.entries) {
      const placement =
        leaderboard.entries.findIndex(
          (otherEntry) => otherEntry.timeMs === entry.timeMs
        ) + 1

      const existing = byPlayer.get(entry.player) ?? {
        player: entry.player,
        value: 0,
        mapSet: new Set<string>(),
        records: [],
      }

      existing.mapSet.add(leaderboard.map)
      existing.records.push({
        map: leaderboard.map,
        timeMs: entry.timeMs,
        placement,
      })

      byPlayer.set(entry.player, existing)
    }
  }

  const entries = Array.from(byPlayer.values())
    .map((entry) => {
      const records = [...entry.records].sort(
  (a, b) =>
    (swiftMapOrder.get(a.map) ?? 9999) -
    (swiftMapOrder.get(b.map) ?? 9999)
)

      if (stat === "wr") {
        return {
          ...entry,
          records,
          value: records.filter((record) => record.placement === 1).length,
        }
      }

      if (stat === "total") {
        if (entry.mapSet.size !== mapCount) {
          return null
        }

        return {
          ...entry,
          records,
          value: records.reduce((total, record) => total + record.timeMs, 0),
        }
      }

      if (stat === "ap") {
  if (entry.mapSet.size !== mapCount) {
    return null
  }

  return {
    ...entry,
    records,
    value:
      records.reduce(
        (total, record) => total + record.placement,
        0
      ) / records.length,
  }
}

return {
  ...entry,
  records,
  value:
    (records.reduce(
      (total, record) => total + record.placement,
      0
    ) /
      records.length) *
    (mapCount / entry.mapSet.size),
}
    })
    .filter((entry): entry is SwiftHoFEntry => entry !== null)
    .filter((entry) => {
      if (stat === "wr") {
        return entry.value > 0
      }

      return true
    })
    .sort((a, b) => {
      if (stat === "wr") {
        return b.value - a.value || a.player.localeCompare(b.player)
      }

      return a.value - b.value || a.player.localeCompare(b.player)
    })

  return {
    entries,
    mapCount,
    mapNames,
  }
}

export default function HoFPage() {
  const params = useParams<{ game: string }>()
  const game = params.game

  if (game === "swift") {
    return <SwiftHoFPage />
  }

  return <SpeedRaceHoFPage />
}

function SpeedRaceHoFPage() {
  const { runs, loading } = useRuns()
  const supabase = useMemo(() => createClient(), [])

  const categories = categoryPresets.skip

  const [category, setCategory] = useState(categories[0])
  const [stat, setStat] = useState<HoFStat>("ap")
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [profilePictures, setProfilePictures] = useState<Record<string, string>>(
    {}
  )

  const categoryMaps = useMemo(() => getMapsForCategory(category), [category])

  const entries = useMemo(
    () => getHoFEntries(runs, category, stat),
    [runs, category, stat]
  )

  const playerNames = useMemo(
    () => entries.map((entry) => entry.player),
    [entries]
  )

  useEffect(() => {
    async function loadProfilePictures() {
      if (playerNames.length === 0) {
        setProfilePictures({})
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("player_name, profile_picture_url")
        .in("player_name", playerNames)

      if (error || !data) {
        return
      }

      const nextProfilePictures: Record<string, string> = {}

      data.forEach((profile) => {
        if (profile.player_name && profile.profile_picture_url) {
          nextProfilePictures[profile.player_name] = profile.profile_picture_url
        }
      })

      setProfilePictures(nextProfilePictures)
    }

    loadProfilePictures()
  }, [playerNames, supabase])

  const valueLabel = getHoFValueLabel(stat)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold">Speed Race Hall of Fame</h1>
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
          setStat={(value) => setStat(value as HoFStat)}
        />

        {(stat === "ap" || stat === "total") && (
          <p className="text-sm text-neutral-400">All map submissions required</p>
        )}
      </div>

      {loading ? (
        <p className="text-center text-neutral-400">Loading HoF...</p>
      ) : (
        <section className="w-full overflow-hidden rounded-2xl border border-neutral-800">
          <div className="flex items-center border-b border-neutral-800 bg-neutral-900/60 px-6 py-4 text-sm font-semibold text-neutral-300">
            <div
              className="text-center"
              style={{
                width: "90px",
                minWidth: "90px",
              }}
            >
              #
            </div>

            <div
              style={{
                flex: 1,
                paddingLeft: "32px",
              }}
            >
              Player
            </div>

            <div
              className="text-right"
              style={{
                width: "160px",
                minWidth: "160px",
              }}
            >
              {valueLabel}
            </div>
          </div>

          {entries.map((hofEntry: HoFEntry) => {
            const isExpanded = expandedPlayer === hofEntry.player

            const missingMaps = categoryMaps.filter(
              (map) => !hofEntry.mapSet.has(map)
            )

            const rank =
              entries.findIndex((entry) => entry.value === hofEntry.value) + 1

            const rankColor = getRankColor(rank - 1, "#737373")
            const playerColor = getRankColor(rank - 1)

            return (
              <div key={hofEntry.player} className="border-b border-neutral-900">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPlayer(isExpanded ? null : hofEntry.player)
                  }
                  className="flex w-full items-center px-6 py-4 text-left transition-colors hover:bg-neutral-900/40"
                >
                  <div
                    className="text-center font-bold"
                    style={{
                      width: "90px",
                      minWidth: "90px",
                      color: rankColor,
                    }}
                  >
                    {formatHoFRank(rank, stat)}
                  </div>

                  <div
                    className={`flex items-center gap-3 ${
                      rank <= 3 ? "font-bold" : "font-medium"
                    }`}
                    style={{
                      flex: 1,
                      paddingLeft: "32px",
                      color: playerColor,
                    }}
                  >
                    <PlayerProfilePicture
                      player={hofEntry.player}
                      src={profilePictures[hofEntry.player]}
                      size={36}
                    />

                    <Link
                      href={`/player/${slugify(hofEntry.player)}`}
                      className="hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {hofEntry.player}
                    </Link>
                  </div>

                  <div
                    className={`text-right ${
                      rank <= 3 ? "font-bold" : "font-semibold"
                    }`}
                    style={{
                      width: "160px",
                      minWidth: "160px",
                      color: playerColor,
                    }}
                  >
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
                      {hofEntry.records.map((record) => (
                        <div
                          key={`${hofEntry.player}-${record.map}-${record.time}`}
                          className={`grid items-center rounded-md border border-neutral-800/60 bg-black/10 px-3 py-3 text-sm ${
                            stat === "ap" || stat === "aap"
                              ? "grid-cols-[3fr_0.8fr_1.2fr]"
                              : "grid-cols-[3fr_1fr]"
                          }`}
                        >
                          <div className="flex items-center gap-3 font-medium">
                            <img
                              src={`/maps/${slugify(record.map)}.png`}
                              alt={record.map}
                              className="h-6 w-10 rounded object-cover"
                            />

                            <Link
                              href={`/sr/lb/${slugify(record.map)}`}
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
                            {formatTime(record.time, category)}
                          </div>

                          {(stat === "ap" || stat === "aap") && (
                            <div
                              className="text-right font-semibold"
                              style={{
                                color:
                                  record.placement && record.placement <= 3
                                    ? getRankColor(record.placement - 1)
                                    : undefined,
                              }}
                            >
                              {record.placement ?? ""}
                            </div>
                          )}
                        </div>
                      ))}

                      {(stat === "wr" || stat === "aap") &&
                        missingMaps.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {missingMaps.map((map) => (
                              <TagBubble key={map} tone="red">
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
          })}
        </section>
      )}
    </main>
  )
}

function SwiftHoFPage() {
  const { leaderboards, loading } = useSwiftLBs()
  const supabase = useMemo(() => createClient(), [])

  const [stat, setStat] = useState<HoFStat>("ap")
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [profilePictures, setProfilePictures] = useState<Record<string, string>>(
    {}
  )

  const { entries, mapCount, mapNames } = useMemo(
    () => getSwiftHoFEntries(leaderboards, stat),
    [leaderboards, stat]
  )

  const playerNames = useMemo(
    () => entries.map((entry) => entry.player),
    [entries]
  )

  useEffect(() => {
    async function loadProfilePictures() {
      if (playerNames.length === 0) {
        setProfilePictures({})
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("player_name, profile_picture_url")
        .in("player_name", playerNames)

      if (error || !data) {
        return
      }

      const nextProfilePictures: Record<string, string> = {}

      data.forEach((profile) => {
        if (profile.player_name && profile.profile_picture_url) {
          nextProfilePictures[profile.player_name] = profile.profile_picture_url
        }
      })

      setProfilePictures(nextProfilePictures)
    }

    loadProfilePictures()
  }, [playerNames, supabase])

  const valueLabel = getSwiftHoFValueLabel(stat)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold">Swift Hall of Fame</h1>
      </section>

      <div className="flex flex-col items-center gap-4">
        <StatSelector
          options={hofStatOptions}
          stat={stat}
          setStat={(value) => setStat(value as HoFStat)}
        />

        {(stat === "ap" || stat === "total") && (
          <p className="text-sm text-neutral-400">All map submissions required</p>
        )}
      </div>

      {loading ? (
        <p className="text-center text-neutral-400">Loading Swift HoF...</p>
      ) : (
        <section className="w-full overflow-hidden rounded-2xl border border-neutral-800">
          <div className="flex items-center border-b border-neutral-800 bg-neutral-900/60 px-6 py-4 text-sm font-semibold text-neutral-300">
            <div
              className="text-center"
              style={{
                width: "90px",
                minWidth: "90px",
              }}
            >
              #
            </div>

            <div
              style={{
                flex: 1,
                paddingLeft: "32px",
              }}
            >
              Player
            </div>

            <div
              className="text-right"
              style={{
                width: "160px",
                minWidth: "160px",
              }}
            >
              {valueLabel}
            </div>
          </div>

          {entries.map((hofEntry) => {
            const isExpanded = expandedPlayer === hofEntry.player

            const displayedRecords =
  stat === "wr"
    ? hofEntry.records.filter((record) => record.placement === 1)
    : hofEntry.records

const missingMaps =
  stat === "wr"
    ? mapNames.filter(
        (map) =>
          !hofEntry.records.some(
            (record) => record.map === map && record.placement === 1
          )
      )
    : mapNames.filter((map) => !hofEntry.mapSet.has(map))

            const rank =
              entries.findIndex((entry) => entry.value === hofEntry.value) + 1

            const rankColor = getRankColor(rank - 1, "#737373")
            const playerColor = getRankColor(rank - 1)

            return (
              <div key={hofEntry.player} className="border-b border-neutral-900">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPlayer(isExpanded ? null : hofEntry.player)
                  }
                  className="flex w-full items-center px-6 py-4 text-left transition-colors hover:bg-neutral-900/40"
                >
                  <div
                    className="text-center font-bold"
                    style={{
                      width: "90px",
                      minWidth: "90px",
                      color: rankColor,
                    }}
                  >
                    {formatHoFRank(rank, stat)}
                  </div>

                  <div
                    className={`flex items-center gap-3 ${
                      rank <= 3 ? "font-bold" : "font-medium"
                    }`}
                    style={{
                      flex: 1,
                      paddingLeft: "32px",
                      color: playerColor,
                    }}
                  >
                    <PlayerProfilePicture
                      player={hofEntry.player}
                      src={profilePictures[hofEntry.player]}
                      size={36}
                    />

                    <Link
                      href={`/player/${slugify(hofEntry.player)}`}
                      className="hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {hofEntry.player}
                    </Link>
                  </div>

                  <div
                    className={`text-right ${
                      rank <= 3 ? "font-bold" : "font-semibold"
                    }`}
                    style={{
                      width: "160px",
                      minWidth: "160px",
                      color: playerColor,
                    }}
                  >
                    {formatSwiftHoFValue(hofEntry.value, stat)}

                    {stat === "aap" && (
                      <span className="ml-2 text-xs font-medium text-neutral-500">
                        {hofEntry.mapSet.size}/{mapCount}
                      </span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-neutral-900 bg-neutral-950/30 px-3 py-3">
                    <div className="mx-auto flex max-w-md flex-col gap-2">
                      {displayedRecords.map((record) => (
                        <div
                          key={`${hofEntry.player}-${record.map}-${record.timeMs}`}
                          className={`grid items-center rounded-md border border-neutral-800/60 bg-black/10 px-3 py-3 text-sm ${
                            stat === "ap" || stat === "aap"
                              ? "grid-cols-[3fr_0.8fr_1.2fr]"
                              : "grid-cols-[3fr_1fr]"
                          }`}
                        >
                          <div className="flex items-center gap-3 font-medium">
                            <img
                              src={`/maps/${slugify(record.map)}.png`}
                              alt={record.map}
                              className="h-6 w-10 rounded object-cover"
                            />

                            <Link
                              href={`/swift/lb/${slugify(record.map)}`}
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
                            {formatSwiftTime(record.timeMs)}
                          </div>

                          {(stat === "ap" || stat === "aap") && (
                            <div
                              className="text-right font-semibold"
                              style={{
                                color:
                                  record.placement && record.placement <= 3
                                    ? getRankColor(record.placement - 1)
                                    : undefined,
                              }}
                            >
                              {record.placement ?? ""}
                            </div>
                          )}
                        </div>
                      ))}

                      {(stat === "wr" || stat === "aap") &&
                        missingMaps.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {missingMaps.map((map) => (
                              <TagBubble key={map} tone="red">
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
          })}
        </section>
      )}
    </main>
  )
}