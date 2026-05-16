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
    <div className="flex gap-2 mb-6 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`border rounded-lg px-4 py-2 ${
            category === cat
              ? "bg-white text-black"
              : "bg-black text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}