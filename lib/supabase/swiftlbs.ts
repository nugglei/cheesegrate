import { createClient } from "@supabase/supabase-js"

export type SwiftLbRow = {
  data_ver: string
  player: string
  time: number
  updated_at?: string | null
}

export type SwiftLeaderboardEntry = {
  rank: number
  player: string
  timeMs: number
  timeText: string
  updatedAt: string | null
}

type ProfileNameRow = {
  username: string | null
  roblox: string | null
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function normalizePlayerName(player: string) {
  return player.trim().toLowerCase()
}

function createRobloxToCheesegrateNameMap(profiles: ProfileNameRow[]) {
  return new Map(
    profiles
      .filter((profile) => profile.roblox && profile.username)
      .map((profile) => [
        normalizePlayerName(profile.roblox as string),
        profile.username as string,
      ])
  )
}

function createSupabaseReadClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

function createSupabaseServerClient() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

export function formatSwiftTime(ms: number) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(
      milliseconds
    ).padStart(3, "0")}`
  }

  return `${seconds}.${String(milliseconds).padStart(3, "0")}`
}

function formatSwiftLeaderboardEntries(rows: SwiftLbRow[]) {
  return rows
    .sort((a, b) => a.time - b.time)
    .map((row, index) => ({
      rank: index + 1,
      player: row.player,
      timeMs: row.time,
      timeText: formatSwiftTime(row.time),
      updatedAt: row.updated_at ?? null,
    }))
}

async function getProfileNameMap() {
  const supabase = createSupabaseReadClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("username, roblox")
    .not("roblox", "is", null)

  if (error) {
    throw new Error(error.message)
  }

  return createRobloxToCheesegrateNameMap(data ?? [])
}

function applyProfileNames(
  rows: SwiftLbRow[],
  robloxToCheesegrateName: Map<string, string>
) {
  return rows.map((row) => ({
    ...row,
    player:
      robloxToCheesegrateName.get(normalizePlayerName(row.player)) ??
      row.player,
  }))
}

export async function getSwiftRowsFromSupabase() {
  const supabase = createSupabaseReadClient()

  const pageSize = 1000
  let from = 0
  let allRows: SwiftLbRow[] = []

  while (true) {
    const { data, error } = await supabase
      .from("swift_lbs")
      .select("data_ver, player, time, updated_at")
      .not("player", "is", null)
      .order("time", { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      break
    }

    allRows = [...allRows, ...(data as SwiftLbRow[])]

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  const robloxToCheesegrateName = await getProfileNameMap()

  return applyProfileNames(allRows, robloxToCheesegrateName)
}

export async function getSwiftLeaderboard(dataVer: string, limit = 10) {
  const supabase = createSupabaseReadClient()

  const [{ data, error }, robloxToCheesegrateName] = await Promise.all([
    supabase
      .from("swift_lbs")
      .select("data_ver, player, time, updated_at")
      .eq("data_ver", dataVer)
      .not("player", "is", null)
      .order("time", { ascending: true })
      .limit(limit),

    getProfileNameMap(),
  ])

  if (error) {
    throw new Error(error.message)
  }

  const namedRows = applyProfileNames(
    (data ?? []) as SwiftLbRow[],
    robloxToCheesegrateName
  )

  return formatSwiftLeaderboardEntries(namedRows)
}

export async function upsertSwiftLeaderboardRows(rows: SwiftLbRow[]) {
  if (rows.length === 0) {
    return {
      syncedRows: 0,
    }
  }

  const supabase = createSupabaseServerClient()

  const rowsWithUpdatedAt = rows.map((row) => ({
    ...row,
    updated_at: row.updated_at ?? new Date().toISOString(),
  }))

  const { error } = await supabase.from("swift_lbs").upsert(rowsWithUpdatedAt, {
    onConflict: "data_ver,player",
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    syncedRows: rows.length,
  }
}

export async function getSwiftPlayers() {
  const rows = await getSwiftRowsFromSupabase()

  return Array.from(
    new Set(
      rows
        .map((row) => row.player)
        .filter((player): player is string => Boolean(player))
    )
  ).sort((a, b) => a.localeCompare(b))
}