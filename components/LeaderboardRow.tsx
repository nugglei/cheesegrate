"use client"

import Link from "next/link"
import { useState } from "react"
import TagBubble from "./TagBubble"

type Props = {
  rank: number
  player: string
  time: string
  proof: string
  date: {
    display: string
    tooltip: string
  }
  tag?: string
}

function slugifyPlayer(player: string) {
  return encodeURIComponent(player.toLowerCase())
}

export default function LeaderboardRow({
  rank,
  player,
  time,
  proof,
  date,
  tag,
}: Props) {
  const [hovered, setHovered] = useState(false)

  const hasProof = proof.trim().length > 0
  const isMobile = tag?.toLowerCase() === "mobile"
  const isTournament = tag?.toLowerCase() === "tournament"

  const topThree = rank <= 3

  const rowStyle =
    rank === 1
      ? {
          borderColor: "#ca8a04",
          backgroundColor: "#3b2f05",
        }
      : rank === 2
      ? {
          borderColor: "#9ca3af",
          backgroundColor: "#262626",
        }
      : rank === 3
      ? {
          borderColor: "#a5500b",
          backgroundColor: "#3b1d0f",
        }
      : {
          borderColor: "#404040",
          backgroundColor: "#111111",
        }

  const rankStyle =
    rank === 1
      ? { color: "#facc15" }
      : rank === 2
        ? { color: "#d4d4d8" }
        : rank === 3
          ? { color: "#fb923c" }
          : { color: "#ffffff" }

  return (
    <div
      className="flex w-fit items-center gap-6 border p-3 rounded-lg"
      style={rowStyle}
    >
      <div className="w-6 font-bold" style={rankStyle}>
        {rank}
      </div>

      <div className={`w-40 text-white ${topThree ? "font-bold" : ""}`}>
        <Link
          href={`/player/${slugifyPlayer(player)}`}
          className="hover:underline"
        >
          {player}
        </Link>
      </div>

      <div className="w-20 font-bold text-white">{time}</div>

      <div className="w-6">
        {hasProof && (
          <Link href={proof} target="_blank">
            <img
              src="/video.png"
              alt="Video"
              className="w-6 object-contain hover:opacity-70"
            />
          </Link>
        )}
      </div>

      <div
        className="relative flex w-56 items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="text-white">{date.display}</span>

        {isMobile && (
          <span className="ml-4">
            <TagBubble>Mobile</TagBubble>
          </span>
        )}

        {isTournament && (
          <span className="ml-4">
            <TagBubble tone="purple">Tournament</TagBubble>
          </span>
        )}

        {hovered && (
          <div className="absolute left-0 top-7 border rounded-lg bg-black text-white text-sm px-2 py-1 whitespace-nowrap z-50">
            {date.tooltip}
          </div>
        )}
      </div>
    </div>
  )
}