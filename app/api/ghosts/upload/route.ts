
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
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 }
      )
    }

    // Read the upload body.
    const rawBody = await request.text()

    // Enforce maximum JSON request size.
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REPLAY_BYTES) {
      return Response.json(
        {
          ok: false,
          error: "Replay too large",
        },
        { status: 413 }
      )
    }

    // Parse JSON.
    let parsed: unknown

    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return Response.json(
        {
          ok: false,
          error: "Invalid JSON",
        },
        { status: 400 }
      )
    }

    // Validate metadata.
    if (!isValidUpload(parsed)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid replay data",
        },
        { status: 400 }
      )
    }

    const upload = parsed

    // Connect to Supabase using the server-only key.
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

    // Atomically save only when the new replay is faster.
    // The function inserts the first recording automatically.
    const { data: saved, error: saveError } = await supabase.rpc(
      "save_ghost_replay_if_faster",
      {
        p_data_ver: upload.data_ver,
        p_user_id: upload.user_id,
        p_player: upload.player,
        p_time: upload.time,
        p_replay_data: upload.replay_data,
        p_avatar_data: upload.avatar_data,
        p_sample_rate: upload.sample_rate,
      }
    )

    if (saveError) {
      throw saveError
    }

    if (typeof saved !== "boolean") {
      throw new Error("Unexpected replay save result")
    }

    if (!saved) {
      console.log(
        "[Ghost Upload] Existing Replay PB is faster or equal:",
        upload.player,
        upload.data_ver,
        upload.time
      )

      return Response.json({
        ok: true,
        saved: false,
        reason: "Existing replay is faster or equal",
        data_ver: upload.data_ver,
        time: upload.time,
      })
    }

    console.log(
      "[Ghost Upload] Replay PB saved:",
      upload.player,
      "Map:",
      upload.data_ver,
      "Time:",
      upload.time
    )

    return Response.json({
      ok: true,
      saved: true,
      data_ver: upload.data_ver,
      time: upload.time,
    })

  } catch (error) {
    console.error("[Ghost Upload]", error)

    return Response.json(
      {
        ok: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
