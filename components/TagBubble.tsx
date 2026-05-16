type TagBubbleProps = {
  children: React.ReactNode
  tone?: "white" | "blue" | "gold" | "red" | "green" | "purple"
  size?: "sm" | "md"
}

const toneClasses = {
  white: "border-white/30 bg-white/10 text-white/80",
  blue: "border-blue-300/40 bg-blue-400/10 text-blue-200",
  gold: "border-yellow-300/40 bg-yellow-400/10 text-yellow-200",
  red: "border-red-300/40 bg-red-400/10 text-red-200",
  green: "border-green-300/40 bg-green-400/10 text-green-200",
  purple: "border-purple-300/40 bg-purple-400/10 text-purple-200",
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
}

export default function TagBubble({
  children,
  tone = "white",
  size = "sm",
}: TagBubbleProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${toneClasses[tone]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  )
}