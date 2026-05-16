"use client"

import Image from "next/image"
import Link from "next/link"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/lb", label: "Map LBs" },
  { href: "/wrs", label: "WRs" },
  { href: "/player", label: "Players" },
  { href: "/hof", label: "Hall of Fame" },
]

export default function Navbar() {
  return (
    <header className="border-b border-white/10 bg-black">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="Cheesegrate icon"
            width={32}
            height={32}
            className="h-8 w-8"
          />

          <div className="text-lg font-bold text-white">Cheesegrate</div>
        </Link>

        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}