"use client"

import { useEffect, useState } from "react"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"
import { createClient } from "@/lib/supabase/client"
import MapSearch from "@/components/MapSearch"
import CategorySearch from "@/components/CategorySearch"
import TagBubble from "@/components/TagBubble"
import { useRuns } from "@/hooks/useRuns"
import { getProjectedRank } from "@/lib/leaderboards"
import { getRankColor } from "@/lib/rankColors"
import { useRouter } from "next/navigation"
import PlayerSearchAdvanced from "@/components/PlayerSearchAdvanced"
import { getKnownPlayerNames } from "@/lib/players"

export default function SubmitPage() {
  const supabase = createClient()
  const router = useRouter()
const { runs, loading: runsLoading } = useRuns()
  const [player, setPlayer] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [map, setMap] = useState("")
  const [category, setCategory] = useState("")
  const [time, setTime] = useState("")
  const [proof, setProof] = useState("")
  const [date, setDate] = useState("")
  const [notes, setNotes] = useState("")
const [isMobile, setIsMobile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
const [egtTime, setEgtTime] = useState("")
const [players, setPlayers] = useState<string[]>([])

const projectedRank = getProjectedRank(runs, map, category, time)
const projectedRankColor =
  projectedRank !== null ? getRankColor(projectedRank - 1) : "#ffffff"

const isDoubleSubmission =
  category === "Skip IGT + EGT" || category === "Skipless IGT + EGT"

const igtProjectedRank = isDoubleSubmission
  ? getProjectedRank(
      runs,
      map,
      category === "Skip IGT + EGT" ? "Skip IGT" : "Skipless IGT",
      time
    )
  : projectedRank

const egtProjectedRank = isDoubleSubmission
  ? getProjectedRank(
      runs,
      map,
      category === "Skip IGT + EGT" ? "Skip EGT" : "Skipless EGT",
      egtTime
    )
  : null

const discordProjectedRank = isDoubleSubmission
  ? `${igtProjectedRank}/${egtProjectedRank}`
  : projectedRank
  
useEffect(() => {
  async function loadPlayer() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const { data } = await supabase
      .from("profiles")
      .select("player_name, role, profile_picture_url")
      .eq("id", user.id)
      .single()

    setPlayer(data?.player_name ?? "")
    setProfilePictureUrl(data?.profile_picture_url ?? null)
    setIsAdmin(data?.role === "admin")
    setIsLoadingPlayer(false)
  }

  loadPlayer()
}, [supabase, router])

useEffect(() => {
  async function loadPlayers() {
    const playerNames = await getKnownPlayerNames()
    setPlayers(playerNames)
  }

  loadPlayers()
}, [])

useEffect(() => {
  async function loadSelectedPlayerProfilePicture() {
    if (!isAdmin || !player.trim()) return

    const { data } = await supabase
      .from("profiles")
      .select("profile_picture_url")
      .eq("player_name", player.trim())
      .maybeSingle()

    setProfilePictureUrl(data?.profile_picture_url ?? null)
  }

  loadSelectedPlayerProfilePicture()
}, [isAdmin, player, supabase])

async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setMessage("")
  setIsSubmitting(true)

  const isDoubleSubmission =
    category === "Skip IGT + EGT" || category === "Skipless IGT + EGT"

  const submissionGroup = isDoubleSubmission ? crypto.randomUUID() : null

  const baseSubmission = {
    player: player.trim(),
    map: map.trim(),
    proof: proof.trim(),
    date: date || null,
    tag: isMobile ? "Mobile" : null,
    notes: notes.trim() || null,
    status: "pending",
    submission_group: submissionGroup,
  }

  const submissionsToInsert =
    category === "Skip IGT + EGT"
      ? [
          {
            ...baseSubmission,
            category: "Skip IGT",
            time: time.trim(),
          },
          {
            ...baseSubmission,
            category: "Skip EGT",
            time: egtTime.trim(),
          },
        ]
      : category === "Skipless IGT + EGT"
      ? [
          {
            ...baseSubmission,
            category: "Skipless IGT",
            time: time.trim(),
          },
          {
            ...baseSubmission,
            category: "Skipless EGT",
            time: egtTime.trim(),
          },
        ]
      : [
          {
            ...baseSubmission,
            category,
            time: time.trim(),
          },
        ]

  const { error } = await supabase.from("submissions").insert(submissionsToInsert)

  setIsSubmitting(false)

  if (error) {
    setMessage("Submission failed. Try again.")
    console.error(error)
    return
  }

  await fetch("/api/discord/submission", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    player: player.trim(),
    map: map.trim(),
    category,
    time: isDoubleSubmission ? `${time}/${egtTime}` : time.trim(),
    proof: proof.trim(),
    date: date || null,
    tag: isMobile ? "Mobile" : null,
    projectedRank: discordProjectedRank,
  }),
})

 setMessage(
  isDoubleSubmission
    ? `Submitted ${map} ${time} IGT + ${egtTime} EGT`
    : `Submitted ${map} ${time} ${category}`
)

  setMap("")
  setCategory("")
  setTime("")
  setEgtTime("")
  setProof("")
  setDate("")
  setNotes("")
  setIsMobile(false)
}

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold">Submit to Cheesegrate</h1>

      <p className="mt-2 text-sm text-zinc-400">
        Submit a run to our community leaderboards!
      </p>

<a
  href="https://docs.google.com/document/d/1uEB2hUhOTcl51appig-cyfPM14Mc0dytzr3RCW1z4RI/edit?usp=sharing"
  target="_blank"
  rel="noopener noreferrer"
  className="mt-4 inline-flex w-fit rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
>
  Rulebook
</a>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-300">Player</span>

          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
           <PlayerProfilePicture
  player={player}
  src={profilePictureUrl ?? undefined}
  size={36}
/>

            {isAdmin ? (
  <PlayerSearchAdvanced
    value={player}
    onChange={setPlayer}
    players={players}
  />
) : (
  <span className="text-sm font-medium text-white">
    {isLoadingPlayer ? "Loading player..." : player || "No player linked"}
  </span>
)}
          </div>
        </label>

       <label className="grid gap-2">
  <span className="text-sm font-medium text-zinc-300">Map</span>

  <MapSearch selectedMap={map} onSelectMap={setMap} />
</label>

       <label className="grid gap-2">
  <span className="text-sm font-medium text-zinc-300">Category</span>

  <CategorySearch
    selectedCategory={category}
    onSelectCategory={setCategory}
  />
</label>

        {isDoubleSubmission ? (
  <div className="grid gap-4 sm:grid-cols-2">
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-300">IGT Time</span>

      <input
        value={time}
        onChange={(event) => setTime(event.target.value)}
        required
        placeholder="x.x"
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-white/30"
      />
    </label>

    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-300">EGT Time</span>

      <input
        value={egtTime}
        onChange={(event) => setEgtTime(event.target.value)}
        required
        placeholder="xx.xxx"
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-white/30"
      />
    </label>
  </div>
) : (
  <div className="grid w-full items-end gap-4" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
  <label className="grid gap-2">
    <span className="text-sm font-medium text-zinc-300">Time</span>

    <input
      value={time}
      onChange={(event) => setTime(event.target.value)}
      required
      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-white/30"
    />
  </label>

  <div className="grid w-fit shrink-0 gap-1">
  <span className="text-xs font-medium text-zinc-400">Projected Rank</span>

  <div
  className="flex h-[38px] min-w-[80px] items-center justify-center rounded-md border border-white/10 bg-black/30 px-3 text-base font-bold"
  style={{ color: projectedRankColor }}
>
  {!runsLoading && projectedRank !== null ? projectedRank : "\u00A0"}
</div>
</div>
</div>
)}

        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-300">Proof</span>
          <input
            value={proof}
            onChange={(event) => setProof(event.target.value)}
            required
            placeholder="Video link — preferably YouTube"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
          />
        </label>

<label className="grid gap-2">
  <span className="text-sm font-medium text-zinc-300">Date</span>

  <input
    type={date ? "date" : "text"}
    value={date}
    onFocus={(event) => {
      event.currentTarget.type = "date"
    }}
    onChange={(event) => setDate(event.target.value)}
    placeholder="mm/dd/yyyy"
    required
    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-white/30"
  />
</label>

        <label className="grid gap-2">
  <span className="text-sm font-medium text-zinc-300">Tags (click to select)</span>

  <button
    type="button"
    onClick={() => setIsMobile((current) => !current)}
    className="w-fit"
  >
    <TagBubble tone={isMobile ? "green" : "white"} size="md">
      Mobile
    </TagBubble>
  </button>
</label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-300">Notes for verifiers</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
          />
        </label>

        <button
  type="submit"
  disabled={isSubmitting || isLoadingPlayer || !player.trim()}
  className="rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
  style={{
    border: "1px solid rgba(74, 222, 128, 0.3)",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    color: "#86efac",
  }}
>
  {isSubmitting ? "Submitting..." : "Submit Run"}
</button>

        {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  )
}