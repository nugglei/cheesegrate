import Image from "next/image"

type DiscordAuthButtonProps = {
  onClick: () => void
  alt?: string
}

export default function DiscordAuthButton({
  onClick,
  alt = "Continue with Discord",
}: DiscordAuthButtonProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        width: "230px",
        minHeight: "64px",
        border: "1px solid #ffffff33",
        background: "#ffffff12",
        padding: "12px 24px",
        borderRadius: "14px",
        cursor: "pointer",
        boxShadow: "0 8px 24px #00000033",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src="/dc.png"
        alt={alt}
        width={180}
        height={40}
        style={{
          width: "180px",
          height: "auto",
          borderRadius: "8px",
          display: "block",
        }}
        priority
      />
    </button>
  )
}