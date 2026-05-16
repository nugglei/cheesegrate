type StatOption = {
  value: string
  label: string
}

type StatSelectorProps = {
  options: StatOption[]
  stat: string
  setStat: (stat: string) => void
}

export default function StatSelector({
  options,
  stat,
  setStat,
}: StatSelectorProps) {
  return (
    <div className="mx-auto flex w-fit overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setStat(option.value)}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            stat === option.value
              ? "bg-neutral-200 text-black"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}