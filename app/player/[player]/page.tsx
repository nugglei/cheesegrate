"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"
import StatSelector from "@/components/StatSelector"
import { useRuns } from "@/hooks/useRuns"
import { useSwiftLBs } from "@/hooks/useSwiftLBs"
import {
  formatHoFRank,
  formatHoFValue,
  getHoFEntries,
} from "@/lib/hof"
import { getRankColor } from "@/lib/rankColors"
import { slugify } from "@/lib/slug"
import { createClient } from "@/lib/supabase/client"
import TagBubble from "@/components/TagBubble"
import CategorySelector from "@/components/CategorySelector"
import { getLeaderboardRuns } from "@/lib/leaderboards"
import { formatDate, formatTime } from "@/lib/utils"
import { getMapsForCategory } from "@/lib/categoryMaps"
import GameSwitcherButton from "@/components/GameSwitcherLocal"

type PlayerProfileTab = "overview" | "rankings" | "pbs" | "tournaments"
type PbGame = "speed-race" | "swift"

const playerProfileTabs: { value: PlayerProfileTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "rankings", label: "Rankings" },
  { value: "pbs", label: "PBs" },
  { value: "tournaments", label: "Tournaments" },
]

const rankingCategories = [
  "Skip IGT",
  "Skip EGT",
  "Skipless IGT",
  "Skipless EGT",
  "R15 Skip",
  "R15 Skipless",
  "R6 Skip",
  "R6 Skipless",
  "Glitch",
]

const PB_GAME_DATA = {
  "speed-race": {
    label: "Speed Race",
    shortLabel: "SR",
    image: "/speed-race.png",
  },
  swift: {
    label: "Swift",
    shortLabel: "Swift",
    image: "/swift.png",
  },
} as const

function getMapSlug(map: string) {
  return map.toLowerCase().replaceAll(" ", "-")
}

function PbGameSwitcher({
  game,
  onGameChange,
}: {
  game: PbGame
  onGameChange: (game: PbGame) => void
}) {
  const otherGame = game === "speed-race" ? "swift" : "speed-race"
  const currentGameData = PB_GAME_DATA[game]
  const otherGameData = PB_GAME_DATA[otherGame]

  return (
    <button
      type="button"
      onClick={() => onGameChange(otherGame)}
      title={`Switch to ${otherGameData.label}`}
      className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
    >
      <img
        src={currentGameData.image}
        alt={currentGameData.label}
        className="h-[22px] w-[22px] rounded object-cover"
      />

      <span className="whitespace-nowrap">{currentGameData.shortLabel}</span>
    </button>
  )
}

export default function PlayerProfilePage() {
  const params = useParams()
  const { runs, loading } = useRuns()
  const { leaderboards: swiftLeaderboards, loading: swiftLoading } =
    useSwiftLBs()

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  )
  const [bio, setBio] = useState("")
  const [goal1, setGoal1] = useState("")
  const [goal2, setGoal2] = useState("")
  const [goal3, setGoal3] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [countryName, setCountryName] = useState("")
  const [tab, setTab] = useState<PlayerProfileTab>("overview")
  const [pbGame, setPbGame] = useState<PbGame>("speed-race")
  const [pbCategory, setPbCategory] = useState("Skip IGT")
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [pbRankSort, setPbRankSort] = useState<"asc" | "desc" | null>(null)
  const [pbDateSort, setPbDateSort] = useState<"asc" | "desc" | null>(null)

  const playerSlug = String(params.player ?? "")

  const playerName = useMemo(() => {
    const matchingRun = runs.find((run) => slugify(run.player) === playerSlug)

    if (matchingRun) {
      return matchingRun.player
    }

    const matchingSwiftEntry = swiftLeaderboards
      .flatMap((leaderboard) => leaderboard.entries)
      .find((entry) => slugify(entry.player) === playerSlug)

    return matchingSwiftEntry?.player ?? decodeURIComponent(playerSlug)
  }, [runs, swiftLeaderboards, playerSlug])

  const totalSubmissions = useMemo(() => {
    return runs.filter((run) => run.player === playerName).length
  }, [runs, playerName])

  const careerActivity = useMemo(() => {
    const playerRuns = runs.filter((run) => run.player === playerName)

    const dates = playerRuns
      .map((run) => new Date(run.date ?? ""))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    if (dates.length === 0) {
      return null
    }

    return {
      first: dates[0],
      latest: dates[dates.length - 1],
    }
  }, [runs, playerName])

  const goals = useMemo(() => {
    return [goal1, goal2, goal3].filter((goal) => goal.trim() !== "")
  }, [goal1, goal2, goal3])

  const profileRankings = useMemo(() => {
    return rankingCategories.map((category) => {
      const apEntries = getHoFEntries(runs, category, "ap")
      const apEntryIndex = apEntries.findIndex(
        (entry) => entry.player === playerName
      )
      const apEntry = apEntryIndex >= 0 ? apEntries[apEntryIndex] : null

      const aapEntries = getHoFEntries(runs, category, "aap")
      const aapEntryIndex = aapEntries.findIndex(
        (entry) => entry.player === playerName
      )
      const aapEntry = aapEntryIndex >= 0 ? aapEntries[aapEntryIndex] : null

      const totalMaps = getMapsForCategory(category).length

      if (apEntry) {
        return {
          category,
          stat: "ap" as const,
          rank: apEntryIndex + 1,
          entry: apEntry,
          mapsSubmitted: apEntry.mapSet.size,
          totalMaps,
        }
      }

      return {
        category,
        stat: "aap" as const,
        rank: aapEntry ? aapEntryIndex + 1 : null,
        entry: aapEntry,
        mapsSubmitted: aapEntry ? aapEntry.mapSet.size : 0,
        totalMaps,
      }
    })
  }, [runs, playerName])

  const mapPBs = useMemo(() => {
    const pbs = getMapsForCategory(pbCategory).map((map) => {
      const leaderboardRuns = getLeaderboardRuns(runs, map, pbCategory)

      const playerRun = leaderboardRuns.find(
        (run) =>
          run.player.trim().toLowerCase() === playerName.trim().toLowerCase()
      )

      if (!playerRun) {
        return {
          map,
          rank: null,
          time: null,
          date: null,
          proof: null,
        }
      }

      const playerTime = Number(playerRun.time)

      const rank =
        leaderboardRuns.filter((run) => Number(run.time) < playerTime).length +
        1

      return {
        map,
        rank,
        time: playerRun.time,
        date: playerRun.date,
        proof: playerRun.proof,
      }
    })

    if (pbRankSort === "asc") {
      return [...pbs].sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0
        if (a.rank === null) return 1
        if (b.rank === null) return -1

        return a.rank - b.rank
      })
    }

    if (pbRankSort === "desc") {
      return [...pbs].sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0
        if (a.rank === null) return 1
        if (b.rank === null) return -1

        return b.rank - a.rank
      })
    }

    if (pbDateSort === "asc") {
      return [...pbs].sort((a, b) => {
        if (a.date === null && b.date === null) return 0
        if (a.date === null) return 1
        if (b.date === null) return -1

        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
    }

    if (pbDateSort === "desc") {
      return [...pbs].sort((a, b) => {
        if (a.date === null && b.date === null) return 0
        if (a.date === null) return 1
        if (b.date === null) return -1

        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    }

    return pbs
  }, [runs, playerName, pbCategory, pbRankSort, pbDateSort])

  const swiftMapPBs = useMemo(() => {
    const pbs = swiftLeaderboards.map((leaderboard) => {
      const playerRun =
        leaderboard.entries.find(
          (entry) =>
            entry.player.trim().toLowerCase() === playerName.trim().toLowerCase()
        ) ?? null

      if (!playerRun) {
        return {
          map: leaderboard.map,
          dataVer: leaderboard.dataVer,
          rank: null,
          timeText: null,
          date: null,
        }
      }

      return {
        map: leaderboard.map,
        dataVer: leaderboard.dataVer,
        rank: playerRun.rank,
        timeText: playerRun.timeText,
        date: playerRun.updatedAt ? playerRun.updatedAt.split("T")[0] : null,
      }
    })

    if (pbRankSort === "asc") {
      return [...pbs].sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0
        if (a.rank === null) return 1
        if (b.rank === null) return -1

        return a.rank - b.rank
      })
    }

    if (pbRankSort === "desc") {
      return [...pbs].sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0
        if (a.rank === null) return 1
        if (b.rank === null) return -1

        return b.rank - a.rank
      })
    }

    if (pbDateSort === "asc") {
      return [...pbs].sort((a, b) => {
        if (a.date === null && b.date === null) return 0
        if (a.date === null) return 1
        if (b.date === null) return -1

        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
    }

    if (pbDateSort === "desc") {
      return [...pbs].sort((a, b) => {
        if (a.date === null && b.date === null) return 0
        if (a.date === null) return 1
        if (b.date === null) return -1

        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    }

    return pbs
  }, [swiftLeaderboards, playerName, pbRankSort, pbDateSort])

  useEffect(() => {
    async function loadProfile() {
      if (loading || !playerName) {
        setProfilePictureUrl(null)
        setBio("")
        setGoal1("")
        setGoal2("")
        setGoal3("")
        setCountryCode("")
        setCountryName("")
        return
      }

      const supabase = createClient()

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          profile_picture_url,
          bio,
          goal_1,
          goal_2,
          goal_3,
          country_code,
          country_name
        `
        )
        .eq("player_name", playerName)
        .maybeSingle()

      setProfilePictureUrl(profile?.profile_picture_url || null)
      setBio(profile?.bio || "")
      setGoal1(profile?.goal_1 || "")
      setGoal2(profile?.goal_2 || "")
      setGoal3(profile?.goal_3 || "")
      setCountryCode(profile?.country_code || "")
      setCountryName(profile?.country_name || "")
    }

    loadProfile()
  }, [loading, playerName])

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p>Loading player...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-center gap-6">
        <PlayerProfilePicture
          player={playerName}
          src={profilePictureUrl ?? undefined}
          size={72}
        />

        <h1 className="text-3xl font-bold text-white">{playerName}</h1>

        {countryName && countryCode && (
          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
            <img
              src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
              alt={countryName}
              className="h-4 w-6 rounded-sm object-cover"
            />

            <span>{countryName}</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <StatSelector
          options={playerProfileTabs}
          stat={tab}
          setStat={(value) => setTab(value as PlayerProfileTab)}
        />
      </div>

      <section className="mt-8">
        {tab === "overview" && (
          <div className="w-full">
            <div className="w-full">
              <p className="text-base text-white">{bio || ""}</p>
            </div>

            <div
              style={{
                width: "100%",
                height: "1px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                marginTop: "12px",
              }}
            />

            <div
              style={{
                paddingTop: "36px",
                display: "grid",
                gridTemplateColumns:
                  goals.length > 0 ? "320px 1fr 320px" : "320px 1fr",
                gap: "32px",
                width: "100%",
              }}
            >
              <div
                style={{
                  padding: "15px",
                }}
                className="rounded-lg border border-white/10"
              >
                <h2 className="mb-3 text-lg font-bold text-white">Stats</h2>

                <div className="text-white">
                  <span className="font-bold">Total Submissions:</span>{" "}
                  {totalSubmissions}
                </div>

                <div className="mt-2 text-white">
                  <span className="font-bold">Career:</span>{" "}
                  {careerActivity
                    ? `${careerActivity.first
                        .toISOString()
                        .slice(0, 10)} — ${careerActivity.latest
                        .toISOString()
                        .slice(0, 10)}`
                    : "--"}
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  width: "100%",
                }}
                className="min-h-[160px] rounded-lg border border-white/10"
              >
                <h2 className="mb-3 text-lg font-bold text-white">Rankings</h2>

                <div className="grid gap-2">
                  {profileRankings.map((ranking, index) => (
                    <div
                      key={ranking.category}
                      className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-white"
                    >
                      <div className="flex items-center gap-2">
                        <span className={index < 4 ? "font-bold" : ""}>
                          {ranking.category}
                        </span>

                        <TagBubble
                          tone={ranking.stat === "ap" ? "white" : "blue"}
                          size="sm"
                        >
                          {ranking.stat.toUpperCase()}
                        </TagBubble>
                      </div>

                      {ranking.entry && ranking.rank !== null ? (
                        <span className="font-bold">
                          <span
                            style={{
                              color: getRankColor(ranking.rank - 1),
                            }}
                          >
                            {formatHoFRank(ranking.rank, ranking.stat)}
                          </span>{" "}
                          ·{" "}
                          {formatHoFValue(
                            ranking.entry.value,
                            ranking.category,
                            ranking.stat
                          )}{" "}
                          <span className="text-xs font-normal text-zinc-400">
                            ({ranking.mapsSubmitted}/{ranking.totalMaps})
                          </span>
                        </span>
                      ) : (
                        <span className="text-zinc-500">--</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {goals.length > 0 && (
                <aside
                  style={{
                    padding: "15px",
                  }}
                  className="rounded-lg border border-white/10"
                >
                  <h2 className="mb-4 text-lg font-bold text-white">Goals</h2>

                  <div className="grid gap-3">
                    {goals.map((goal, index) => (
                      <div
                        key={index}
                        className="min-h-24 rounded-lg border border-white/10 p-3 text-white"
                      >
                        {goal}
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}

        {tab === "pbs" && (
          <div className="w-full">
            <div className="mb-4 flex justify-center">
              <div className="mb-4 flex justify-center">
  <GameSwitcherButton
    game={pbGame === "speed-race" ? "sr" : "swift"}
    onGameChange={(game) => {
      setPbGame(game === "sr" ? "speed-race" : "swift")
      setPbRankSort(null)
      setPbDateSort(null)
      setHoveredDate(null)
    }}
  />
</div>
            </div>

            {pbGame === "speed-race" && (
              <>
                <CategorySelector
                  categories={rankingCategories}
                  category={pbCategory}
                  setCategory={setPbCategory}
                />

                <div className="overflow-hidden rounded-lg border border-white/10">
                  <table className="w-full border-collapse text-left text-white">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-4 py-3 font-bold">Map</th>
                        <th className="px-4 py-3 font-bold">PB</th>

                        <th className="px-4 py-3 font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setPbDateSort(null)

                              setPbRankSort((current) => {
                                if (current === null) return "asc"
                                if (current === "asc") return "desc"

                                return null
                              })
                            }}
                            className="flex items-center gap-1 font-bold"
                          >
                            <span>Rank</span>
                            <span className="font-normal">
                              {pbRankSort === "asc"
                                ? "↑"
                                : pbRankSort === "desc"
                                  ? "↓"
                                  : "−"}
                            </span>
                          </button>
                        </th>

                        <th className="px-4 py-3 font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setPbRankSort(null)

                              setPbDateSort((current) => {
                                if (current === null) return "asc"
                                if (current === "asc") return "desc"

                                return null
                              })
                            }}
                            className="flex items-center gap-1 font-bold"
                          >
                            <span>Date</span>
                            <span className="font-normal">
                              {pbDateSort === "asc"
                                ? "↑"
                                : pbDateSort === "desc"
                                  ? "↓"
                                  : "−"}
                            </span>
                          </button>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {mapPBs.map((pb) => (
                        <tr
                          key={pb.map}
                          className={`border-t border-white/10 ${
                            pb.time === null ? "bg-red-950/40" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <a
                              href={`/lb/${getMapSlug(pb.map)}`}
                              className="flex items-center gap-3 font-bold hover:underline"
                            >
                              <img
                                src={`/maps/${getMapSlug(pb.map)}.png`}
                                alt={pb.map}
                                className="h-10 w-10 object-cover"
                              />

                              <span>{pb.map}</span>
                            </a>
                          </td>

                          <td className="px-4 py-3 font-bold">
                            <div className="flex items-center gap-2">
                              <span>
                                {pb.time !== null
                                  ? formatTime(pb.time, pbCategory)
                                  : "--"}
                              </span>

                              {pb.proof && (
                                <a
                                  href={pb.proof}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src="/video.png"
                                    alt="Proof"
                                    className="h-4 w-auto"
                                  />
                                </a>
                              )}
                            </div>
                          </td>

                          <td
                            className="px-4 py-3 font-bold"
                            style={{
                              color:
                                pb.rank !== null
                                  ? getRankColor(pb.rank - 1, "#ffffff")
                                  : "#71717a",
                            }}
                          >
                            {pb.rank !== null ? pb.rank : "--"}
                          </td>

                          <td className="relative px-4 py-3 text-white">
                            {pb.date ? (
                              <span
                                onMouseEnter={() => setHoveredDate(pb.map)}
                                onMouseLeave={() => setHoveredDate(null)}
                                className="relative inline-block"
                              >
                                {formatDate(pb.date).display}

                                {hoveredDate === pb.map && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "24px",
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      border:
                                        "1px solid rgba(255, 255, 255, 0.25)",
                                      borderRadius: "8px",
                                      backgroundColor: "#000000",
                                      color: "#ffffff",
                                      fontSize: "14px",
                                      fontWeight: 400,
                                      padding: "4px 8px",
                                      whiteSpace: "nowrap",
                                      zIndex: 50,
                                    }}
                                  >
                                    {formatDate(pb.date).tooltip}
                                  </div>
                                )}
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {pbGame === "swift" && (
              <div className="overflow-hidden rounded-lg border border-white/10">
                {swiftLoading ? (
                  <div className="p-4 text-zinc-400">Loading Swift PBs...</div>
                ) : (
                  <table className="w-full border-collapse text-left text-white">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-4 py-3 font-bold">Map</th>
                        <th className="px-4 py-3 font-bold">PB</th>

                        <th className="px-4 py-3 font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setPbDateSort(null)

                              setPbRankSort((current) => {
                                if (current === null) return "asc"
                                if (current === "asc") return "desc"

                                return null
                              })
                            }}
                            className="flex items-center gap-1 font-bold"
                          >
                            <span>Rank</span>
                            <span className="font-normal">
                              {pbRankSort === "asc"
                                ? "↑"
                                : pbRankSort === "desc"
                                  ? "↓"
                                  : "−"}
                            </span>
                          </button>
                        </th>

                        <th className="px-4 py-3 font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setPbRankSort(null)

                              setPbDateSort((current) => {
                                if (current === null) return "asc"
                                if (current === "asc") return "desc"

                                return null
                              })
                            }}
                            className="flex items-center gap-1 font-bold"
                          >
                            <span>Date</span>
                            <span className="font-normal">
                              {pbDateSort === "asc"
                                ? "↑"
                                : pbDateSort === "desc"
                                  ? "↓"
                                  : "−"}
                            </span>
                          </button>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {swiftMapPBs.map((pb) => (
                        <tr
                          key={pb.dataVer}
                          className={`border-t border-white/10 ${
                            pb.timeText === null ? "bg-red-950/40" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <a
                              href={`/swift/lb/${getMapSlug(pb.map)}`}
                              className="flex items-center gap-3 font-bold hover:underline"
                            >
                              <img
                                src={`/maps/${getMapSlug(pb.map)}.png`}
                                alt={pb.map}
                                className="h-10 w-10 object-cover"
                              />

                              <span>{pb.map}</span>
                            </a>
                          </td>

                          <td className="px-4 py-3 font-bold">
                            {pb.timeText ?? "--"}
                          </td>

                          <td
                            className="px-4 py-3 font-bold"
                            style={{
                              color:
                                pb.rank !== null
                                  ? getRankColor(pb.rank - 1, "#ffffff")
                                  : "#71717a",
                            }}
                          >
                            {pb.rank !== null ? pb.rank : "--"}
                          </td>

                          <td className="relative px-4 py-3 text-white">
                            {pb.date ? (
                              <span
                                onMouseEnter={() =>
                                  setHoveredDate(`swift-${pb.map}`)
                                }
                                onMouseLeave={() => setHoveredDate(null)}
                                className="relative inline-block"
                              >
                                {formatDate(pb.date).display}

                                {hoveredDate === `swift-${pb.map}` && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "24px",
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      border:
                                        "1px solid rgba(255, 255, 255, 0.25)",
                                      borderRadius: "8px",
                                      backgroundColor: "#000000",
                                      color: "#ffffff",
                                      fontSize: "14px",
                                      fontWeight: 400,
                                      padding: "4px 8px",
                                      whiteSpace: "nowrap",
                                      zIndex: 50,
                                    }}
                                  >
                                    {formatDate(pb.date).tooltip}
                                  </div>
                                )}
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}