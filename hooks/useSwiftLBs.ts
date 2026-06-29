"use client"

import { useEffect, useState } from "react"
import { loadSwiftLBs } from "../lib/loadSwiftLBs"
import type { SwiftLeaderboardByMap } from "../lib/loadSwiftLBs"

export function useSwiftLBs() {
  const [leaderboards, setLeaderboards] = useState<SwiftLeaderboardByMap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSwiftLBs() {
      const data = await loadSwiftLBs()
      setLeaderboards(data)
      setLoading(false)
    }

    fetchSwiftLBs()
  }, [])

  return {
    leaderboards,
    loading,
  }
}