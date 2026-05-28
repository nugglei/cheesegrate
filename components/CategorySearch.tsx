"use client"

import { useState } from "react"

const categoryRows = [
  ["Skip IGT", "Skip EGT", "Skip IGT + EGT"],
  ["Skipless IGT", "Skipless EGT", "Skipless IGT + EGT"],
  ["R15 Skip", "R15 Skipless", ""],
  ["R6 Skip", "R6 Skipless", ""],
  ["Glitch", "", ""],
]

type CategorySearchProps = {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export default function CategorySearch({
  selectedCategory,
  onSelectCategory,
}: CategorySearchProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full">
      <input
        readOnly
        value={selectedCategory}
        onClick={() => setIsOpen((current) => !current)}
        placeholder="Select category..."
        className="w-full cursor-pointer rounded-lg border border-white bg-black/30 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-white"
      />

      {isOpen && (
        <div className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
          {categoryRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-2"
              style={{ gridTemplateColumns: "1fr 1fr 44px" }}
            >
              {row.map((category, columnIndex) =>
                category ? (
                  <button
                    key={`${category}-${rowIndex}-${columnIndex}`}
                    type="button"
                    onClick={() => {
                      onSelectCategory(category)
                      setIsOpen(false)
                    }}
                    className="rounded-lg border px-4 py-2 text-left"
                    style={
                      category.includes("+ EGT")
                        ? {
                            borderColor: "rgba(74, 222, 128, 0.3)",
                            backgroundColor: "rgba(34, 197, 94, 0.1)",
                            color: "#86efac",
                            textAlign: "center",
                          }
                        : selectedCategory === category
                        ? {
                            borderColor: "white",
                            backgroundColor: "white",
                            color: "black",
                          }
                        : undefined
                    }
                  >
                    {category.includes("+ EGT") ? "2" : category}
                  </button>
                ) : (
                  <div key={`empty-${rowIndex}-${columnIndex}`} />
                )
              )}
            </div>
          ))}
        </div>
      )}

      {[
        "Skip IGT",
        "Skip EGT",
        "Skip IGT + EGT",
        "R15 Skip",
        "R6 Skip",
      ].includes(selectedCategory) && (
        <div className="mt-3 rounded-lg border border-yellow-400 bg-yellow-400/20 px-4 py-3 text-sm font-medium text-yellow-200">
          Runs not utilizing a skip, including runs on Skipless maps, should only be submitted to Skipless categories.
        </div>
      )}
    </div>
  )
}