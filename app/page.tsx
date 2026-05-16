import Link from "next/link"

const mainLinks = [
  { href: "/lb", label: "Map LBs" },
  { href: "#", label: "Player Profile" },
  { href: "#", label: "Submissions" },
  { href: "#", label: "Tournament Results" },
  { href: "/player", label: "Player Directory" },
  { href: "/hof", label: "Hall of Fame" },
]

export default function Home() {
  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="mb-6 text-3xl font-bold">
          Cheesegrate
        </h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mainLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-lg underline"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <Link href="#" className="block text-lg underline">
            Submit Records
          </Link>

          <Link href="#" className="block text-lg underline">
            Rulebook
          </Link>

          <Link href="#" className="block text-lg underline">
            Guilds
          </Link>
        </div>
      </section>

      <aside className="space-y-6">
        <section>
          <h2 className="font-bold">Most Recent Submission</h2>
          <p className="text-sm text-zinc-400">Placeholder</p>
        </section>

        <section>
          <h2 className="font-bold">Random WR</h2>
          <p className="text-sm text-zinc-400">Placeholder</p>
        </section>

        <section>
          <h2 className="font-bold">Random Stat</h2>
          <p className="text-sm text-zinc-400">Placeholder</p>
        </section>

        <section>
          <h2 className="font-bold">Map of the Day</h2>
          <p className="text-sm text-zinc-400">Placeholder</p>
        </section>
      </aside>
    </main>
  )
}