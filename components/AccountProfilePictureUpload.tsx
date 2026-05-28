"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import PlayerProfilePicture from "@/components/PlayerProfilePicture"

type AccountProfilePictureUploadProps = {
  userId: string
  playerName: string
  initialSrc?: string | null
}

export default function AccountProfilePictureUpload({
  userId,
  playerName,
  initialSrc,
}: AccountProfilePictureUploadProps) {
  const supabase = createClient()
  const [src, setSrc] = useState(initialSrc ?? "")
  const [isUploading, setIsUploading] = useState(false)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    setIsUploading(true)

    const fileExt = file.name.split(".").pop()
    const filePath = `${userId}/profile-picture.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      alert(uploadError.message)
      setIsUploading(false)
      return
    }

    const { data } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(filePath)

    const publicUrl = `${data.publicUrl}?v=${Date.now()}`

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ profile_picture_url: publicUrl })
      .eq("id", userId)

    if (profileError) {
      alert(profileError.message)
      setIsUploading(false)
      return
    }

    setSrc(publicUrl)
    setIsUploading(false)
  }

  return (
    <label style={{ cursor: "pointer", display: "inline-flex" }}>
      <PlayerProfilePicture player={playerName} src={src} size={36} />

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
        disabled={isUploading}
        style={{ display: "none" }}
      />
    </label>
  )
}