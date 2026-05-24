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

type SavedImport = {
  id: number
  label: string
  matchCsv: string
  resultsCsv: string
}

type LegacyRow = {
  tournamentName: string
  format: string
  division: string
  round: string
  matchId: string
  seed: string
  player: string
  map: string
  set: string
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

export default function TournamentImportPage() {
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
const [isAdmin, setIsAdmin] = useState(false)
  const [bulkText, setBulkText] = useState("")

  const [matchId, setMatchId] = useState("")
  const [tournamentName, setTournamentName] = useState("")
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
  const [savedImports, setSavedImports] = useState<SavedImport[]>([])

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

    const setGroups = Array.from(
      new Map(legacyRows.map((row) => [`${row.set}||${row.map}`, row])).keys()
    )

    const importedMaps = setGroups.map((key) => {
      const [set, mapName] = key.split("||")
      const setRows = legacyRows.filter(
        (row) => row.set === set && row.map === mapName
      )

      const leftRow = setRows.find((row) => row.player === left.player)
      const rightRow = setRows.find((row) => row.player === right.player)

      return {
        map: mapName,
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
          format,
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
          set: index + 1,
          map: map.map,
          format,
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
          set: index + 1,
          map: map.map,
          format,
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

  const totalMatchCsv = savedImports.map((item) => item.matchCsv).join("\n")
  const totalResultsCsv = savedImports.map((item) => item.resultsCsv).join("\n")

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

  function addCurrentToTotal() {
    if (!matchCsv || !resultsCsv) return

    const normalizedMatchFormat = matchFormat.trim().toLowerCase()
    const isQualifier =
      normalizedMatchFormat === "q" || normalizedMatchFormat === "qqp"

    setSavedImports((current) => [
      ...current,
      {
        id: Date.now(),
        label: isQualifier
          ? `${matchId || "Untitled"} — ${leftPlayer.player || "Player"}`
          : `${matchId || "Untitled"} — ${
              leftPlayer.player || "Player 1"
            } vs ${rightPlayer.player || "Player 2"}`,
        matchCsv,
        resultsCsv,
      },
    ])

    resetCurrentMatch()
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
          [side]: makeResultFromRuns(parsedRuns),
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
        Paste one legacy match, edit anything below, then add it to the live CSV
        output.
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-2xl font-bold">Legacy Match Paste</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Expected format: tournament, format, division, round, matchId, seed,
          player, map, set, then run values.
        </p>

        <textarea
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          placeholder="Paste one legacy match here..."
          className="mt-4 min-h-60 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-zinc-200 outline-none"
        />

          <div className="mt-6">
</div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-2xl font-bold">Manual Match Info</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Match ID" value={matchId} onChange={setMatchId} />

          <Input
            label="Tournament Name"
            value={tournamentName}
            onChange={setTournamentName}
          />

          <Input label="Round" value={round} onChange={setRound} />
          <Input label="Division" value={division} onChange={setDivision} />
          <Input label="Date" value={date} onChange={setDate} />

          <Select
            label="Map Format"
            value={format}
            onChange={setFormat}
            options={MAP_FORMAT_OPTIONS}
          />

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
              <h2 className="text-2xl font-bold">Map {mapIndex + 1}</h2>

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

            <div className="mt-4">
              <Input
                label="Map Name"
                value={map.map}
                onChange={(value) => updateMap(mapIndex, { map: value })}
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
      <section className="mt-8 grid gap-6">
  <button
    type="button"
    onClick={addCurrentToTotal}
    disabled={!matchCsv || !resultsCsv}
    className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 font-semibold text-green-300 hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
  >
    Add Current Match to Live CSV
  </button>

  {savedImports.length > 0 && (
    <div className="grid gap-2">
      {savedImports.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
        >
          <span className="text-sm text-zinc-300">{item.label}</span>

          <button
            type="button"
            onClick={() =>
              setSavedImports((current) =>
                current.filter((saved) => saved.id !== item.id)
              )
            }
            className="text-sm text-red-300 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}

  <LiveCsvBox title="Live tournament-match.csv Rows" value={totalMatchCsv} />

  <LiveCsvBox title="Live tournament-results.csv Rows" value={totalResultsCsv} />
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

            <Input
              label="Category"
              value={result.categories[runIndex] || DEFAULT_CATEGORY}
              onChange={(value) =>
                updateCategory(mapIndex, side, runIndex, value)
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveCsvBox({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-2xl font-bold">{title}</h2>

      <textarea
        readOnly
        value={value}
        placeholder="Added matches will appear here..."
        className="mt-4 min-h-40 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-zinc-200 outline-none"
      />
    </section>
  )
}