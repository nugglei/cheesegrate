export function getRankColor(
  index: number,
  fallback = "#ffffff"
) {
  if (index === 0) return "#ecb500"
  if (index === 1) return "#b4b4b4"
  if (index === 2) return "#c26d0c"

  return fallback
}