type TagBubbleProps = {
  children: React.ReactNode
  tone?: "white" | "blue" | "gold" | "silver" | "red" | "lightred" | "green" | "purple"
  size?: "sm" | "md" | "lg"
}

const toneStyles = {
  white: {
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.8)",
  },
  blue: {
    borderColor: "rgba(147, 197, 253, 0.4)",
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    color: "#bfdbfe",
  },
  gold: {
    borderColor: "rgba(253, 195, 71, 0.4)",
    backgroundColor: "rgba(250, 189, 21, 0.16)",
    color: "#fedf8a",
  },
  silver: {
    borderColor: "rgba(219, 219, 219, 0.3)",
    backgroundColor: "rgba(219, 219, 219, 0.1)",
    color: "rgba(219, 219, 219, 0.8)",
  },
  red: {
  borderColor: "rgba(185, 28, 28, 0.65)",
  backgroundColor: "rgba(127, 29, 29, 0.45)",
  color: "#f87171",
},
lightred: {
  borderColor: "rgba(196, 88, 88, 0.65)",
  backgroundColor: "rgba(155, 54, 54, 0.34)",
  color: "#ffa8a8",
},
  green: {
    borderColor: "rgba(134, 239, 172, 0.4)",
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    color: "#86efac",
  },
  purple: {
    borderColor: "rgba(216, 180, 254, 0.4)",
    backgroundColor: "rgba(192, 132, 252, 0.1)",
    color: "#e9d5ff",
  },
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-4 py-2 text-xl",
}

export default function TagBubble({
  children,
  tone = "white",
  size = "sm",
}: TagBubbleProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold leading-none ${sizeClasses[size]}`}
      style={toneStyles[tone]}
    >
      {children}
    </span>
  )
}