"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type AccountProfilePictureUploadProps = {
  userId: string
  playerName: string
  initialSrc?: string | null
}

export default function AccountProfilePictureUpload({
  userId,
  initialSrc,
}: AccountProfilePictureUploadProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [src, setSrc] = useState(initialSrc ?? "")
  const [isUploading, setIsUploading] = useState(false)

  const hasCustomProfilePicture = Boolean(src.trim())

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const fileExt = file.name.split(".").pop()
    const filePath = `${userId}/profile-picture.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, file, { upsert: true })

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
    window.dispatchEvent(new Event("profile-updated"))
    setIsUploading(false)
  }

  async function handleRemove() {
    setIsUploading(true)

    const { error } = await supabase
      .from("profiles")
      .update({ profile_picture_url: null })
      .eq("id", userId)

    if (error) {
      alert(error.message)
      setIsUploading(false)
      return
    }

    setSrc("")
    window.dispatchEvent(new Event("profile-updated"))
    setIsUploading(false)
  }

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
        disabled={isUploading}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60"
      >
        {isUploading ? "Uploading..." : "Change profile picture"}
      </button>

      {hasCustomProfilePicture && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isUploading}
          className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-sm font-bold text-red-200 hover:bg-red-500/15 disabled:opacity-60"
        >
          Remove profile picture
        </button>
      )}
    </div>
  )
}