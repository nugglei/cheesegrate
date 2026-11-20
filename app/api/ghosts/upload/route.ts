
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const MAX_REPLAY_BYTES = 750_000
const MAX_RECORDING_MS = 60_000
const MAX_SPEED = 10_000

type GhostUpload = {
  user_id: number
  player: string
  data_ver: string
  time: number
  replay_data: string
  avatar_data: Record<string, unknown>
  sample_rate: number
  mean_speed?: number
  median_speed?: number
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }

  return value
}

function isValidSpeed(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_SPEED
  )
}

function isValidUpload(value: unknown): value is GhostUpload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const data = value as Record<string, unknown>

  const hasMean = data.mean_speed !== undefined
  const hasMedian = data.median_speed !== undefined

  // Both statistics must be supplied together, or neither.
  if (hasMean !== hasMedian) {
    return false
  }

  if (hasMean) {
    if (
      !isValidSpeed(data.mean_speed) ||
      !isValidSpeed(data.median_speed)
    ) {
      return false
    }
  }

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
  const startedAt = Date.now()

  let uploadInfo: {
    user_id?: number
    player?: string
    data_ver?: string
    time?: number
  } = {}

  try {
    // Authenticate the Roblox server.
    const authorization = request.headers.get("authorization")
    const uploadSecret = getRequiredEnv("GHOST_UPLOAD_SECRET")

    if (authorization !== `Bearer ${uploadSecret}`) {
      console.warn("[Ghost Upload] REJECTED: Unauthorized request")

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
    const bodyBytes = Buffer.byteLength(rawBody, "utf8")

    // Enforce maximum JSON request size.
    if (bodyBytes > MAX_REPLAY_BYTES) {
      console.warn("[Ghost Upload] REJECTED: Request too large", {
        bytes: bodyBytes,
        maximum: MAX_REPLAY_BYTES,
      })

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
      console.warn("[Ghost Upload] REJECTED: Invalid JSON", {
        bytes: bodyBytes,
      })

      return Response.json(
        {
          ok: false,
          error: "Invalid JSON",
        },
        { status: 400 }
      )
    }

    // Capture safe metadata for troubleshooting.
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const data = parsed as Record<string, unknown>

      uploadInfo = {
        user_id: typeof data.user_id === "number"
          ? data.user_id
          : undefined,
        player: typeof data.player === "string"
          ? data.player
          : undefined,
        data_ver: typeof data.data_ver === "string"
          ? data.data_ver
          : undefined,
        time: typeof data.time === "number"
          ? data.time
          : undefined,
      }
    }

    // Validate metadata and optional speed statistics.
    if (!isValidUpload(parsed)) {
      console.warn("[Ghost Upload] REJECTED: Invalid replay data", {
        ...uploadInfo,
        bytes: bodyBytes,
      })

      return Response.json(
        {
          ok: false,
          error: "Invalid replay data",
        },
        { status: 400 }
      )
    }

    const upload = parsed

    console.log("[Ghost Upload] RECEIVED", {
      player: upload.player,
      user_id: upload.user_id,
      map: upload.data_ver,
      time: upload.time,
      mean_speed: upload.mean_speed ?? null,
      median_speed: upload.median_speed ?? null,
      bytes: bodyBytes,
    })

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
    // The database function must accept these new parameters.
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
        p_mean_speed: upload.mean_speed ?? null,
        p_median_speed: upload.median_speed ?? null,
      }
    )

    if (saveError) {
      console.error("[Ghost Upload] SUPABASE ERROR", {
        ...uploadInfo,
        code: saveError.code,
        message: saveError.message,
        details: saveError.details,
        hint: saveError.hint,
      })

      throw saveError
    }

    if (typeof saved !== "boolean") {
      console.error("[Ghost Upload] INVALID RPC RESULT", {
        ...uploadInfo,
        resultType: typeof saved,
      })

      throw new Error("Unexpected replay save result")
    }

    const durationMs = Date.now() - startedAt

    if (!saved) {
      console.log("[Ghost Upload] SKIPPED: Existing replay faster or equal", {
        ...uploadInfo,
        durationMs,
      })

      return Response.json({
        ok: true,
        saved: false,
        reason: "Existing replay is faster or equal",
        data_ver: upload.data_ver,
        time: upload.time,
      })
    }

    console.log("[Ghost Upload] SAVED", {
      ...uploadInfo,
      mean_speed: upload.mean_speed ?? null,
      median_speed: upload.median_speed ?? null,
      durationMs,
    })

    return Response.json({
      ok: true,
      saved: true,
      data_ver: upload.data_ver,
      time: upload.time,
    })

  } catch (error) {
    console.error("[Ghost Upload] FAILED", {
      ...uploadInfo,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error
        ? error.message
        : String(error),
    })

    return Response.json(
      {
        ok: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
