// app/admin/verify/page.tsx

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"
import { createClient } from "@/lib/supabase/client"
import { slugify } from "@/lib/slug"

type SubmissionStatus = "pending" | "on_hold" | "declined"

type Submission = {
  id: string
  player: string
  map: string
  category: string
  time: string
  proof: string | null
  date: string | null
  notes: string | null
  status: SubmissionStatus | null
  decline_reason: string | null
}

type Profile = {
  player_name: string | null
  profile_picture_url: string | null
}

type EditDraft = {
  player: string
  map: string
  category: string
  time: string
  proof: string
  date: string
  notes: string
}

const EGT_RETIME_URL = "https://somewes.com/frame-count/"

function shouldShowEgtButton(category: string) {
  return category === "Skip EGT" || category === "Skipless EGT"
}

function isValidUrl(value: string | null) {
  if (!value) return false

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const statusLabels: Record<SubmissionStatus, string> = {
  pending: "Pending",
  on_hold: "On Hold",
  declined: "Declined",
}

function makeEditDraft(submission: Submission): EditDraft {
  return {
    player: submission.player,
    map: submission.map,
    category: submission.category,
    time: submission.time,
    proof: submission.proof ?? "",
    date: submission.date ?? "",
    notes: submission.notes ?? "",
  }
}

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [profilePictures, setProfilePictures] = useState<Record<string, string>>(
    {}
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isHandling, setIsHandling] = useState<string | null>(null)
 const [editingId, setEditingId] = useState<string | null>(null)
const [decliningId, setDecliningId] = useState<string | null>(null)
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({})
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({})
  const [showDeclined, setShowDeclined] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      // 1. Logged-in check
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 2. Admin check
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        router.push("/forbidden")
        return
      }

      // 3. Load submissions
      const { data, error } = await supabase.from("submissions").select("*")

      if (!isMounted) return

      if (error) {
        console.error("Failed to load submissions", error)
        setIsLoading(false)
        return
      }

      const loadedSubmissions = (data ?? []) as Submission[]
      setSubmissions(loadedSubmissions)

      // 4. Load profile pictures for submitted players
      const playerNames = Array.from(
        new Set(
          loadedSubmissions
            .map((submission) => submission.player)
            .filter(Boolean)
        )
      )

      if (playerNames.length === 0) {
        setProfilePictures({})
        setIsLoading(false)
        return
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("player_name, profile_picture_url")
        .in("player_name", playerNames)

      if (!isMounted) return

      if (profilesError) {
        console.error("Failed to load profile pictures", profilesError)
        setIsLoading(false)
        return
      }

      const nextProfilePictures: Record<string, string> = {}

      ;((profiles ?? []) as Profile[]).forEach((profile) => {
        if (profile.player_name && profile.profile_picture_url) {
          nextProfilePictures[profile.player_name] =
            profile.profile_picture_url
        }
      })

      setProfilePictures(nextProfilePictures)
      setIsLoading(false)
    }

    loadPage()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  function startEditing(submission: Submission) {
    setEditingId(submission.id)
    setEditDrafts((current) => ({
      ...current,
      [submission.id]: makeEditDraft(submission),
    }))
  }

  function cancelEditing(id: string) {
    setEditingId(null)
    setEditDrafts((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function updateEditDraft(
    id: string,
    field: keyof EditDraft,
    value: string
  ) {
    setEditDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }))
  }

  async function saveEdits(submission: Submission) {
    const draft = editDrafts[submission.id]
    if (!draft) return

    setIsHandling(submission.id)

    const updatedSubmission = {
  player: draft.player.trim(),
  map: draft.map.trim(),
  category: draft.category.trim(),
  time: draft.time.trim(),
  proof: draft.proof.trim() || null,
  date: draft.date.trim() || null,
  notes: draft.notes.trim() || null,
}

    const { error } = await supabase
      .from("submissions")
      .update(updatedSubmission)
      .eq("id", submission.id)

    if (error) {
      console.error("Failed to save edits", error)
      setIsHandling(null)
      return
    }

    setSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id
          ? {
              ...item,
              ...updatedSubmission,
            }
          : item
      )
    )

    setEditingId(null)
    setIsHandling(null)
  }

  async function approveSubmission(submission: Submission) {
    setIsHandling(submission.id)

    // 5. Approve = insert into runs
    const { error: insertError } = await supabase.from("runs").insert({
      player: submission.player,
      map: submission.map,
      category: submission.category,
      time: submission.time,
      proof: submission.proof,
      date: submission.date,
    })

    if (insertError) {
      console.error("Failed to approve submission", insertError)
      setIsHandling(null)
      return
    }

    // 6. Then delete from submissions queue
    const { error: deleteError } = await supabase
      .from("submissions")
      .delete()
      .eq("id", submission.id)

    if (deleteError) {
      console.error("Approved run, but failed to delete submission", deleteError)
      setIsHandling(null)
      return
    }

    setSubmissions((current) =>
      current.filter((item) => item.id !== submission.id)
    )
    setIsHandling(null)
  }

  async function updateStatus(
    id: string,
    status: SubmissionStatus,
    declineReason: string | null = null
  ) {
    setIsHandling(id)

    // 7. Hold/decline/pending = update submission status
    const { error } = await supabase
      .from("submissions")
      .update({
        status,
        decline_reason: declineReason,
      })
      .eq("id", id)

    if (error) {
      console.error("Failed to update submission status", error)
      setIsHandling(null)
      return
    }

    setSubmissions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              decline_reason: declineReason,
            }
          : item
      )
    )

    setIsHandling(null)
  }

  function getSubmissionsByStatus(status: SubmissionStatus) {
    return submissions.filter((submission) =>
      status === "pending"
        ? submission.status === "pending" || submission.status === null
        : submission.status === status
    )
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10 text-white">
        Loading submissions...
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-white">
      <h1 className="text-3xl font-bold">Verify Runs</h1>

      <p className="mt-2 text-sm text-zinc-400">
        Approve runs onto Cheesegrate.
      </p>

      <div className="mt-8 grid gap-8">
        {(["pending", "on_hold", "declined"] as SubmissionStatus[]).map(
          (status) => {
            const statusSubmissions = getSubmissionsByStatus(status)

            return (
              <section key={status} className="grid gap-3">
                {/* Status header */}
                <div className="flex items-center gap-3">
  <h2 className="text-xl font-bold">
    {statusLabels[status]}{" "}
    <span className="text-sm font-normal text-zinc-500">
      ({statusSubmissions.length})
    </span>
  </h2>

  {status === "declined" && (
    <button
      type="button"
      onClick={() => setShowDeclined((current) => !current)}
      className="rounded border border-white/15 bg-white/10 px-2 py-1 text-sm font-semibold text-white hover:bg-white/15"
    >
      {showDeclined ? "Hide ▲" : "Show ▼"}
    </button>
  )}
</div>

                {status === "declined" && !showDeclined ? null : statusSubmissions.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-500">
                    No {statusLabels[status].toLowerCase()} submissions.
                  </div>
                ) : (
                  statusSubmissions.map((submission) => {
                    const isEditing = editingId === submission.id
                    const draft =
                      editDrafts[submission.id] ?? makeEditDraft(submission)

                    return (
                      <div
                        key={submission.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
                      >
                        {/* Card split: info left, buttons right */}
                        {/* Card split: info left, note middle, buttons right */}
<div
  className="grid gap-6"
  style={{
    gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 320px) 260px",
  }}
>
                          {/* Left column */}
                          {/* Left column */}
<div className="min-w-0">
                            {/* Player row only */}
                            <div className="flex items-center gap-3">
                              <PlayerProfilePicture
                                player={submission.player}
                                src={profilePictures[submission.player]}
                                size={44}
                              />

                              {isEditing ? (
                                <input
                                  value={draft.player}
                                  onChange={(event) =>
                                    updateEditDraft(
                                      submission.id,
                                      "player",
                                      event.target.value
                                    )
                                  }
                                  className="w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-2xl font-bold text-white outline-none focus:border-white/30"
                                />
                              ) : (
                                <Link
                                  href={`/player/${slugify(submission.player)}`}
                                  className="block text-2xl font-bold leading-tight text-white hover:underline"
                                >
                                  {submission.player}
                                </Link>
                              )}
                            </div>

                            {/* Submission details */}
                            {isEditing ? (
                              <div
                                className="grid max-w-xl gap-2 text-base leading-snug text-zinc-300"
                                style={{ marginTop: "26px" }}
                              >
                                <input
                                  value={draft.map}
                                  onChange={(event) =>
                                    updateEditDraft(
                                      submission.id,
                                      "map",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Map"
                                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
                                />

                                <input
                                  value={draft.category}
                                  onChange={(event) =>
                                    updateEditDraft(
                                      submission.id,
                                      "category",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Category"
                                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
                                />

                                <input
                                  value={draft.time}
                                  onChange={(event) =>
                                    updateEditDraft(
                                      submission.id,
                                      "time",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Time"
                                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-bold text-white outline-none focus:border-white/30"
                                />

                                <input
                                  value={draft.date}
                                  onChange={(event) =>
                                    updateEditDraft(
                                      submission.id,
                                      "date",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Date"
                                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
                                />

                                <input
                                  value={draft.proof}
                                  onChange={(event) =>
                                    updateEditDraft(
                                      submission.id,
                                      "proof",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Proof URL"
                                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
                                />
                              </div>
                            ) : (
                              <>
                                <div
                                  className="grid gap-1 text-base leading-snug text-zinc-300"
                                  style={{ marginTop: "26px" }}
                                >
                                  <p>{submission.map}</p>
                                  <p>{submission.category}</p>
                                  <p className="font-bold text-white">
                                    {submission.time}
                                  </p>
                                  <p>{submission.date || "No date"}</p>
                                </div>

                                {/* Proof URL */}
                                {submission.proof && (
                                  <a
                                    href={submission.proof}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`mt-4 block max-w-xl break-all text-sm ${
  isValidUrl(submission.proof)
    ? "text-blue-200 underline hover:text-blue-200"
    : "text-white"
}`}
                                  >
                                    {submission.proof}
                                  </a>
                                )}
                              </>
                            )}

                            {/* Decline reason */}
                            {submission.status === "declined" &&
                              submission.decline_reason && (
                                <p className="mt-3 max-w-2xl rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                                  {submission.decline_reason}
                                </p>
                              )}
                          </div>

{/* Middle column: note */}
<div>
  {shouldShowEgtButton(submission.category) && (
    <a
      href={EGT_RETIME_URL}
      target="_blank"
      rel="noreferrer"
      className="mb-3 block rounded-lg border border-white-400/30 bg-white-400/1 px-3 py-2 text-center text-sm font-semibold text-white-200 hover:bg-white-400/20"
    >
      Open Somewes
    </a>
  )}
  {isEditing ? (
    <textarea
      value={draft.notes}
      onChange={(event) =>
        updateEditDraft(submission.id, "notes", event.target.value)
      }
      placeholder="Notes — verifiers please sign your notes."
      className="min-h-28 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
    />
  ) : submission.notes ? (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
      {submission.notes}
    </div>
  ) : (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm italic text-zinc-600">
  No note
</div>
  )}
</div>

                          {/* Right column */}
                          <div className="grid min-w-[260px] gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdits(submission)}
                                  disabled={isHandling === submission.id}
                                  className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-400/20 disabled:opacity-50"
                                >
                                  Save
                                </button>

                                <button
                                  onClick={() => cancelEditing(submission.id)}
                                  disabled={isHandling === submission.id}
                                  className="rounded-lg border border-white/1 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditing(submission)}
                                disabled={isHandling === submission.id}
                                className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-400/20 disabled:opacity-50"
                              >
                                Edit
                              </button>
                            )}

                            <button
                              onClick={() => approveSubmission(submission)}
                              disabled={isHandling === submission.id}
                              className="rounded-lg border border-green-400/30 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-200 hover:bg-green-400/20 disabled:opacity-50"
                            >
                              Approve
                            </button>

                            {submission.status !== "on_hold" && (
                              <button
                                onClick={() =>
                                  updateStatus(
                                    submission.id,
                                    "on_hold",
                                    submission.decline_reason
                                  )
                                }
                                disabled={isHandling === submission.id}
                                className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-400/20 disabled:opacity-50"
                              >
                                Hold
                              </button>
                            )}

                            {submission.status !== "pending" && (
                              <button
                                onClick={() =>
                                  updateStatus(submission.id, "pending", null)
                                }
                                disabled={isHandling === submission.id}
                                className="rounded-lg border border-white/1 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
                              >
                                Move to Pending
                              </button>
                            )}

                            {submission.status !== "declined" && decliningId === submission.id ? (
  <>
    <textarea
      value={
        declineReasons[submission.id] ??
        submission.decline_reason ??
        ""
      }
      onChange={(event) =>
        setDeclineReasons((current) => ({
          ...current,
          [submission.id]: event.target.value,
        }))
      }
      placeholder="Decline reason..."
      className="min-h-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
    />

    <button
      onClick={() =>
        updateStatus(
          submission.id,
          "declined",
          declineReasons[submission.id]?.trim() ||
            submission.decline_reason?.trim() ||
            "No reason provided."
        )
      }
      disabled={isHandling === submission.id}
      className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/20 disabled:opacity-50"
    >
      Confirm
    </button>

    <button
      onClick={() => setDecliningId(null)}
      disabled={isHandling === submission.id}
      className="rounded-lg border border-white/1 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
    >
      Cancel
    </button>
  </>
) : submission.status !== "declined" ? (
  <button
    onClick={() => setDecliningId(submission.id)}
    disabled={isHandling === submission.id}
    className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/20 disabled:opacity-50"
  >
    Decline
  </button>
) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </section>
            )
          }
        )}
      </div>
    </main>
  )
}