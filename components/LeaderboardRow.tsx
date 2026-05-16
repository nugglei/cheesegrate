"use client"

import Link from "next/link"
import { useState } from "react"

type Props = {
  rank: number
  player: string
  time: string
  proof: string
  date: {
    display: string
    tooltip: string
  }
}

export default function LeaderboardRow({
  rank,
  player,
  time,
  proof,
  date,
}: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="flex items-center gap-6 border p-3 rounded-lg">
      <div className="w-6">
        {rank}
      </div>

      <div className="w-40">
        {player}
      </div>

      <div className="w-20">
        {time}
      </div>

      <Link
        href={proof}
        target="_blank"
      >
        <img
          src="/video.png"
          alt="Video"
          className="w-6 object-contain hover:opacity-70"
        />
      </Link>

      <div
        className="relative w-28"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {date.display}

        {hovered && (
          <div className="absolute left-0 top-7 border rounded-lg bg-black text-white text-sm px-2 py-1 whitespace-nowrap z-50">
            {date.tooltip}
          </div>
        )}
      </div>
    </div>
  )
}