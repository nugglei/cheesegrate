"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"
import StatSelector from "@/components/StatSelector"
import { useRuns } from "@/hooks/useRuns"
import { getMapsForCategory } from "@/lib/categoryMaps"
import {
  formatHoFRank,
  formatHoFValue,
  getHoFEntries,
} from "@/lib/hof"
import { getRankColor } from "@/lib/rankColors"
import { slugify } from "@/lib/slug"
import { createClient } from "@/lib/supabase/client"
import TagBubble from "@/components/TagBubble"

type PlayerProfileTab = "overview" | "rankings" | "pbs" | "tournaments"

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
  "Glitch"
]

export default function PlayerProfilePage() {
  const params = useParams()
  const { runs, loading } = useRuns()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [bio, setBio] = useState("")
  const [goal1, setGoal1] = useState("")
  const [goal2, setGoal2] = useState("")
  const [goal3, setGoal3] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [countryName, setCountryName] = useState("")
  const [tab, setTab] = useState<PlayerProfileTab>("overview")

  const playerSlug = String(params.player ?? "")

  const playerName = useMemo(() => {
    const matchingRun = runs.find((run) => slugify(run.player) === playerSlug)

    return matchingRun?.player ?? decodeURIComponent(String(params.player ?? ""))
  }, [runs, playerSlug, params.player])

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
        .select(`
          profile_picture_url,
          bio,
          goal_1,
          goal_2,
          goal_3,
          country_code,
          country_name
        `)
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
              <p className="text-base text-white">
                {bio || ""}
              </p>
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
                <h2 className="mb-3 text-lg font-bold text-white">
                  Stats
                </h2>

                <div className="text-white">
  <span className="font-bold">Total Submissions:</span>{" "}
  {totalSubmissions}
</div>

<div className="mt-2 text-white">
  <span className="font-bold">Career:</span>{" "}
  {careerActivity
    ? `${careerActivity.first.toISOString().slice(0, 10)} — ${careerActivity.latest.toISOString().slice(0, 10)}`
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
                <h2 className="mb-3 text-lg font-bold text-white">
                  Rankings
                </h2>

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

  <TagBubble tone={ranking.stat === "ap" ? "white" : "blue"} size="sm">
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
      </section>
    </main>
  )
}