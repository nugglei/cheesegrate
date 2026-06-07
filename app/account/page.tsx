export const dynamic = "force-dynamic"

import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getProfileByUserId } from "@/lib/profiles"
import { LogoutButton } from "@/components/LogoutButton"
import AccountProfilePictureUpload from "@/components/AccountProfilePictureUpload"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"
import AccountBioEditor from "@/components/AccountBioEditor"
import AccountGoalsEditor from "@/components/AccountGoalsEditor"
import AccountCountryEditor from "@/components/AccountCountryEditor"
import TagBubble from "@/components/TagBubble"

export default async function AccountPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return (
      <main style={{ maxWidth: "720px", margin: "80px auto", padding: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "12px" }}>
          Account
        </h1>

        <p style={{ marginBottom: "20px" }}>You are not logged in.</p>

        <Link
          href="/login"
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15"
        >
          Log in
        </Link>
      </main>
    )
  }

  const profile = await getProfileByUserId(supabase, user.id)

  const playerName = profile?.player_name ?? "Not connected"
  const role = profile?.role ?? "User"

  return (
    <main style={{ maxWidth: "720px", margin: "80px auto", padding: "24px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "24px" }}>
        Account
      </h1>

      <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
        <p>
          <strong>Discord Email:</strong> {user.email}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <PlayerProfilePicture
            player={playerName}
            src={profile?.profile_picture_url ?? undefined}
            size={36}
          />

          <p>
            <strong>Username:</strong> {playerName}
          </p>

          <TagBubble tone="blue" size="sm">
            {role}
          </TagBubble>
        </div>
      </div>

      <div style={{ display: "grid", gap: "10px", maxWidth: "220px" }}>
  <AccountProfilePictureUpload
    userId={user.id}
    playerName={playerName}
    initialSrc={profile?.profile_picture_url ?? undefined}
  />

<AccountCountryEditor userId={user.id} />

  <AccountBioEditor userId={user.id} initialBio={profile?.bio ?? ""} />
  <AccountGoalsEditor
  userId={user.id}
  initialGoal1={profile?.goal_1 ?? ""}
  initialGoal2={profile?.goal_2 ?? ""}
  initialGoal3={profile?.goal_3 ?? ""}
/>

  <LogoutButton />
</div>
    </main>
  )
}