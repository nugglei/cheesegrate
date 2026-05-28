type Props = {
  categories: string[]
  category: string
  setCategory: (category: string) => void
}

export default function CategorySelector({
  categories,
  category,
  setCategory,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => setCategory(cat)}
          className={`rounded-lg border px-4 py-2 ${
            category === cat ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}