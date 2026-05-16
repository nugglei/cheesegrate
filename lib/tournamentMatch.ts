export type TournamentMatchResult = {
  matchId: string
  player: string
  seed?: string
  set?: string
  map?: string
  average: string
  run1?: string
  run1category?: string
  run2?: string
  run2category?: string
  run3?: string
  run3category?: string
  run4?: string
  run4category?: string
  run5?: string
  run5category?: string
  run6?: string
  run6category?: string
  run7?: string
  run7category?: string
  run8?: string
  run8category?: string
  run9?: string
  run9category?: string
  run10?: string
  run10category?: string
}

export type MatchPlayer = {
  player: string
  seed?: string
}

export type MatchSet<T extends TournamentMatchResult = TournamentMatchResult> = {
  set?: string
  map?: string
  results: T[]
}

export type RunResult = {
  run: string
  category?: string
}

export function parseTimeValue(time?: string) {
  const parsed = Number(time)

  return Number.isFinite(parsed) ? parsed : Infinity
}

export function getCategoryTone(category: string) {
  const normalizedCategory = category.trim().toLowerCase()

  if (normalizedCategory.startsWith("skipless")) {
    return "white" as const
  }

  if (normalizedCategory.startsWith("skip")) {
    return "red" as const
  }

  return "white" as const
}

export function getResultTone(didWin: boolean, hasDraw: boolean) {
  if (hasDraw) return "gold" as const
  if (didWin) return "green" as const

  return "red" as const
}

export function getResultLabel(didWin: boolean, hasDraw: boolean) {
  if (hasDraw) return "D"
  if (didWin) return "W"

  return "L"
}

export function getScoreTone(score: number, opponentScore: number) {
  if (score > opponentScore) return "green" as const
  if (score < opponentScore) return "red" as const

  return "gold" as const
}

export function getScoreLabel(score: number, opponentScore: number) {
  if (score > opponentScore) return "W"
  if (score < opponentScore) return "L"

  return "D"
}

export function getMatchPlayers<T extends TournamentMatchResult>(
  matchResults: T[]
) {
  return Array.from(
    new Map(
      matchResults.map((result) => [
        result.player,
        {
          player: result.player,
          seed: result.seed,
        },
      ])
    ).values()
  )
}

export function getSetKey(result: TournamentMatchResult) {
  return result.set || result.map || "unknown"
}

export function getMatchSets<T extends TournamentMatchResult>(
  matchResults: T[]
) {
  return Array.from(
    new Map(
      matchResults.map((result) => {
        const setKey = getSetKey(result)

        return [
          setKey,
          {
            set: result.set,
            map: result.map,
            results: matchResults.filter((item) => getSetKey(item) === setKey),
          },
        ]
      })
    ).values()
  ).sort((a, b) => Number(a.set || 0) - Number(b.set || 0))
}

export function getMatchScore<T extends TournamentMatchResult>(
  sets: MatchSet<T>[],
  leftPlayer?: MatchPlayer,
  rightPlayer?: MatchPlayer
) {
  let leftScore = 0
  let rightScore = 0
  let drawScore = 0

  for (const set of sets) {
    const leftResult = set.results.find(
      (result) => result.player === leftPlayer?.player
    )
    const rightResult = set.results.find(
      (result) => result.player === rightPlayer?.player
    )

    const leftAverage = parseTimeValue(leftResult?.average)
    const rightAverage = parseTimeValue(rightResult?.average)

if (leftAverage === Infinity && rightAverage === Infinity) {
  continue
}

    if (leftAverage < rightAverage) {
      leftScore += 1
    } else if (rightAverage < leftAverage) {
      rightScore += 1
    } else {
      leftScore += 0.5
      rightScore += 0.5
      drawScore += 1
    }
  }

  return {
    leftScore,
    rightScore,
    drawScore,
  }
}

export function getSortedSetResults<T extends TournamentMatchResult>(
  results: T[]
) {
  return [...results].sort(
    (a, b) => parseTimeValue(a.average) - parseTimeValue(b.average)
  )
}

export function getWinningAverage<T extends TournamentMatchResult>(
  results: T[]
) {
  return parseTimeValue(getSortedSetResults(results)[0]?.average)
}

export function getHasDraw<T extends TournamentMatchResult>(
  results: T[],
  winningAverage: number
) {
  return (
    results.length > 1 &&
    results.every(
      (result) =>
        parseTimeValue(result.average) === winningAverage &&
        Number.isFinite(parseTimeValue(result.average))
    )
  )
}

export function getDidWin(
  average: string,
  winningAverage: number,
  hasDraw: boolean
) {
  const resultAverage = parseTimeValue(average)

  return (
    Number.isFinite(resultAverage) &&
    resultAverage === winningAverage &&
    !hasDraw
  )
}

export function getRuns(result: TournamentMatchResult): RunResult[] {
  return [
    { run: result.run1, category: result.run1category },
    { run: result.run2, category: result.run2category },
    { run: result.run3, category: result.run3category },
    { run: result.run4, category: result.run4category },
    { run: result.run5, category: result.run5category },
    { run: result.run6, category: result.run6category },
    { run: result.run7, category: result.run7category },
    { run: result.run8, category: result.run8category },
    { run: result.run9, category: result.run9category },
    { run: result.run10, category: result.run10category },
  ].filter((result): result is RunResult => Boolean(result.run))
}

export function getDisplayCategoryLabel(category: string) {
  return category.replace(/\s*IGT$/i, "")
}