type PlayerProfilePictureProps = {
  player: string
  src?: string
  size?: number
  className?: string
}

export const DEFAULT_PLAYER_PROFILE_PICTURE = "/graycheese.png"

export default function PlayerProfilePicture({
  player,
  src,
  size = 44,
  className = "",
}: PlayerProfilePictureProps) {
  const imageSrc = src?.trim() || DEFAULT_PLAYER_PROFILE_PICTURE

  return (
    <img
      src={imageSrc}
      alt={`${player} profile picture`}
      width={size}
      height={size}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "cover",
        flexShrink: 0,
        borderRadius: "9999px",
      }}
    />
  )
}