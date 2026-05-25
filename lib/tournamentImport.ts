export type PlayerInput = {
  player: string
  seed: string
}

export type PlayerMapResult = {
  runs: string[]
  categories: string[]
  bulkRuns: string
  visibleRunCount: number
}

export type MapInput = {
  map: string
  left: PlayerMapResult
  right: PlayerMapResult
}

export type LegacyRow = {
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

export type MapPlayerSummary = {
  average: string
  best: string
  result: "W" | "L" | "D" | ""
}

export const MAX_RUN_COUNT = 10
export const DEFAULT_RUN_COUNT = 5
export const DEFAULT_CATEGORY = "Skipless IGT"

export function makeEmptyArray(length: number) {
  return Array.from({ length }, () => "")
}

export function emptyResult(): PlayerMapResult {
  return {
    runs: makeEmptyArray(MAX_RUN_COUNT),
    categories: Array.from({ length: MAX_RUN_COUNT }, () => DEFAULT_CATEGORY),
    bulkRuns: "",
    visibleRunCount: DEFAULT_RUN_COUNT,
  }
}

export function emptyMap(): MapInput {
  return {
    map: "",
    left: emptyResult(),
    right: emptyResult(),
  }
}

export function isBadResult(value: string) {
  return ["DNF", "DNP", "DQ"].includes(value.trim().toUpperCase())
}

export function parseWdlRun(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^([WDL])(?:\s+(.+))?$/i)

  if (!match) {
    return {
      outcome: "",
      csvValue: trimmed,
    }
  }

  const outcome = match[1].toUpperCase() as "W" | "D" | "L"
  const attachedValue = match[2]?.trim()

  return {
    outcome,
    csvValue: attachedValue || outcome,
  }
}

export function getCsvRunValue(run: string, format: string) {
  const normalizedFormat = format.trim().toLowerCase()

  if (normalizedFormat === "wdl") {
    return parseWdlRun(run).csvValue
  }

  return run.trim()
}

export function parseTime(value: string) {
  const trimmed = value.trim()

  if (!trimmed || isBadResult(trimmed)) {
    return null
  }

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? parsed : null
}

export function getBestCount(format: string) {
  const normalizedFormat = format.trim().toLowerCase()

  if (normalizedFormat === "b3o5") return 3
  if (normalizedFormat === "b3o5m") return 3
  if (normalizedFormat === "srm4") return 4
  if (normalizedFormat === "srm3") return 3

  const match = normalizedFormat.match(/^b(\d+)o\d+$/)

  return match ? Number(match[1]) : 1
}

export function formatTime(value: number) {
  return value.toFixed(3)
}

export function getEligibleRunsForFormat(runs: string[], format: string) {
  const normalizedFormat = format.trim().toLowerCase()

  if (normalizedFormat === "b3o5") {
    return runs.slice(0, 5)
  }

  if (normalizedFormat === "b3o5m") {
    const firstFiveRuns = runs.slice(0, 5)
    const badRunCount = firstFiveRuns.filter(isBadResult).length

    return badRunCount >= 3 ? runs.slice(0, 6) : firstFiveRuns
  }

  if (normalizedFormat === "srm4") {
    return runs.slice(0, 4)
  }

  if (normalizedFormat === "srm3") {
    return runs.slice(0, 3)
  }

  if (normalizedFormat === "qp") {
    return runs.slice(0, 10)
  }

  if (normalizedFormat === "sd" || normalizedFormat === "wdl") {
    return runs.slice(0, MAX_RUN_COUNT)
  }

  return runs
}

export function getSrmAverageAndBest(runs: string[], format: string) {
  const normalizedFormat = format.trim().toLowerCase()
  const requiredRunCount = normalizedFormat === "srm3" ? 3 : 4
  const eligibleRuns = getEligibleRunsForFormat(runs, normalizedFormat)

  if (
    eligibleRuns.length < requiredRunCount ||
    eligibleRuns.some((run) => !run.trim())
  ) {
    return { average: "DNF", best: "DNF" }
  }

  const scoredTimes = eligibleRuns.map((run) => {
    if (isBadResult(run)) {
      return 60
    }

    const parsed = parseTime(run)

    return parsed ?? 60
  })

  const validTimes = eligibleRuns
    .map(parseTime)
    .filter((time): time is number => time !== null)
    .sort((a, b) => a - b)

  const average =
    scoredTimes.reduce((total, time) => total + time, 0) / scoredTimes.length

  return {
    average: formatTime(average),
    best: validTimes.length > 0 ? formatTime(validTimes[0]) : "DNF",
  }
}

export function getQualifierPeakSummary(runs: string[], format: string) {
  const eligibleRuns = getEligibleRunsForFormat(runs, format)

  const times = eligibleRuns
    .map(parseTime)
    .filter((time): time is number => time !== null)
    .sort((a, b) => a - b)

  return {
    average: "",
    best: times.length > 0 ? formatTime(times[0]) : "DNF",
  }
}

export function getBestOnlySummary(runs: string[], format: string) {
  const eligibleRuns = getEligibleRunsForFormat(runs, format)

  const times = eligibleRuns
    .map(parseTime)
    .filter((time): time is number => time !== null)
    .sort((a, b) => a - b)

  return {
    average: "",
    best: times.length > 0 ? formatTime(times[0]) : "DNF",
  }
}

export function getAverageAndBest(runs: string[], format: string) {
  const normalizedFormat = format.trim().toLowerCase()

  if (normalizedFormat === "qp") {
    return getQualifierPeakSummary(runs, normalizedFormat)
  }

  if (normalizedFormat === "srm4" || normalizedFormat === "srm3") {
    return getSrmAverageAndBest(runs, normalizedFormat)
  }

  const bestCount = getBestCount(normalizedFormat)
  const eligibleRuns = getEligibleRunsForFormat(runs, normalizedFormat)

  const times = eligibleRuns
    .map(parseTime)
    .filter((time): time is number => time !== null)
    .sort((a, b) => a - b)

  if (times.length === 0) {
    return { average: "DNF", best: "DNF" }
  }

  const best = times[0]

  if (times.length < bestCount) {
    return { average: "DNF", best: formatTime(best) }
  }

  const averageTimes = times.slice(0, bestCount)
  const average =
    averageTimes.reduce((total, time) => total + time, 0) / averageTimes.length

  return {
    average: formatTime(average),
    best: formatTime(best),
  }
}

export function resolveAverageBasedMapResults(
  leftRuns: string[],
  rightRuns: string[],
  format: string
): {
  left: MapPlayerSummary
  right: MapPlayerSummary
} {
  const leftSummary = getAverageAndBest(leftRuns, format)
  const rightSummary = getAverageAndBest(rightRuns, format)

  const leftAverage = parseTime(leftSummary.average)
  const rightAverage = parseTime(rightSummary.average)

  const leftBest = parseTime(leftSummary.best)
  const rightBest = parseTime(rightSummary.best)

  let leftResult: MapPlayerSummary["result"] = ""
  let rightResult: MapPlayerSummary["result"] = ""

  if (leftAverage !== null && rightAverage !== null) {
    if (leftAverage < rightAverage) {
      leftResult = "W"
      rightResult = "L"
    } else if (leftAverage > rightAverage) {
      leftResult = "L"
      rightResult = "W"
    } else {
      leftResult = "D"
      rightResult = "D"
    }
  } else if (leftAverage !== null && rightAverage === null) {
    leftResult = "W"
    rightResult = "L"
  } else if (leftAverage === null && rightAverage !== null) {
    leftResult = "L"
    rightResult = "W"
  } else if (leftBest !== null && rightBest !== null) {
    if (leftBest < rightBest) {
      leftResult = "W"
      rightResult = "L"
    } else if (leftBest > rightBest) {
      leftResult = "L"
      rightResult = "W"
    } else {
      leftResult = "D"
      rightResult = "D"
    }
  } else if (leftBest !== null && rightBest === null) {
    leftResult = "W"
    rightResult = "L"
  } else if (leftBest === null && rightBest !== null) {
    leftResult = "L"
    rightResult = "W"
  } else {
    leftResult = "D"
    rightResult = "D"
  }

  return {
    left: {
      average: leftSummary.average,
      best: leftSummary.best,
      result: leftResult,
    },
    right: {
      average: rightSummary.average,
      best: rightSummary.best,
      result: rightResult,
    },
  }
}

export function resolveBestBasedMapResults(
  leftRuns: string[],
  rightRuns: string[],
  format: string
): {
  left: MapPlayerSummary
  right: MapPlayerSummary
} {
  const leftSummary = getAverageAndBest(leftRuns, format)
  const rightSummary = getAverageAndBest(rightRuns, format)

  const leftBest = parseTime(leftSummary.best)
  const rightBest = parseTime(rightSummary.best)

  let leftResult: MapPlayerSummary["result"] = ""
  let rightResult: MapPlayerSummary["result"] = ""

  if (leftBest !== null && rightBest !== null) {
    if (leftBest < rightBest) {
      leftResult = "W"
      rightResult = "L"
    } else if (leftBest > rightBest) {
      leftResult = "L"
      rightResult = "W"
    } else {
      leftResult = "D"
      rightResult = "D"
    }
  } else if (leftBest !== null && rightBest === null) {
    leftResult = "W"
    rightResult = "L"
  } else if (leftBest === null && rightBest !== null) {
    leftResult = "L"
    rightResult = "W"
  } else {
    leftResult = "D"
    rightResult = "D"
  }

  return {
    left: {
      average: leftSummary.average,
      best: leftSummary.best,
      result: leftResult,
    },
    right: {
      average: rightSummary.average,
      best: rightSummary.best,
      result: rightResult,
    },
  }
}

export function resolveSuddenDeathMapResults(
  leftRuns: string[],
  rightRuns: string[],
  format: string
): {
  left: MapPlayerSummary
  right: MapPlayerSummary
} {
  const leftSummary = getBestOnlySummary(leftRuns, format)
  const rightSummary = getBestOnlySummary(rightRuns, format)

  const eligibleLeftRuns = getEligibleRunsForFormat(leftRuns, format)
  const eligibleRightRuns = getEligibleRunsForFormat(rightRuns, format)

  let leftRunWins = 0
  let rightRunWins = 0

  for (let index = 0; index < MAX_RUN_COUNT; index += 1) {
    const leftRun = eligibleLeftRuns[index]?.trim() ?? ""
    const rightRun = eligibleRightRuns[index]?.trim() ?? ""

    if (!leftRun && !rightRun) {
      continue
    }

    const leftTime = parseTime(leftRun)
    const rightTime = parseTime(rightRun)

    if (leftTime !== null && rightTime !== null) {
      if (leftTime < rightTime) {
        leftRunWins += 1
      } else if (rightTime < leftTime) {
        rightRunWins += 1
      }

      continue
    }

    if (leftTime !== null && rightTime === null) {
      leftRunWins += 1
    } else if (leftTime === null && rightTime !== null) {
      rightRunWins += 1
    }
  }

  let leftResult: MapPlayerSummary["result"] = "D"
  let rightResult: MapPlayerSummary["result"] = "D"

  if (leftRunWins - rightRunWins >= 2) {
    leftResult = "W"
    rightResult = "L"
  } else if (rightRunWins - leftRunWins >= 2) {
    leftResult = "L"
    rightResult = "W"
  }

  return {
    left: {
      average: leftSummary.average,
      best: leftSummary.best,
      result: leftResult,
    },
    right: {
      average: rightSummary.average,
      best: rightSummary.best,
      result: rightResult,
    },
  }
}

export function resolveWdlMapResults(
  leftRuns: string[],
  rightRuns: string[],
  format: string
): {
  left: MapPlayerSummary
  right: MapPlayerSummary
} {
  const leftSummary = getBestOnlySummary(leftRuns, format)
  const rightSummary = getBestOnlySummary(rightRuns, format)

  const eligibleLeftRuns = getEligibleRunsForFormat(leftRuns, format)
  const eligibleRightRuns = getEligibleRunsForFormat(rightRuns, format)

  let leftRunWins = 0
  let rightRunWins = 0

  for (let index = 0; index < MAX_RUN_COUNT; index += 1) {
    const leftRun = eligibleLeftRuns[index]?.trim() ?? ""
    const rightRun = eligibleRightRuns[index]?.trim() ?? ""

    if (!leftRun && !rightRun) {
      continue
    }

    const leftParsed = parseWdlRun(leftRun)
    const rightParsed = parseWdlRun(rightRun)

    if (leftParsed.outcome === "W") {
      leftRunWins += 1
      continue
    }

    if (leftParsed.outcome === "L") {
      rightRunWins += 1
      continue
    }

    if (rightParsed.outcome === "W") {
      rightRunWins += 1
      continue
    }

    if (rightParsed.outcome === "L") {
      leftRunWins += 1
      continue
    }
  }

  let leftResult: MapPlayerSummary["result"] = "D"
  let rightResult: MapPlayerSummary["result"] = "D"

  if (leftRunWins > rightRunWins) {
    leftResult = "W"
    rightResult = "L"
  } else if (rightRunWins > leftRunWins) {
    leftResult = "L"
    rightResult = "W"
  }

  return {
    left: {
      average: "",
      best: leftSummary.best,
      result: leftResult,
    },
    right: {
      average: "",
      best: rightSummary.best,
      result: rightResult,
    },
  }
}

export function csvCell(value: string | number | undefined) {
  const text = String(value ?? "")

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

export function csvRow(values: (string | number | undefined)[]) {
  return values.map(csvCell).join(",")
}

export function splitBulkRuns(value: string) {
  return value
    .split(/[\s,|/]+/)
    .map((run) => run.trim())
    .filter(Boolean)
}

export function normalizeRuns(runs: string[]) {
  return [...runs, ...makeEmptyArray(MAX_RUN_COUNT)].slice(0, MAX_RUN_COUNT)
}

export function visibleCountForRuns(runs: string[]) {
  const lastFilledIndex = runs.findLastIndex((run) => run.trim())

  return Math.max(
    DEFAULT_RUN_COUNT,
    Math.min(lastFilledIndex + 1, MAX_RUN_COUNT)
  )
}

export function makeResultFromRuns(runs: string[]): PlayerMapResult {
  const normalizedRuns = normalizeRuns(runs)

  return {
    runs: normalizedRuns,
    categories: Array.from({ length: MAX_RUN_COUNT }, () => DEFAULT_CATEGORY),
    bulkRuns: normalizedRuns.filter(Boolean).join(" "),
    visibleRunCount: visibleCountForRuns(normalizedRuns),
  }
}

export function resolveMapResultsForFormat(
  leftRuns: string[],
  rightRuns: string[],
  format: string,
  matchFormat = ""
): {
  left: MapPlayerSummary
  right: MapPlayerSummary
} {
  const normalizedFormat = format.trim().toLowerCase()
  const normalizedMatchFormat = matchFormat.trim().toLowerCase()

  if (normalizedMatchFormat === "q" || normalizedMatchFormat === "qqp") {
    const leftSummary = getAverageAndBest(leftRuns, normalizedFormat)
    const rightSummary = getAverageAndBest(rightRuns, normalizedFormat)

    return {
      left: {
        average: leftSummary.average,
        best: leftSummary.best,
        result: "",
      },
      right: {
        average: rightSummary.average,
        best: rightSummary.best,
        result: "",
      },
    }
  }

  if (normalizedFormat === "qp") {
    return resolveBestBasedMapResults(leftRuns, rightRuns, normalizedFormat)
  }

  if (normalizedFormat === "sd") {
    return resolveSuddenDeathMapResults(leftRuns, rightRuns, normalizedFormat)
  }

  if (normalizedFormat === "wdl") {
    return resolveWdlMapResults(leftRuns, rightRuns, normalizedFormat)
  }

  return resolveAverageBasedMapResults(leftRuns, rightRuns, normalizedFormat)
}

export function buildResultRow({
  matchId,
  map,
  format,
  matchFormat,
  player,
  opponent,
  result,
  opponentResult,
  side,
}: {
  matchId: string
  map: string
  format: string
  matchFormat: string
  player: PlayerInput
  opponent: PlayerInput
  result: PlayerMapResult
  opponentResult: PlayerMapResult
  side: "left" | "right"
}) {
  const csvRuns = result.runs.slice(0, MAX_RUN_COUNT)
  const csvCategories = result.categories.slice(0, MAX_RUN_COUNT)
  const opponentRuns = opponentResult.runs.slice(0, MAX_RUN_COUNT)

  const normalizedFormat = format.trim().toLowerCase()
  const normalizedMatchFormat = matchFormat.trim().toLowerCase()

  const leftRunsForResult = side === "left" ? csvRuns : opponentRuns
  const rightRunsForResult = side === "left" ? opponentRuns : csvRuns

  const mapResults = resolveMapResultsForFormat(
    leftRunsForResult,
    rightRunsForResult,
    normalizedFormat,
    normalizedMatchFormat
  )

  const playerMapResult = side === "left" ? mapResults.left : mapResults.right

  const runColumns = csvRuns.flatMap((run, index) => {
    const cleanRun = getCsvRunValue(run, normalizedFormat)
    const cleanCategory = csvCategories[index]?.trim() || DEFAULT_CATEGORY

    return [cleanRun, cleanRun && !isBadResult(cleanRun) ? cleanCategory : ""]
  })

  return csvRow([
    matchId,
    map,
    format,
    player.seed,
    player.player,
    opponent.player,
    ...runColumns,
    playerMapResult.average,
    playerMapResult.best,
    playerMapResult.result,
  ])
}

export function parseLegacyRows(rawText: string): LegacyRow[] {
  if (!rawText.trim()) {
    return []
  }

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
        row.map
    )
}

export type MatchResult = "W" | "L" | "D" | ""

export function getMatchResultPoints(result: string) {
  const normalizedResult = result.trim().toUpperCase()

  if (normalizedResult === "W") return 1
  if (normalizedResult === "D") return 0.5
  if (normalizedResult === "L") return 0

  return 0
}

export function resolveMajorityMatchResult(results: string[]): MatchResult {
  const playerPoints = results.reduce(
    (total, result) => total + getMatchResultPoints(result),
    0
  )

  const totalPossiblePoints = results.length
  const opponentPoints = totalPossiblePoints - playerPoints

  if (playerPoints > opponentPoints) return "W"
  if (playerPoints < opponentPoints) return "L"

  return "D"
}

export function getAverageSum(averages: string[]) {
  let total = 0
  let hasCountedAverage = false

  for (const average of averages) {
    const trimmedAverage = average.trim()

    if (!trimmedAverage) {
      continue
    }

    if (trimmedAverage.toUpperCase() === "DNF") {
      return null
    }

    const parsedAverage = Number(trimmedAverage)

    if (!Number.isFinite(parsedAverage)) {
      return null
    }

    total += parsedAverage
    hasCountedAverage = true
  }

  return hasCountedAverage ? total : null
}

export function resolveSumMatchResult(
  averages: string[],
  opponentAverages: string[]
): MatchResult {
  const playerSum = getAverageSum(averages)
  const opponentSum = getAverageSum(opponentAverages)

  if (playerSum !== null && opponentSum !== null) {
    if (playerSum < opponentSum) return "W"
    if (playerSum > opponentSum) return "L"

    return "D"
  }

  if (playerSum !== null && opponentSum === null) return "W"
  if (playerSum === null && opponentSum !== null) return "L"

  return "D"
}

export function resolveMatchResult({
  matchFormat,
  results,
  averages,
  opponentAverages,
}: {
  matchFormat: string
  results: string[]
  averages: string[]
  opponentAverages: string[]
}): MatchResult {
  const normalizedMatchFormat = matchFormat.trim().toLowerCase()

  if (normalizedMatchFormat === "maj") {
    return resolveMajorityMatchResult(results)
  }

  if (normalizedMatchFormat === "sum") {
    return resolveSumMatchResult(averages, opponentAverages)
  }

  if (
    normalizedMatchFormat === "manual" ||
    normalizedMatchFormat === "q" ||
    normalizedMatchFormat === "qqp"
  ) {
    return ""
  }

  return ""
}