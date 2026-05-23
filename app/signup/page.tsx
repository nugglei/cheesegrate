"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getKnownPlayerNames } from "@/lib/players"
import PlayerSearchAdvanced from "@/components/PlayerSearchAdvanced"

type SignupMode = "connect" | "create" | null

type ClaimedProfile = {
  id: string
  player_name: string | null
}

const centeredMainStyle: CSSProperties = {
  maxWidth: "620px",
  margin: "80px auto 0",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [discordName, setDiscordName] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [allKnownPlayers, setAllKnownPlayers] = useState<string[]>([])
  const [availableExistingPlayers, setAvailableExistingPlayers] = useState<
    string[]
  >([])
  const [mode, setMode] = useState<SignupMode>(null)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadSignupData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const csvPlayers = await getKnownPlayerNames()

      const { data: claimedProfiles } = await supabase
        .from("profiles")
        .select("id, player_name")

      const profilePlayers = ((claimedProfiles || []) as ClaimedProfile[])
        .map((profile) => profile.player_name?.trim())
        .filter((name): name is string => Boolean(name))

      const allPlayers = Array.from(
        new Set([...csvPlayers, ...profilePlayers])
      ).sort((a, b) => a.localeCompare(b))

      setAllKnownPlayers(allPlayers)

      const claimedNames = new Set(
        ((claimedProfiles || []) as ClaimedProfile[])
          .filter((profile) => profile.id !== user?.id)
          .map((profile) => profile.player_name?.trim())
          .filter((name): name is string => Boolean(name))
      )

      setAvailableExistingPlayers(
        csvPlayers.filter((player) => !claimedNames.has(player))
      )

      if (!user) {
        setIsLoading(false)
        return
      }

      const name =
        user.user_metadata?.preferred_username ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        ""

      setUserId(user.id)
      setDiscordName(name)

      const { data: profile } = await supabase
        .from("profiles")
        .select("player_name")
        .eq("id", user.id)
        .single()

      setPlayerName(profile?.player_name || "")
      setIsLoading(false)
    }

    loadSignupData()
  }, [supabase])

  async function handleDiscordSignup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/signup`,
      },
    })

    if (error) {
      setMessage(error.message)
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) {
      setMessage("You need to connect to Discord first.")
      return
    }

    const cleanedPlayerName = playerName.trim()

    if (!cleanedPlayerName) {
      setMessage(
        "If you do not have an existing profile, create one using Create new profile."
      )
      return
    }

    if (
      mode === "connect" &&
      !availableExistingPlayers.includes(cleanedPlayerName)
    ) {
      setMessage("Player not found. Have you already created an account?")
      return
    }

    if (mode === "create" && allKnownPlayers.includes(cleanedPlayerName)) {
      setMessage(
        "That player already exists in the database; Use connect existing player."
      )
      return
    }

    setIsSaving(true)
    setMessage("")

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username: cleanedPlayerName,
      player_name: cleanedPlayerName,
    })

    if (error) {
      setMessage(error.message)
      setIsSaving(false)
      return
    }

    window.dispatchEvent(new Event("profile-updated"))

router.push("/account")
router.refresh()
  }

  if (isLoading) {
    return (
      <main style={centeredMainStyle}>
        <p>Loading...</p>
      </main>
    )
  }

  if (!userId) {
    return (
      <main style={centeredMainStyle}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "16px" }}>
          Sign up
        </h1>

        <p style={{ marginBottom: "20px", opacity: 0.8, maxWidth: "420px" }}>
          Connect to Discord, then link your Speed Race player profile.
        </p>

        <button
          onClick={handleDiscordSignup}
          type="button"
          style={{
            width: "230px",
            minHeight: "64px",
            border: "1px solid #ffffff33",
            background: "#ffffff12",
            padding: "12px 24px",
            borderRadius: "14px",
            cursor: "pointer",
            boxShadow: "0 8px 24px #00000033",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/dc.png"
            alt="Connect Discord"
            width={180}
            height={40}
            style={{
              width: "180px",
              height: "auto",
              borderRadius: "8px",
              display: "block",
            }}
            priority
          />
        </button>

        <Link
          href="/login"
          style={{
            marginTop: "16px",
            fontSize: "14px",
            color: "#d4d4d8",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Already have an account? Log in
        </Link>

        {message && <p style={{ marginTop: "14px" }}>{message}</p>}
      </main>
    )
  }

  return (
    <main style={centeredMainStyle}>
      <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "12px" }}>
        Sign up
      </h1>

      <p style={{ marginBottom: "24px", opacity: 0.8 }}>
        Discord connected as{" "}
        <strong>{discordName || "your Discord account"}</strong>.
      </p>

      {!mode && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          <button
            onClick={() => {
              setMode("connect")
              setPlayerName("")
              setMessage("")
            }}
            type="button"
            style={{
              padding: "22px",
              minHeight: "150px",
              borderRadius: "16px",
              border: "1px solid #ffffff33",
              background: "#ffffff12",
              color: "white",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Connect existing player
            </div>

            <div style={{ opacity: 0.75, lineHeight: 1.4 }}>
              Use this if your player already exists in the Cheesegrate database.
            </div>
          </button>

          <button
            onClick={() => {
              setMode("create")
              setPlayerName("")
              setMessage("")
            }}
            type="button"
            style={{
              padding: "22px",
              minHeight: "150px",
              borderRadius: "16px",
              border: "1px solid #ffffff33",
              background: "#ffffff12",
              color: "white",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Create new profile
            </div>

            <div style={{ opacity: 0.75, lineHeight: 1.4 }}>
              Use this if you are new and are not yet in the Cheesegrate database.
            </div>
          </button>
        </div>
      )}

      {mode && (
        <form
          onSubmit={handleSave}
          style={{
            display: "grid",
            gap: "14px",
            width: "100%",
            maxWidth: "460px",
            justifyItems: "center",
          }}
        >
          <button
            onClick={() => {
              setMode(null)
              setPlayerName("")
              setMessage("")
            }}
            type="button"
            style={{
              width: "fit-content",
              justifySelf: "start",
              padding: "6px 0",
              border: "0",
              background: "transparent",
              color: "inherit",
              opacity: 0.75,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
            {mode === "connect"
              ? "Connect existing player"
              : "Create new profile"}
          </h2>

          <p style={{ opacity: 0.8, lineHeight: 1.45, margin: 0 }}>
            {mode === "connect"
              ? "Search and connect your existing Speed Race player profile."
              : "Choose the player name you want to use for your new Cheesegrate profile."}
          </p>

          {mode === "connect" ? (
            <PlayerSearchAdvanced
              value={playerName}
              onChange={setPlayerName}
              players={availableExistingPlayers}
            />
          ) : (
            <label
              style={{
                display: "grid",
                gap: "6px",
                width: "100%",
                textAlign: "left",
              }}
            >
              Input name:
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Username"
                required
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                }}
              />
            </label>
          )}

          <button
            disabled={isSaving}
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ffffff33",
              background: "#ffffff12",
              color: "white",
              fontWeight: 700,
              cursor: isSaving ? "default" : "pointer",
              boxShadow: "0 8px 24px #00000033",
            }}
          >
            {isSaving
              ? "Saving..."
              : mode === "connect"
              ? "Connect player"
              : "Create profile"}
          </button>

          {message && <p>{message}</p>}
        </form>
      )}
    </main>
  )
}