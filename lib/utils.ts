export function formatTime(time: string, category: string) {
  const num = Number(time)

  if (category.includes("EGT")) {
    return num.toFixed(3)
  }

  return num.toFixed(1)
}

export function formatMapName(map: string) {
  return map
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function getIncludedCategories(category: string) {
  if (category === "Skip IGT") {
    return [
      "Skip IGT",
      "Skipless IGT",
      "R15 Skip",
      "R15 Skipless",
      "R6 Skip",
      "R6 Skipless",
    ]
  }

  if (category === "Skip EGT") {
    return ["Skip EGT", "Skipless EGT"]
  }

  if (category === "Skipless IGT") {
    return ["Skipless IGT", "R15 Skipless", "R6 Skipless"]
  }

  if (category === "R15 Skip") {
    return ["R15 Skip", "R15 Skipless"]
  }

  if (category === "R6 Skip") {
    return ["R6 Skip", "R6 Skipless"]
  }

  return [category]
}

export function formatDate(serial: string) {
  const excelEpoch = new Date(1899, 11, 30)

  const date = new Date(
    excelEpoch.getTime() +
      Number(serial) * 24 * 60 * 60 * 1000
  )

  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()

  const today = new Date()

  const daysAgo = Math.floor(
    (today.getTime() - date.getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return {
    display: `${month}-${day}-${year}`,
    tooltip: `${daysAgo} days ago`,
  }
}