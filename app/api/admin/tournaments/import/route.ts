import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type TournamentMatchInsert = {
  match_id: string
  tournament_name: string
  round: string | null
  division: string | null
  date: string | null
  recording: string | null
  host: string | null
  match_format: string | null
  left_player: string
  left_result: string | null
  right_player: string
  right_result: string | null
}

type TournamentResultInsert = {
  match_id: string
  map: string | null
  format: string | null
  seed: string | null
  player: string
  opponent: string | null
  run1: string | null
  run1category: string | null
  run2: string | null
  run2category: string | null
  run3: string | null
  run3category: string | null
  run4: string | null
  run4category: string | null
  run5: string | null
  run5category: string | null
  run6: string | null
  run6category: string | null
  run7: string | null
  run7category: string | null
  run8: string | null
  run8category: string | null
  run9: string | null
  run9category: string | null
  run10: string | null
  run10category: string | null
  average: string | null
  best: string | null
  result: string | null
}

function emptyToNull(value: string | undefined) {
  return value?.trim() ? value.trim() : null
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === `"` && nextChar === `"`) {
      current += `"`
      i++
    } else if (char === `"`) {
      insideQuotes = !insideQuotes
    } else if (char === "," && !insideQuotes) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }

  values.push(current)

  return values.map((value) => value.trim())
}

function parseMatchRow(matchCsv: string): TournamentMatchInsert {
  const [
    matchId,
    tournamentName,
    round,
    division,
    date,
    recording,
    host,
    matchFormat,
    leftPlayer,
    leftResult,
    rightPlayer,
    rightResult,
  ] = parseCsvLine(matchCsv)

  return {
    match_id: matchId,
    tournament_name: tournamentName,
    round: emptyToNull(round),
    division: emptyToNull(division),
    date: emptyToNull(date),
    recording: emptyToNull(recording),
    host: emptyToNull(host),
    match_format: emptyToNull(matchFormat),
    left_player: leftPlayer,
    left_result: emptyToNull(leftResult),
    right_player: rightPlayer,
    right_result: emptyToNull(rightResult),
  }
}

function parseResultRow(line: string): TournamentResultInsert {
  const [
    matchId,
    map,
    format,
    seed,
    player,
    opponent,
    run1,
    run1category,
    run2,
    run2category,
    run3,
    run3category,
    run4,
    run4category,
    run5,
    run5category,
    run6,
    run6category,
    run7,
    run7category,
    run8,
    run8category,
    run9,
    run9category,
    run10,
    run10category,
    average,
    best,
    result,
  ] = parseCsvLine(line)

  return {
    match_id: matchId,
    map: emptyToNull(map),
    format: emptyToNull(format),
    seed: emptyToNull(seed),
    player,
    opponent: emptyToNull(opponent),
    run1: emptyToNull(run1),
    run1category: emptyToNull(run1category),
    run2: emptyToNull(run2),
    run2category: emptyToNull(run2category),
    run3: emptyToNull(run3),
    run3category: emptyToNull(run3category),
    run4: emptyToNull(run4),
    run4category: emptyToNull(run4category),
    run5: emptyToNull(run5),
    run5category: emptyToNull(run5category),
    run6: emptyToNull(run6),
    run6category: emptyToNull(run6category),
    run7: emptyToNull(run7),
    run7category: emptyToNull(run7category),
    run8: emptyToNull(run8),
    run8category: emptyToNull(run8category),
    run9: emptyToNull(run9),
    run9category: emptyToNull(run9category),
    run10: emptyToNull(run10),
    run10category: emptyToNull(run10category),
    average: emptyToNull(average),
    best: emptyToNull(best),
    result: emptyToNull(result),
  }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables." },
      { status: 500 }
    )
  }

  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "403 Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const matchCsv = String(body.matchCsv ?? "")
  const resultsCsv = String(body.resultsCsv ?? "")

  if (!matchCsv.trim() || !resultsCsv.trim()) {
    return NextResponse.json(
      { error: "Missing match/results data." },
      { status: 400 }
    )
  }

  const matchRow = parseMatchRow(matchCsv)
  const resultRows = resultsCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseResultRow)

  if (!matchRow.match_id || !matchRow.tournament_name || !matchRow.left_player) {
    return NextResponse.json(
      { error: "Invalid match row." },
      { status: 400 }
    )
  }

  if (resultRows.length === 0) {
    return NextResponse.json(
      { error: "No result rows found." },
      { status: 400 }
    )
  }

  const { error: matchError } = await adminClient
    .from("tournament_matches")
    .insert(matchRow)

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  const { error: resultsError } = await adminClient
    .from("tournament_results")
    .insert(resultRows)

  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    matchId: matchRow.match_id,
    resultRowsInserted: resultRows.length,
  })
}