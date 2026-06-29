"use client"

import Image from "next/image"

const GAME_DATA = {
  sr: {
    label: "Speed Race",
    shortLabel: "SR",
    image: "/speed-race.png",
  },
  swift: {
    label: "Swift",
    shortLabel: "Swift",
    image: "/swift.png",
  },
} as const

export type GameId = keyof typeof GAME_DATA

type GameSwitcherButtonProps = {
  game: GameId
  onGameChange: (game: GameId) => void
}

export default function GameSwitcherButton({
  game,
  onGameChange,
}: GameSwitcherButtonProps) {
  return (
    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-sm font-bold">
      <button
        type="button"
        onClick={() => onGameChange("sr")}
        title="Speed Race"
        className={`flex h-full items-center gap-2 px-3 transition ${
          game === "sr"
            ? "bg-white/15 text-white"
            : "text-zinc-400 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <Image
          src="/speed-race.png"
          alt="Speed Race"
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded object-cover"
        />

        <span className="whitespace-nowrap">SR</span>
      </button>

      <div className="h-full w-px bg-white/10" />

      <button
        type="button"
        onClick={() => onGameChange("swift")}
        title="Swift"
        className={`flex h-full items-center gap-2 px-3 transition ${
          game === "swift"
            ? "bg-white/15 text-white"
            : "text-zinc-400 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <Image
          src="/swift.png"
          alt="Swift"
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded object-cover"
        />

        <span className="whitespace-nowrap">Swift</span>
      </button>
    </div>
  )
}