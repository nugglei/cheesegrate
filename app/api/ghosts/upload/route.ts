
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const MAX_REPLAY_BYTES = 750_000
const MAX_RECORDING_MS = 60_000

type GhostUpload = {
  user_id: number
  player: string
  data_ver: string
  time: number
  replay_data: string
  avatar_data: Record<string, unknown>
  sample_rate: number
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }

  return value
}

function isValidUpload(value: unknown): value is GhostUpload {
  if (!value || typeof value !== "object") {
    return false
  }

  const data = value as Record<string, unknown>

  return (
    typeof data.user_id === "number" &&
    Number.isSafeInteger(data.user_id) &&
    data.user_id > 0 &&

    typeof data.player === "string" &&
    data.player.length > 0 &&
    data.player.length <= 20 &&

    typeof data.data_ver === "string" &&
    /^[1-9]\d*$/.test(data.data_ver) &&

    typeof data.time === "number" &&
    Number.isInteger(data.time) &&
    data.time > 0 &&
    data.time <= MAX_RECORDING_MS &&

    typeof data.replay_data === "string" &&
    data.replay_data.length > 0 &&

    typeof data.avatar_data === "object" &&
    data.avatar_data !== null &&
    !Array.isArray(data.avatar_data) &&

    data.sample_rate === 120
  )
}

export async function POST(request: Request) {
  try {
    // Authenticate the Roblox server.
    const authorization = request.headers.get("authorization")
    const uploadSecret = getRequiredEnv("GHOST_UPLOAD_SECRET")

    if (authorization !== `Bearer ${uploadSecret}`) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Limit request size.
    const rawBody = await request.text()

    if (Buffer.byteLength(rawBody, "utf8") > MAX_REPLAY_BYTES) {
      return Response.json(
        { ok: false, error: "Replay too large" },
        { status: 413 }
      )
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      )
    }

    if (!isValidUpload(parsed)) {
      return Response.json(
        { ok: false, error: "Invalid replay data" },
        { status: 400 }
      )
    }

    const upload = parsed

    const supabase = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Check the authoritative Roblox PB.
    // The OrderedDataStore uses the player's username
    // as its key, matching your MapTimeSystem.
    const universeId = getRequiredEnv("ROBLOX_UNIVERSE_ID")
    const robloxApiKey = getRequiredEnv("ROBLOX_API_KEY")

    const storeName = `${upload.data_ver}LeaderBoardData`

    const robloxUrl =
      `https://apis.roblox.com/cloud/v2/universes/${universeId}` +
      `/ordered-data-stores/${storeName}` +
      `/scopes/global/entries/${encodeURIComponent(upload.player)}`

    const robloxResponse = await fetch(robloxUrl, {
      headers: {
        "x-api-key": robloxApiKey,
      },
      cache: "no-store",
    })

    if (!robloxResponse.ok) {
      return Response.json(
        {
          ok: false,
          error: "Could not verify Roblox PB",
          status: robloxResponse.status,
        },
        { status: 503 }
      )
    }

    const robloxEntry: unknown = await robloxResponse.json()

    if (!robloxEntry || typeof robloxEntry !== "object") {
      return Response.json(
        { ok: false, error: "Invalid Roblox PB response" },
        { status: 503 }
      )
    }

    const verifiedTime = Number(
      (robloxEntry as Record<string, unknown>).value
    )

    if (!Number.isInteger(verifiedTime) || verifiedTime !== upload.time) {
      return Response.json(
        {
          ok: false,
          error: "Replay time does not match saved PB",
        },
        { status: 409 }
      )
    }

    // Check whether this player already has a replay.
    const { data: existing, error: readError } = await supabase
      .from("ghost_replays")
      .select("time")
      .eq("data_ver", upload.data_ver)
      .eq("user_id", upload.user_id)
      .maybeSingle()

    if (readError) {
      throw readError
    }

    // Never replace a faster or equal replay.
    if (existing && existing.time <= upload.time) {
      return Response.json({
        ok: true,
        saved: false,
        reason: "Existing replay is faster or equal",
      })
    }

    const { error: saveError } = await supabase
      .from("ghost_replays")
      .upsert(
        {
          data_ver: upload.data_ver,
          user_id: upload.user_id,
          player: upload.player,
          time: upload.time,
          replay_data: upload.replay_data,
          avatar_data: upload.avatar_data,
          sample_rate: upload.sample_rate,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "data_ver,user_id",
        }
      )

    if (saveError) {
      throw saveError
    }

    return Response.json({
      ok: true,
      saved: true,
      data_ver: upload.data_ver,
      time: upload.time,
    })
  } catch (error) {
    console.error("[Ghost Upload]", error)

    return Response.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
