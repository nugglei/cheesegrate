"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Props = {
  userId: string
  initialGoal1?: string
  initialGoal2?: string
  initialGoal3?: string
}

export default function AccountGoalsEditor({
  userId,
  initialGoal1 = "",
  initialGoal2 = "",
  initialGoal3 = "",
}: Props) {
  const [goal1, setGoal1] = useState(initialGoal1)
  const [goal2, setGoal2] = useState(initialGoal2)
  const [goal3, setGoal3] = useState(initialGoal3)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveGoals() {
    setSaving(true)
    setSaved(false)

    const supabase = createClient()

    await supabase
      .from("profiles")
      .update({
        goal_1: goal1,
        goal_2: goal2,
        goal_3: goal3,
      })
      .eq("id", userId)

    setSaving(false)
    setSaved(true)
  }

  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "24px" }}>
      <label style={{ fontWeight: 700 }}>Goals</label>

      <input
        value={goal1}
        onChange={(event) => {
          setGoal1(event.target.value)
          setSaved(false)
        }}
        maxLength={80}
        placeholder="Rank, AP, WR, PB, etc."
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
      />

      <input
        value={goal2}
        onChange={(event) => {
          setGoal2(event.target.value)
          setSaved(false)
        }}
        maxLength={80}
        placeholder="Rank, AP, WR, PB, etc."
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
      />

      <input
        value={goal3}
        onChange={(event) => {
          setGoal3(event.target.value)
          setSaved(false)
        }}
        maxLength={80}
        placeholder="Rank, AP, WR, PB, etc."
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
      />

      <button
        type="button"
        onClick={saveGoals}
        disabled={saving}
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save goals"}
      </button>

      {saved && (
  <p style={{ fontSize: "13px", color: "rgb(74 222 128)" }}>
    Saved goals!
  </p>
)}
    </div>
  )
}