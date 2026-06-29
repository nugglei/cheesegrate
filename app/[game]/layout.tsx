import { notFound } from "next/navigation"

const validGames = ["sr", "swift"]

export default async function GameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ game: string }>
}) {
  const { game } = await params

  if (!validGames.includes(game)) {
    notFound()
  }

  return <>{children}</>
}