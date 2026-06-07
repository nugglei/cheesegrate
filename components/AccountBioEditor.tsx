"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Props = {
  userId: string
  initialBio?: string
}

export default function AccountBioEditor({ userId, initialBio = "" }: Props) {
  const [bio, setBio] = useState(initialBio)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveBio() {
    setSaving(true)
    setSaved(false)

    const supabase = createClient()

    await supabase
      .from("profiles")
      .update({ bio })
      .eq("id", userId)

    setSaving(false)
    setSaved(true)
  }

  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "24px" }}>
      <label style={{ fontWeight: 700 }} htmlFor="bio">
        Bio
      </label>

      <textarea
        id="bio"
        value={bio}
        onChange={(event) => {
          setBio(event.target.value)
          setSaved(false)
        }}
        maxLength={240}
        placeholder="Write a bio..."
        style={{
          minHeight: "96px",
          resize: "vertical",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          padding: "10px",
          outline: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={saveBio}
          disabled={saving}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save bio"}
        </button>

        <span style={{ fontSize: "13px", color: "rgb(161 161 170)" }}>
          240
        </span>

        {saved && (
          <span style={{ fontSize: "13px", color: "rgb(74 222 128)" }}>
            Saved bio!
          </span>
        )}
      </div>
    </div>
  )
}