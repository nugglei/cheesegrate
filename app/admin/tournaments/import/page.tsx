"use client"

import { useEffect, useMemo, useState } from "react"

type PlayerInput = {
  player: string
  seed: string
}

type PlayerMapResult = {
  runs: string[]
  categories: string[]
  bulkRuns: string
  visibleRunCount: number
}

type MapInput = {
  map: string
  left: PlayerMapResult
  right: PlayerMapResult
}

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

const MAX_RUN_COUNT = 10
const DEFAULT_RUN_COUNT = 5
const DEFAULT_CATEGORY = "Skipless IGT"

function makeEmptyArray(length: number) {
  return Array.from({ length }, () => "")
}

function emptyResult(): PlayerMapResult {
  return {
    runs: makeEmptyArray(MAX_RUN_COUNT),
    categories: Array.from({ length: MAX_RUN_COUNT }, () => DEFAULT_CATEGORY),
    bulkRuns: "",
    visibleRunCount: DEFAULT_RUN_COUNT,
  }
}

function emptyMap(): MapInput {
  return {
    map: "",
    left: emptyResult(),
    right: emptyResult(),
  }
}

function isBadResult(value: string) {
  return ["DNF", "DNP", "DQ"].includes(value.trim().toUpperCase())
}

function parseTime(value: string) {
  const trimmed = value.trim()
  if (!trimmed || isBadResult(trimmed)) return null

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function getBestCount(format: string) {
  const match = format.trim().toLowerCase().match(/^b(\d+)o\d+$/)
  return match ? Number(match[1]) : 1
}

function formatTime(value: number) {
  return value.toFixed(3)
}

function getAverageAndBest(runs: string[], format: string) {
  const bestCount = getBestCount(format)

  const times = runs
    .map(parseTime)
    .filter((time): time is number => time !== null)
    .sort((a, b) => a - b)

  if (times.length === 0) return { average: "DNF", best: "DNF" }

  const best = times[0]

  if (times.length < bestCount) {
    return { average: "DNF", best: String(best) }
  }

  const averageTimes = times.slice(0, bestCount)
  const average =
    averageTimes.reduce((total, time) => total + time, 0) / averageTimes.length

  return {
    average: formatTime(average),
    best: String(best),
  }
}

function csvCell(value: string | number | undefined) {
  const text = String(value ?? "")

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

function csvRow(values: (string | number | undefined)[]) {
  return values.map(csvCell).join(",")
}

function splitBulkRuns(value: string) {
  return value
    .split(/[\s,|/]+/)
    .map((run) => run.trim())
    .filter(Boolean)
}

function normalizeRuns(runs: string[]) {
  return [...runs, ...makeEmptyArray(MAX_RUN_COUNT)].slice(0, MAX_RUN_COUNT)
}

function visibleCountForRuns(runs: string[]) {
  const lastFilledIndex = runs.findLastIndex((run) => run.trim())

  return Math.max(
    DEFAULT_RUN_COUNT,
    Math.min(lastFilledIndex + 1, MAX_RUN_COUNT)
  )
}

function makeResultFromRuns(runs: string[]): PlayerMapResult {
  const normalizedRuns = normalizeRuns(runs)

  return {
    runs: normalizedRuns,
    categories: Array.from({ length: MAX_RUN_COUNT }, () => DEFAULT_CATEGORY),
    bulkRuns: normalizedRuns.filter(Boolean).join(" "),
    visibleRunCount: visibleCountForRuns(normalizedRuns),
  }
}

function buildResultRow({
  matchId,
  set,
  map,
  format,
  player,
  opponent,
  result,
}: {
  matchId: string
  set: string | number
  map: string
  format: string
  player: PlayerInput
  opponent: PlayerInput
  result: PlayerMapResult
}) {
  const csvRuns = result.runs.slice(0, MAX_RUN_COUNT)
  const csvCategories = result.categories.slice(0, MAX_RUN_COUNT)
  const { average, best } = getAverageAndBest(csvRuns, format)

  const runColumns = csvRuns.flatMap((run, index) => {
    const cleanRun = run.trim()
    const cleanCategory = csvCategories[index]?.trim() || DEFAULT_CATEGORY

    return [cleanRun, cleanRun && !isBadResult(cleanRun) ? cleanCategory : ""]
  })

  return csvRow([
    matchId,
    set,
    map,
    format,
    player.seed,
    player.player,
    opponent.player,
    ...runColumns,
    average,
    best,
  ])
}

function parseLegacyRows(rawText: string): LegacyRow[] {
  if (!rawText.trim()) return []

  return rawText
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split("\t"))
    .map((row) => {
      const [
        tournamentName,
        format,
        division,
        round,
        matchId,
        seed,
        player,
        map,
        set,
        ...runs
      ] = row

      return {
        tournamentName: tournamentName || "",
        format: format || "",
        division: division || "",
        round: round || "",
        matchId: matchId || "",
        seed: seed || "",
        player: player || "",
        map: map || "",
        set: set || "",
        runs: runs.filter((run) => run !== undefined),
      }
    })
    .filter(
      (row) =>
        row.tournamentName &&
        row.format &&
        row.round &&
        row.matchId &&
        row.seed &&
        row.player &&
        row.map &&
        row.set
    )
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

export default function TournamentImportPage() {
  const [bulkText, setBulkText] = useState("")

  const [matchId, setMatchId] = useState("")
  const [tournamentName, setTournamentName] = useState("")
  const [round, setRound] = useState("")
  const [division, setDivision] = useState("")
  const [date, setDate] = useState("")
  const [recording, setRecording] = useState("")
  const [host, setHost] = useState("")
  const [format, setFormat] = useState("b3o5")

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
    setFormat(firstRow.format)
    setLeftPlayer(left)
    setRightPlayer(right)
    setMaps(importedMaps.length > 0 ? importedMaps : [emptyMap()])
  }, [legacyRows])

  const matchCsv = useMemo(() => {
    if (!matchId || !tournamentName) return ""

    return csvRow([
      matchId,
      tournamentName,
      round,
      division,
      date,
      recording,
      host,
    ])
  }, [matchId, tournamentName, round, division, date, recording, host])

  const resultsCsv = useMemo(() => {
    return maps
      .filter((map) => map.map.trim())
      .flatMap((map, index) => [
        buildResultRow({
          matchId,
          set: index + 1,
          map: map.map,
          format,
          player: leftPlayer,
          opponent: rightPlayer,
          result: map.left,
        }),
        buildResultRow({
          matchId,
          set: index + 1,
          map: map.map,
          format,
          player: rightPlayer,
          opponent: leftPlayer,
          result: map.right,
        }),
      ])
      .join("\n")
  }, [maps, matchId, format, leftPlayer, rightPlayer])

  const totalMatchCsv = savedImports.map((item) => item.matchCsv).join("\n")
  const totalResultsCsv = savedImports.map((item) => item.resultsCsv).join("\n")

function addCurrentToTotal() {
  if (!matchCsv || !resultsCsv) return

  setSavedImports((current) => [
    ...current,
    {
      id: Date.now(),
      label: `${matchId || "Untitled"} — ${
        leftPlayer.player || "Player 1"
      } vs ${rightPlayer.player || "Player 2"}`,
      matchCsv,
      resultsCsv,
    },
  ])

  setBulkText("")
  setMatchId("")
  setTournamentName("")
  setRound("")
  setDivision("")
  setDate("")
  setRecording("")
  setHost("")
  setFormat("b3o5")

  setLeftPlayer({
    player: "",
    seed: "",
  })

  setRightPlayer({
    player: "",
    seed: "",
  })

  setMaps([emptyMap()])
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
    setBulkText("")
    setMatchId("")
    setTournamentName("")
    setRound("")
    setDivision("")
    setDate("")
    setRecording("")
    setHost("")
    setFormat("b3o5")
    setLeftPlayer({ player: "", seed: "" })
    setRightPlayer({ player: "", seed: "" })
    setMaps([emptyMap()])
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-4xl font-bold">Tournament Match Importer</h1>

      <p className="mt-2 text-zinc-400">
        Paste one legacy match, edit anything below, then copy the generated CSV
        rows.
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

        <div className="mt-6 grid gap-6">
          <OutputBox
            title="Current tournament-match.csv Row"
            value={matchCsv}
            onCopy={() => copyText(matchCsv)}
          />

          <OutputBox
            title="Current tournament-results.csv Rows"
            value={resultsCsv}
            onCopy={() => copyText(resultsCsv)}
          />

          <button
            type="button"
            onClick={addCurrentToTotal}
            className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 font-semibold text-green-300 hover:bg-green-500/20"
          >
            Add Current Match to Total
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

          <OutputBox
            title="TOTAL tournament-match.csv Rows"
            value={totalMatchCsv}
            onCopy={() => copyText(totalMatchCsv)}
          />

          <OutputBox
            title="TOTAL tournament-results.csv Rows"
            value={totalResultsCsv}
            onCopy={() => copyText(totalResultsCsv)}
          />
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
          <Input label="Format" value={format} onChange={setFormat} />
          <Input label="Recording" value={recording} onChange={setRecording} />
          <Input label="Host" value={host} onChange={setHost} />
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

function OutputBox({
  title,
  value,
  onCopy,
}: {
  title: string
  value: string
  onCopy: () => void
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>

        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm hover:bg-white/[0.1]"
        >
          Copy
        </button>
      </div>

      <textarea
        readOnly
        value={value}
        className="mt-4 min-h-40 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-zinc-200 outline-none"
      />
    </section>
  )
}