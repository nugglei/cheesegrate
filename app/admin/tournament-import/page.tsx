"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

import {
  DEFAULT_CATEGORY,
  DEFAULT_RUN_COUNT,
  MAX_RUN_COUNT,
  buildResultRow,
  csvRow,
  emptyMap,
  makeResultFromRuns,
  parseLegacyRows,
  resolveMapResultsForFormat,
  resolveMatchResult,
  splitBulkRuns,
  type MapInput,
  type PlayerInput,
  type PlayerMapResult,
} from "@/lib/tournamentImport"

type LegacyRow = {
  tournamentName: string
  format: string
  division: string
  round: string
  matchId: string
  seed: string
  player: string
  map: string
  runs: string[]
}

type MapResultValue = "W" | "L" | "D" | ""
type MatchResultValue = "W" | "L" | "D" | ""

type MapPlayerSummary = {
  average: string
  best: string
  result: MapResultValue
}

const MAP_FORMAT_OPTIONS = [
  { value: "b3o5", label: "b3o5 — Best 3 Runs of 5 Attempts" },
  { value: "b3o5m", label: "b3o5m — Best 3 Runs of 5 Attempts w/ Mal Tournament 6th Attempt" },
  { value: "srm4", label: "srm4 — SRM Mean of 4" },
  { value: "srm3", label: "srm3 — SRM Mean of 3" },
  { value: "qp", label: "qp — Qualifier Peak" },
  { value: "sd", label: "sd — Sudden Death Win by 2" },
  { value: "wdl", label: "wdl — Win/Draw/Loss Win by 2" },
]

const MATCH_FORMAT_OPTIONS = [
  { value: "maj", label: "maj — Majority of Maps Won" },
  { value: "sum", label: "sum — Sum of Averages" },
  { value: "manual", label: "manual — Manual Result" },
  { value: "q", label: "q — Qualifier" },
  { value: "qqp", label: "qqp — Qualifier + QP" },
]

const CATEGORY_OPTIONS = ["Skipless IGT", "Skip IGT"]

export default function TournamentImportPage() {
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
const [isAdmin, setIsAdmin] = useState(false)
  const [bulkText, setBulkText] = useState("")

  const [matchId, setMatchId] = useState("")
  const [tournamentName, setTournamentName] = useState("")
  const [tournamentNameOptions, setTournamentNameOptions] = useState<string[]>([])
  const [round, setRound] = useState("")
  const [division, setDivision] = useState("")
  const [date, setDate] = useState("")
  const [recording, setRecording] = useState("")
  const [host, setHost] = useState("")
  const [format, setFormat] = useState("b3o5")
  const [matchFormat, setMatchFormat] = useState("maj")

  const [leftPlayer, setLeftPlayer] = useState<PlayerInput>({
    player: "",
    seed: "",
  })

  const [rightPlayer, setRightPlayer] = useState<PlayerInput>({
    player: "",
    seed: "",
  })

  const [maps, setMaps] = useState<MapInput[]>([emptyMap()])
  const [isSaving, setIsSaving] = useState(false)
const [saveMessage, setSaveMessage] = useState("")

  const legacyRows = useMemo(() => parseLegacyRows(bulkText), [bulkText])

useEffect(() => {
  let isMounted = true

  async function checkAdmin() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      if (isMounted) {
        setIsAdmin(false)
        setIsCheckingAdmin(false)
      }

      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (isMounted) {
      setIsAdmin(profile?.role === "admin")
      setIsCheckingAdmin(false)
    }
  }

  checkAdmin()

  return () => {
    isMounted = false
  }
}, [])

useEffect(() => {
  let isMounted = true

  async function loadTournamentNames() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("tournament_matches")
      .select("tournament_name")
      .order("tournament_name", { ascending: true })

    if (error) {
      console.error("Failed to load tournament names:", error)
      return
    }

    const names = Array.from(
      new Set(
        (data ?? [])
          .map((row) => row.tournament_name)
          .filter((name): name is string => Boolean(name?.trim()))
      )
    )

    if (isMounted) {
      setTournamentNameOptions(names)
    }
  }

  loadTournamentNames()

  return () => {
    isMounted = false
  }
}, [])

  useEffect(() => {
    if (legacyRows.length === 0) return

    const firstRow = legacyRows[0]

    const players = Array.from(
      new Map(
        legacyRows.map((row) => [
          row.player,
          {
            player: row.player,
            seed: row.seed,
          },
        ])
      ).values()
    )

    const left = players[0] || { player: "", seed: "" }
    const right = players[1] || { player: "", seed: "" }

const mapNames = Array.from(
  new Set(legacyRows.map((row) => row.map).filter(Boolean))
)

const importedMaps = mapNames.map((mapName) => {
  const mapRows = legacyRows.filter((row) => row.map === mapName)

  const leftRow = mapRows.find((row) => row.player === left.player)
  const rightRow = mapRows.find((row) => row.player === right.player)

 return {
  map: mapName,
  format: firstRow.format || "b3o5",
  left: makeResultFromRuns(leftRow?.runs || []),
  right: makeResultFromRuns(rightRow?.runs || []),
}
})

    setMatchId(firstRow.matchId)
    setTournamentName(firstRow.tournamentName)
    setRound(firstRow.round)
    setDivision(firstRow.division)
    setFormat(firstRow.format || "b3o5")
    setMatchFormat("maj")
    setLeftPlayer(left)
    setRightPlayer(right)
    setMaps(importedMaps.length > 0 ? importedMaps : [emptyMap()])
  }, [legacyRows])

  const calculatedMatchResults = useMemo(() => {
    const normalizedMatchFormat = matchFormat.trim().toLowerCase()

    if (normalizedMatchFormat === "q" || normalizedMatchFormat === "qqp") {
      return {
        leftResult: "",
        rightResult: "",
      }
    }

    const mapResults = maps
      .filter((map) => map.map.trim())
      .map((map) =>
        resolveMapResultsForFormat(
  map.left.runs,
  map.right.runs,
  map.format || format,
  matchFormat
)
      )

    const leftResult = resolveMatchResult({
      matchFormat,
      results: mapResults.map((mapResult) => mapResult.left.result),
      averages: mapResults.map((mapResult) => mapResult.left.average),
      opponentAverages: mapResults.map((mapResult) => mapResult.right.average),
    })

    const rightResult = resolveMatchResult({
      matchFormat,
      results: mapResults.map((mapResult) => mapResult.right.result),
      averages: mapResults.map((mapResult) => mapResult.right.average),
      opponentAverages: mapResults.map((mapResult) => mapResult.left.average),
    })

    return {
      leftResult,
      rightResult,
    }
  }, [maps, format, matchFormat])

  const matchCsv = useMemo(() => {
    if (!matchId || !tournamentName) return ""

    const normalizedMatchFormat = matchFormat.trim().toLowerCase()
    const isQualifier =
      normalizedMatchFormat === "q" || normalizedMatchFormat === "qqp"

    return csvRow([
      matchId,
      tournamentName,
      round,
      division,
      date,
      recording,
      host,
      matchFormat,
      leftPlayer.player,
      calculatedMatchResults.leftResult,
      isQualifier ? "" : rightPlayer.player,
      calculatedMatchResults.rightResult,
    ])
  }, [
    matchId,
    tournamentName,
    round,
    division,
    date,
    recording,
    host,
    matchFormat,
    leftPlayer.player,
    rightPlayer.player,
    calculatedMatchResults,
  ])

  const resultsCsv = useMemo(() => {
    const normalizedMatchFormat = matchFormat.trim().toLowerCase()
    const isQualifier =
      normalizedMatchFormat === "q" || normalizedMatchFormat === "qqp"

    return maps
      .filter((map) => map.map.trim())
      .flatMap((map, index) => {
        const leftRow = buildResultRow({
          matchId,
          map: map.map,
          format: map.format || format,
          matchFormat,
          player: leftPlayer,
          opponent: rightPlayer,
          result: map.left,
          opponentResult: map.right,
          side: "left",
        })

        if (isQualifier) {
          return [leftRow]
        }

        const rightRow = buildResultRow({
          matchId,
          map: map.map,
          format: map.format || format,
          matchFormat,
          player: rightPlayer,
          opponent: leftPlayer,
          result: map.right,
          opponentResult: map.left,
          side: "right",
        })

        return [leftRow, rightRow]
      })
      .join("\n")
  }, [maps, matchId, format, matchFormat, leftPlayer, rightPlayer])

  function resetCurrentMatch() {
    setBulkText("")
    setMatchId("")
    setTournamentName("")
    setRound("")
    setDivision("")
    setDate("")
    setRecording("")
    setHost("")
    setFormat("b3o5")
    setMatchFormat("maj")
    setLeftPlayer({ player: "", seed: "" })
    setRightPlayer({ player: "", seed: "" })
    setMaps([emptyMap()])
  }

async function addCurrentToDatabase() {
  if (!matchCsv || !resultsCsv || isSaving) return

  setIsSaving(true)
  setSaveMessage("")

  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    setSaveMessage("You are not logged in.")
    setIsSaving(false)
    return
  }

  const response = await fetch("/api/admin/tournaments/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      matchCsv,
      resultsCsv,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    setSaveMessage(data.error || "Failed to add match.")
    setIsSaving(false)
    return
  }

  setSaveMessage(
    `Added ${data.matchId} with ${data.resultRowsInserted} result rows.`
  )

  resetCurrentMatch()
  setIsSaving(false)
}

  function updateMap(index: number, nextMap: Partial<MapInput>) {
    setMaps((current) =>
      current.map((map, mapIndex) =>
        mapIndex === index ? { ...map, ...nextMap } : map
      )
    )
  }

  function updateRun(
    mapIndex: number,
    side: "left" | "right",
    runIndex: number,
    value: string
  ) {
    setMaps((current) =>
      current.map((map, index) => {
        if (index !== mapIndex) return map

        const runs = [...map[side].runs]
        runs[runIndex] = value

        return {
          ...map,
          [side]: {
            ...map[side],
            runs,
            bulkRuns: runs.filter(Boolean).join(" "),
          },
        }
      })
    )
  }

  function updateCategory(
    mapIndex: number,
    side: "left" | "right",
    runIndex: number,
    value: string
  ) {
    setMaps((current) =>
      current.map((map, index) => {
        if (index !== mapIndex) return map

        const categories = [...map[side].categories]
        categories[runIndex] = value

        return {
          ...map,
          [side]: {
            ...map[side],
            categories,
          },
        }
      })
    )
  }

  function updateMapCategories(mapIndex: number, value: string) {
  setMaps((current) =>
    current.map((map, index) => {
      if (index !== mapIndex) return map

      return {
        ...map,
        left: {
          ...map.left,
          categories: Array.from({ length: MAX_RUN_COUNT }, () => value),
        },
        right: {
          ...map.right,
          categories: Array.from({ length: MAX_RUN_COUNT }, () => value),
        },
      }
    })
  )
}

function updateBulkRuns(
  mapIndex: number,
  side: "left" | "right",
  value: string
) {
  const parsedRuns = splitBulkRuns(value).slice(0, MAX_RUN_COUNT)

  setMaps((current) =>
    current.map((map, index) => {
      if (index !== mapIndex) return map

      return {
        ...map,
        [side]: {
          ...makeResultFromRuns(parsedRuns),
          bulkRuns: value,
        },
      }
    })
  )
}

  function addRun(mapIndex: number) {
    setMaps((current) =>
      current.map((map, index) => {
        if (index !== mapIndex) return map

        return {
          ...map,
          left: {
            ...map.left,
            visibleRunCount: Math.min(
              map.left.visibleRunCount + 1,
              MAX_RUN_COUNT
            ),
          },
          right: {
            ...map.right,
            visibleRunCount: Math.min(
              map.right.visibleRunCount + 1,
              MAX_RUN_COUNT
            ),
          },
        }
      })
    )
  }

  function resetForm() {
    resetCurrentMatch()
  }

if (isCheckingAdmin) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-bold">Checking access...</h1>
    </main>
  )
}

if (!isAdmin) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-bold">403 Forbidden</h1>
<p className="mt-2 text-zinc-400">
  You need admin permissions to use the tournament importer.
</p>
    </main>
  )
}

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-4xl font-bold">Tournament Match Importer</h1>

      <p className="mt-2 text-zinc-400">
        Paste one legacy match, edit anything below, then add it to the tournament database.
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-2xl font-bold">Legacy Match Paste</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Expected format: tournament, format, division, round, matchId, seed,
          player, map, then run values.
        </p>

        <textarea
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          placeholder="Paste one legacy match here..."
          className="mt-4 min-h-60 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-zinc-200 outline-none"
        />

          {bulkText.trim() && legacyRows.length === 0 && (
  <p className="mt-3 text-sm text-red-300">
    No legacy rows detected. Check the paste format.
  </p>
)}

{legacyRows.length > 0 && (
  <p className="mt-3 text-sm text-green-300">
    Detected {legacyRows.length} legacy rows.
  </p>
)}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-2xl font-bold">Manual Match Info</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Match ID" value={matchId} onChange={setMatchId} />

          <DatalistInput
  label="Tournament Name"
  value={tournamentName}
  onChange={setTournamentName}
  options={tournamentNameOptions}
/>

          <Input label="Round" value={round} onChange={setRound} />
          <Input label="Division" value={division} onChange={setDivision} />
          <Input label="Date" value={date} onChange={setDate} />

          <Input label="Recording" value={recording} onChange={setRecording} />
          <Input label="Host" value={host} onChange={setHost} />

          <Select
            label="Match Format"
            value={matchFormat}
            onChange={setMatchFormat}
            options={MATCH_FORMAT_OPTIONS}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <PlayerBox
          title="Left Player"
          player={leftPlayer}
          setPlayer={setLeftPlayer}
        />

        <PlayerBox
          title="Right Player"
          player={rightPlayer}
          setPlayer={setRightPlayer}
        />
      </section>

      <section className="mt-8 grid gap-6">
        {maps.map((map, mapIndex) => (
          <div
            key={mapIndex}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex items-center justify-between gap-4">
  <h2 className="text-3xl font-bold">
    {map.map || `Map ${mapIndex + 1}`}
  </h2>

  <button
    type="button"
    onClick={() =>
      setMaps((current) =>
        current.filter((_, index) => index !== mapIndex)
      )
    }
    className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
  >
    Remove
  </button>
</div>

<div className="mt-4 grid gap-4 md:grid-cols-3">
  <label className="grid gap-2 md:col-span-2">
    <span className="text-sm font-medium text-zinc-400">Map Name</span>

    <input
      value={map.map}
      onChange={(event) => updateMap(mapIndex, { map: event.target.value })}
      className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-2xl font-bold text-white outline-none focus:border-white/30"
    />
  </label>

  <Select
    label="Map Format"
    value={map.format || format}
    onChange={(value) => updateMap(mapIndex, { format: value })}
    options={MAP_FORMAT_OPTIONS}
  />

  <EditableSelect
    label="Quick Set Map Categories"
    value=""
    placeholder="Choose or type category..."
    onChange={(value) => {
      if (value.trim()) {
        updateMapCategories(mapIndex, value)
      }
    }}
    options={CATEGORY_OPTIONS}
  />
</div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <ResultBox
                title={leftPlayer.player || "Left Player"}
                result={map.left}
                mapIndex={mapIndex}
                side="left"
                updateRun={updateRun}
                updateCategory={updateCategory}
                updateBulkRuns={updateBulkRuns}
              />

              <ResultBox
                title={rightPlayer.player || "Right Player"}
                result={map.right}
                mapIndex={mapIndex}
                side="right"
                updateRun={updateRun}
                updateCategory={updateCategory}
                updateBulkRuns={updateBulkRuns}
              />
            </div>

            <button
              type="button"
              onClick={() => addRun(mapIndex)}
              className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold hover:bg-white/[0.1]"
            >
              Add Run
            </button>
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMaps((current) => [...current, emptyMap()])}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold hover:bg-white/[0.1]"
          >
            Add Map
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold hover:bg-white/[0.1]"
          >
            Reset Form
          </button>
        </div>
      </section>
      <section className="mt-8 grid gap-3">
  <button
    type="button"
    onClick={addCurrentToDatabase}
    disabled={!matchCsv || !resultsCsv || isSaving}
    className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 font-semibold text-green-300 hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {isSaving ? "Adding..." : "Add Current Match to Database"}
  </button>

  {saveMessage && (
    <p className="text-sm text-zinc-300">{saveMessage}</p>
  )}
</section>
    </main>
  )
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-400">{label}</span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
      />
    </label>
  )
}

function DatalistInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  const listId = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${options.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-options`

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-400">{label}</span>

      <input
        value={value}
        list={listId}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
      />

      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  )
}

function EditableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-400">{label}</span>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
        />

        <select
          value=""
          onChange={(event) => onChange(event.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
        >
          <option value="" className="bg-black">
            Options
          </option>

          {options.map((option) => (
            <option key={option} value={option} className="bg-black">
              {option}
            </option>
          ))}
        </select>
      </div>
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-400">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-black">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function PlayerBox({
  title,
  player,
  setPlayer,
}: {
  title: string
  player: PlayerInput
  setPlayer: (player: PlayerInput) => void
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="mt-5 grid gap-4">
        <Input
          label="Player"
          value={player.player}
          onChange={(value) => setPlayer({ ...player, player: value })}
        />

        <Input
          label="Seed"
          value={player.seed}
          onChange={(value) => setPlayer({ ...player, seed: value })}
        />
      </div>
    </section>
  )
}

function ResultBox({
  title,
  result,
  mapIndex,
  side,
  updateRun,
  updateCategory,
  updateBulkRuns,
}: {
  title: string
  result: PlayerMapResult
  mapIndex: number
  side: "left" | "right"
  updateRun: (
    mapIndex: number,
    side: "left" | "right",
    runIndex: number,
    value: string
  ) => void
  updateCategory: (
    mapIndex: number,
    side: "left" | "right",
    runIndex: number,
    value: string
  ) => void
  updateBulkRuns: (
    mapIndex: number,
    side: "left" | "right",
    value: string
  ) => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-xl font-bold">{title}</h3>

      <div className="mt-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-400">Bulk Runs</span>

          <textarea
            value={result.bulkRuns}
            onChange={(event) =>
              updateBulkRuns(mapIndex, side, event.target.value)
            }
            placeholder="Example: 23.1 23.1 23.9 DNF 23.8"
            className="min-h-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        {result.runs.slice(0, result.visibleRunCount).map((run, runIndex) => (
          <div key={runIndex} className="grid grid-cols-2 gap-3">
            <Input
              label={`Run ${runIndex + 1}`}
              value={run}
              onChange={(value) => updateRun(mapIndex, side, runIndex, value)}
            />

            <EditableSelect
  label="Category"
  value={result.categories[runIndex] || DEFAULT_CATEGORY}
  onChange={(value) =>
    updateCategory(mapIndex, side, runIndex, value)
  }
  options={CATEGORY_OPTIONS}
/>
          </div>
        ))}
      </div>
    </div>
  )
}