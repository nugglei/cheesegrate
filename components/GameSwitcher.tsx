"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

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

type GameId = keyof typeof GAME_DATA

function getCurrentGame(pathname: string): GameId | null {
  if (pathname === "/sr" || pathname.startsWith("/sr/")) {
    return "sr"
  }

  if (pathname === "/swift" || pathname.startsWith("/swift/")) {
    return "swift"
  }

  return null
}

function getSwitchPath(pathname: string, currentGame: GameId) {
  const otherGame = currentGame === "sr" ? "swift" : "sr"

  const currentPrefix = `/${currentGame}`
  const pathAfterGame = pathname.slice(currentPrefix.length) || ""

  if (pathAfterGame.startsWith("/lb/")) {
    return `/${otherGame}/lb`
  }

  return `/${otherGame}${pathAfterGame}`
}

export default function GameSwitcher() {
  const pathname = usePathname()
  const currentGame = getCurrentGame(pathname)

  if (!currentGame) {
    return (
      <button
        type="button"
        title="Choose a game page first"
        className="flex h-9 cursor-default items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm font-bold text-zinc-500"
      >
        <Image
          src="/speed-race.png"
          alt="Speed Race"
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded object-cover opacity-60"
        />

        <span className="whitespace-nowrap">SR</span>

        <span className="text-zinc-600">/</span>

        <Image
          src="/swift.png"
          alt="Swift"
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded object-cover opacity-60"
        />

        <span className="whitespace-nowrap">Swift</span>
      </button>
    )
  }

  const otherGame = currentGame === "sr" ? "swift" : "sr"
  const otherGameData = GAME_DATA[otherGame]
  const switchPath = getSwitchPath(pathname, currentGame)

  return (
    <Link
      href={switchPath}
      title={`Switch to ${otherGameData.label}`}
      className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
    >
      <Image
        src={otherGameData.image}
        alt={otherGameData.label}
        width={22}
        height={22}
        className="h-[22px] w-[22px] rounded object-cover"
      />

      <span className="whitespace-nowrap">{otherGameData.shortLabel}</span>
    </Link>
  )
}