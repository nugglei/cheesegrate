import Papa from "papaparse"
import type { Run } from "./types"

let cachedRuns: Run[] | null = null

export async function loadRuns() {
  if (cachedRuns) {
    return cachedRuns
  }

  const response = await fetch("/runs.csv")
  const text = await response.text()

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
  })

  cachedRuns = parsed.data as Run[]

  return cachedRuns
}