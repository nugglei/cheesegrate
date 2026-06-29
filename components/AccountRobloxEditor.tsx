"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

type Props = {
  userId: string
}

type SwiftLbRow = {
  player: string | null
}

export default function AccountRobloxEditor({ userId }: Props) {
  const [roblox, setRoblox] = useState("")
  const [search, setSearch] = useState("")
  const [players, setPlayers] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linked, setLinked] = useState(false)

  useEffect(() => {
    async function loadRoblox() {
      setLoading(true)

      const supabase = createClient()

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("roblox")
        .eq("id", userId)
        .maybeSingle()

      if (profileError) {
        console.error("Loaded roblox failed:", profileError)
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase env")
        setLoading(false)
        return
      }

      const swiftSupabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

      const { data: swiftData, error: swiftError } = await swiftSupabase
        .from("swift_lbs")
        .select("player")
        .order("player", { ascending: true })
        .limit(10000)

      if (swiftError) {
        console.error("Loaded Swift players failed:", swiftError)
      }

      const uniquePlayers = Array.from(
        new Set(
          ((swiftData ?? []) as SwiftLbRow[])
            .map((row) => row.player)
            .filter((player): player is string => typeof player === "string")
            .map((player) => player.trim())
            .filter(Boolean)
        )
      )

      console.log("Swift players loaded:", uniquePlayers)

      setRoblox(profileData?.roblox || "")
      setPlayers(uniquePlayers)
      setSearch("")
      setLoading(false)
    }

    loadRoblox()
  }, [userId])

  const isLocked = Boolean(roblox)

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return players.slice(0, 8)
    }

    return players
      .filter((player) => player.toLowerCase().includes(query))
      .slice(0, 8)
  }, [players, search])

  async function saveRoblox(nextRoblox: string) {
    if (isLocked) return

    const selectedRoblox = nextRoblox.trim()

    if (!selectedRoblox) return

    setSaving(true)
    setLinked(false)

    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        roblox: selectedRoblox,
      })
      .eq("id", userId)

    if (error) {
      console.error("Roblox save failed:", error)
      setSaving(false)
      return
    }

    setRoblox(selectedRoblox)
    setSearch("")
    setIsOpen(false)
    setSaving(false)
    setLinked(true)
  }

  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "24px" }}>
      <label style={{ fontWeight: 700 }} htmlFor="roblox">
        Link Swift
      </label>

      <div className="w-full max-w-md">
        <input
          id="roblox"
          type="text"
          value={isLocked ? roblox : search}
          onChange={(event) => {
            if (isLocked) return

            setSearch(event.target.value)
            setIsOpen(true)
            setLinked(false)
          }}
          onFocus={() => {
            if (!isLocked) {
              setIsOpen(true)
            }
          }}
          disabled={loading || isLocked}
          placeholder={
            loading ? "Loading Swift username..." : "Search Swift username..."
          }
          className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
        />

        {!isLocked && isOpen && search.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => saveRoblox(player)}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                >
                  {player}
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-400">
                No players found.
              </div>
            )}
          </div>
        )}
      </div>

      {saving && <p className="text-sm text-zinc-400">Saving...</p>}

      {linked && (
  <p style={{ fontSize: "13px", color: "rgb(74 222 128)" }}>
    Linked!
  </p>
)}
    </div>
  )
}