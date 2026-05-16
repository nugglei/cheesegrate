"use client"

import { useEffect, useState } from "react"
import Papa from "papaparse"

export default function Home() {
  const [runs, setRuns] = useState<any[]>([])

  useEffect(() => {
    async function loadCSV() {
      const response = await fetch("/runs.csv")
      const text = await response.text()

const parsed = Papa.parse(text, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: false,
})

      setRuns(parsed.data as any[])
    }

    loadCSV()
  }, [])

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-6">
        CSV Test
      </h1>

      <div className="flex flex-col gap-2">
        {runs.slice(0, 10).map((run, index) => (
          <div
            key={index}
            className="border p-3 rounded-lg"
          >
            {JSON.stringify(run)}
          </div>
        ))}
      </div>
    </main>
  )
}