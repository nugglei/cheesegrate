import { maps } from "./maps"

export function getMapsForCategory(category: string) {
  if (
    category === "Skipless IGT" ||
    category === "Skipless EGT"
  ) {
    return maps.filter((map) => map !== "Mystic Alps")
  }

  return maps
}