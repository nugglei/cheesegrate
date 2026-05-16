"use client"

import { useEffect, useState } from "react"
import type { Run } from "../lib/types"
import { loadRuns } from "../lib/loadRuns"

export function useRuns() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRuns() {
      const data = await loadRuns()
      setRuns(data)
      setLoading(false)
    }

    fetchRuns()
  }, [])

  return {
    runs,
    loading,
  }
}