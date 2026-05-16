"use client"

type PlayerSearchProps = {
  value: string
  onChange: (value: string) => void
}

export default function PlayerSearch({
  value,
  onChange,
}: PlayerSearchProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search players..."
      className="mb-6 w-full max-w-md rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
    />
  )
}