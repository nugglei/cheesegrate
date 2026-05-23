import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/LogoutButton"

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main style={{ maxWidth: "720px", margin: "80px auto", padding: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px" }}>
          Account
        </h1>

        <p style={{ marginBottom: "20px" }}>You are not logged in.</p>

        <Link href="/login">Log in</Link>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, player_name, role")
    .eq("id", user.id)
    .single()

  return (
    <main style={{ maxWidth: "720px", margin: "80px auto", padding: "24px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "24px" }}>
        Account
      </h1>

      <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Username:</strong> {profile?.username ?? "No profile found"}
        </p>

        <p>
          <strong>Speed Race player:</strong>{" "}
          {profile?.player_name ?? "Not connected"}
        </p>

        <p>
          <strong>Role:</strong> {profile?.role ?? "user"}
        </p>
      </div>

      <LogoutButton />
    </main>
  )
}