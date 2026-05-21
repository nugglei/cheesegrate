"use client"

import Link from "next/link"
import { useState } from "react"

import { useRuns } from "../../hooks/useRuns"

import {
  categoryPresets,
  mapCategoryPresets,
} from "../../lib/categories"

import {
  getWorldRecordsForCategory,
} from "../../lib/leaderboards"

import {
  formatDate,
  formatTime,
} from "../../lib/utils"

import CategorySelector from "../../components/CategorySelector"

function slugifyPlayer(player: string) {
  return encodeURIComponent(player.toLowerCase())
}

function slugifyMap(map: string) {
  return map.toLowerCase().replaceAll(" ", "-")
}

function getMapImage(map: string) {
  return `/maps/${slugifyMap(map)}.png`
}

function isPurpleWR(map: string, category: string) {
  const preset = mapCategoryPresets[slugifyMap(map)]

  if (preset === "skip") {
    return [
      "Skip IGT",
      "Skip EGT",
      "R15 Skip",
      "R6 Skip",
    ].includes(category)
  }

  if (preset === "rthroskip") {
    return [
      "Skip IGT",
      "Skip EGT",
    ].includes(category)
  }

  if (preset === "r15skip") {
    return [
      "Skip IGT",
      "Skip EGT",
      "R15 Skip",
    ].includes(category)
  }

  if (preset === "r6skip") {
    return [
      "Skip IGT",
      "Skip EGT",
      "R6 Skip",
    ].includes(category)
  }

  return false
}

export default function WRsPage() {
  const { runs, loading } = useRuns()

  const categories = categoryPresets.skip

  const [category, setCategory] = useState(
    categories[0]
  )

  const [hoveredTime, setHoveredTime] = useState<
    number | null
  >(null)

  const wrs = getWorldRecordsForCategory(
    runs,
    category
  )

  return (
    <main style={{ padding: "40px" }}>
      <h1
        style={{
          fontSize: "36px",
          fontWeight: 700,
          marginBottom: "24px",
        }}
      >
        World Records
      </h1>

      {loading && (
        <p style={{ color: "#9ca3af" }}>
          Loading WRs...
        </p>
      )}

      <CategorySelector
        categories={categories}
        category={category}
        setCategory={setCategory}
      />

      <div
        style={{
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {wrs.map((run, index) => {
          const date = formatDate(run.date)

          const isPurple = isPurpleWR(
            run.map,
            category
          )

          const hasManyTies = run.players.length >= 12
          const hasVeryManyTies = run.players.length >= 22
          const hasExtremelyManyTies = run.players.length >= 30

          const tieFontSize = hasExtremelyManyTies
            ? "8px"
            : hasVeryManyTies
            ? "12px"
            : hasManyTies
            ? "14px"
            : "16px"

          const tieColumnGap = hasExtremelyManyTies
            ? "3px"
            : hasVeryManyTies
            ? "4px"
            : hasManyTies
            ? "7px"
            : "12px"

          const tieVideoSize = hasExtremelyManyTies
            ? "10px"
            : hasVeryManyTies
            ? "16px"
            : "20px"

          return (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "340px 110px 180px auto",
                backgroundColor: isPurple
                  ? "rgba(64, 14, 102, 0.35)"
                  : "transparent",
                borderBottom:
                  index === wrs.length - 1
                    ? "none"
                    : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: "44px",
                  padding: "0 12px",
                  borderRight:
                    "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={getMapImage(run.map)}
                  alt={run.map}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "25px",
                    height: "25px",
                    minWidth: "25px",
                    maxWidth: "25px",
                    minHeight: "25px",
                    maxHeight: "25px",
                    objectFit: "cover",
                    borderRadius: "3px",
                    display: "block",
                  }}
                />

                <Link
                  href={`/lb/${slugifyMap(run.map)}`}
                  style={{
                    paddingLeft: "44px",
                    paddingRight: "44px",
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  {run.map}
                </Link>
              </div>

              <div
                onMouseEnter={() =>
                  setHoveredTime(index)
                }
                onMouseLeave={() =>
                  setHoveredTime(null)
                }
                style={{
                  position: "relative",
                  height: "44px",
                  padding: "0 12px",
                  borderRight:
                    "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {formatTime(
                  run.time,
                  category
                )}

                {hoveredTime === index && (
                  <div
                    style={{
                      position: "absolute",
                      top: "34px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      border:
                        "1px solid rgba(255, 255, 255, 0.25)",
                      borderRadius: "8px",
                      backgroundColor: "#000000",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 400,
                      padding: "4px 8px",
                      whiteSpace: "nowrap",
                      zIndex: 50,
                    }}
                  >
                    {date.tooltip}
                  </div>
                )}
              </div>

              <div
                style={{
                  height: "44px",
                  padding: "0 12px",
                  borderRight:
                    "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: "8px",
                }}
              >
                <Link
                  href={`/player/${slugifyPlayer(
                    run.players[0]
                  )}`}
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  {run.players[0]}
                </Link>

                <a
                  href={run.proofs[0]}
                  target="_blank"
                >
                  <img
                    src="/video.png"
                    alt="Video"
                    style={{
                      width: "20px",
                      height: "20px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </a>
              </div>

              <div
                style={{
                  minHeight: "44px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  flexWrap: "wrap",
                  columnGap: tieColumnGap,
                  rowGap: "4px",
                  fontSize: tieFontSize,
                }}
              >
                {run.players.length > 1
                  ? run.players
                      .slice(1)
                      .map((player, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Link
                            href={`/player/${slugifyPlayer(
                              player
                            )}`}
                            style={{
                              color: "inherit",
                              textDecoration: "none",
                            }}
                          >
                            {player}
                          </Link>

                          <a
                            href={run.proofs[i + 1]}
                            target="_blank"
                            style={{
                              marginLeft: hasVeryManyTies
                                ? "2px"
                                : "4px",
                              width: tieVideoSize,
                              height: tieVideoSize,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src="/video.png"
                              alt="Video"
                              style={{
                                width: tieVideoSize,
                                height: tieVideoSize,
                                minWidth: tieVideoSize,
                                maxWidth: tieVideoSize,
                                minHeight: tieVideoSize,
                                maxHeight: tieVideoSize,
                                objectFit: "contain",
                                display: "block",
                              }}
                            />
                          </a>
                        </span>
                      ))
                  : "N/A"}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}