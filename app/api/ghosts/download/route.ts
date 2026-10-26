
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type GhostType = "pb" | "wr"

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }

  return value
}

function errorResponse(message: string, status: number) {
  return Response.json(
    {
      ok: false,
      error: message,
    },
    { status }
  )
}

export async function GET(request: Request) {
  try {
    // Authenticate requests from Roblox servers.
    const authorization = request.headers.get("authorization")
    const downloadSecret = getRequiredEnv("GHOST_UPLOAD_SECRET")

    if (authorization !== `Bearer ${downloadSecret}`) {
      return errorResponse("Unauthorized", 401)
    }

    const url = new URL(request.url)

    const dataVer = url.searchParams.get("data_ver")
    const ghostType = url.searchParams.get("type")
    const userIdString = url.searchParams.get("user_id")

    // Validate map number.
    if (!dataVer || !/^[1-9]\d*$/.test(dataVer)) {
      return errorResponse("Invalid data_ver", 400)
    }

    // Validate ghost type.
    if (ghostType !== "pb" && ghostType !== "wr") {
      return errorResponse("Invalid ghost type", 400)
    }

    let userId: number | null = null

    // PB requests require a Roblox user ID.
    if (ghostType === "pb") {
      if (!userIdString || !/^[1-9]\d*$/.test(userIdString)) {
        return errorResponse("Invalid user_id", 400)
      }

      userId = Number(userIdString)

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return errorResponse("Invalid user_id", 400)
      }
    }

    // Connect to Supabase.
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

    // Select only the fields needed for ghost playback.
    // Keep this as a literal string for TypeScript inference.
    let query = supabase
      .from("ghost_replays")
      .select(
        "data_ver,user_id,player,time,replay_data,avatar_data,sample_rate"
      )
      .eq("data_ver", dataVer)

    if (ghostType === "pb") {
      query = query.eq("user_id", userId!)
    } else {
      // Fastest available recorded ghost.
      query = query
        .order("time", { ascending: true })
        .order("user_id", { ascending: true })
    }

    const { data, error } = await query
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[Ghost Download] Database error:", error)

      return errorResponse("Database query failed", 500)
    }

    // No matching ghost exists.
    if (!data) {
      return Response.json(
        {
          ok: true,
          found: false,
          type: ghostType,
          data_ver: dataVer,
          ghost: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      )
    }

    // Return the complete recording.
    return Response.json(
      {
        ok: true,
        found: true,
        type: ghostType,
        data_ver: dataVer,
        ghost: {
          user_id: data.user_id,
          player: data.player,
          time: data.time,
          replay_data: data.replay_data,
          avatar_data: data.avatar_data,
          sample_rate: data.sample_rate,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("[Ghost Download]", error)

    return errorResponse("Internal server error", 500)
  }
}
