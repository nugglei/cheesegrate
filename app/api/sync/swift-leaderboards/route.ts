import { createClient } from "@supabase/supabase-js"

const DATA_VERS = Array.from({ length: 49 }, (_, index) => String(index + 1))

type ExistingSwiftRow = {
  data_ver: string
  player: string
  time: number
  updated_at: string | null
}

type RobloxEntry = {
  id: string
  value: number
}

type SyncResult = {
  dataVer: string
  orderedDataStoreName: string
  ok: boolean
  error?: string
  status?: number
  details?: string
  robloxRows?: number
  existingRows?: number
  changedRows?: number
  newRows?: number
  updatedRows?: number
  loweredRows?: number
  raisedRows?: number
  deletedRows?: number
  unchangedRows?: number
  removedPlayers?: string[]
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }

  return value
}

function getCentralTimestamp() {
  const date = new Date()

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00"

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
    "minute"
  )}:${get("second")}`
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = getRequiredEnv("CRON_SECRET")

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const syncedAt = getCentralTimestamp()

    const apiKey = getRequiredEnv("ROBLOX_API_KEY")
    const universeId = getRequiredEnv("ROBLOX_UNIVERSE_ID")
    const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const results: SyncResult[] = []

    for (const dataVer of DATA_VERS) {
      const orderedDataStoreName = `${dataVer}LeaderBoardData`
      const scope = "global"

      try {
        const robloxResponse = await fetch(
          `https://apis.roblox.com/cloud/v2/universes/${universeId}/ordered-data-stores/${orderedDataStoreName}/scopes/${scope}/entries?maxPageSize=100&orderBy=value`,
          {
            headers: {
              "x-api-key": apiKey,
            },
            cache: "no-store",
          }
        )

        const robloxText = await robloxResponse.text()

        if (!robloxResponse.ok) {
          results.push({
            dataVer,
            orderedDataStoreName,
            ok: false,
            error: "Roblox request failed",
            status: robloxResponse.status,
            details: robloxText,
          })

          continue
        }

        const robloxData = JSON.parse(robloxText)
        const entries: RobloxEntry[] = robloxData.orderedDataStoreEntries ?? []

        const { data: existingRows, error: existingError } = await supabase
          .from("swift_lbs")
          .select("data_ver, player, time, updated_at")
          .eq("data_ver", dataVer)

        if (existingError) {
          results.push({
            dataVer,
            orderedDataStoreName,
            ok: false,
            error: "Supabase existing row fetch failed",
            details: existingError.message,
          })

          continue
        }

        const existingByPlayer = new Map<string, ExistingSwiftRow>()
        const robloxByPlayer = new Map<string, RobloxEntry>()

        for (const row of existingRows ?? []) {
          existingByPlayer.set(row.player, row)
        }

        for (const entry of entries) {
          robloxByPlayer.set(entry.id, entry)
        }

        const changedRows = entries
          .map((entry) => {
            const existingRow = existingByPlayer.get(entry.id)

            if (existingRow && existingRow.time === entry.value) {
              return null
            }

            return {
              data_ver: dataVer,
              player: entry.id,
              time: entry.value,
              updated_at: syncedAt,
            }
          })
          .filter(
            (
              row
            ): row is {
              data_ver: string
              player: string
              time: number
              updated_at: string
            } => row !== null
          )

        const removedPlayers = (existingRows ?? [])
          .filter((row) => !robloxByPlayer.has(row.player))
          .map((row) => row.player)

        let deletedRows = 0

        if (removedPlayers.length > 0) {
          const { error: deleteError } = await supabase
            .from("swift_lbs")
            .delete()
            .eq("data_ver", dataVer)
            .in("player", removedPlayers)

          if (deleteError) {
            results.push({
              dataVer,
              orderedDataStoreName,
              ok: false,
              error: "Supabase delete failed",
              details: deleteError.message,
            })

            continue
          }

          deletedRows = removedPlayers.length
        }

        if (changedRows.length > 0) {
          const { error } = await supabase
            .from("swift_lbs")
            .upsert(changedRows, {
              onConflict: "data_ver,player",
            })

          if (error) {
            results.push({
              dataVer,
              orderedDataStoreName,
              ok: false,
              error: "Supabase upsert failed",
              details: error.message,
            })

            continue
          }
        }

        const newRows = changedRows.filter(
          (row) => !existingByPlayer.has(row.player)
        )

        const updatedRows = changedRows.filter((row) => {
          const existingRow = existingByPlayer.get(row.player)
          return existingRow && existingRow.time !== row.time
        })

        const loweredRows = updatedRows.filter((row) => {
          const existingRow = existingByPlayer.get(row.player)
          return existingRow && row.time < existingRow.time
        })

        const raisedRows = updatedRows.filter((row) => {
          const existingRow = existingByPlayer.get(row.player)
          return existingRow && row.time > existingRow.time
        })

        results.push({
          dataVer,
          orderedDataStoreName,
          ok: true,
          robloxRows: entries.length,
          existingRows: existingRows?.length ?? 0,
          changedRows: changedRows.length,
          newRows: newRows.length,
          updatedRows: updatedRows.length,
          loweredRows: loweredRows.length,
          raisedRows: raisedRows.length,
          deletedRows,
          unchangedRows: entries.length - changedRows.length,
          removedPlayers,
        })
      } catch (error) {
        results.push({
          dataVer,
          orderedDataStoreName,
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const failed = results.filter((result) => !result.ok)

    return Response.json({
      ok: failed.length === 0,
      syncedAt,
      totalLeaderboardsChecked: DATA_VERS.length,
      successfulLeaderboards: results.length - failed.length,
      failedLeaderboards: failed.length,
      failedResults: failed,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}