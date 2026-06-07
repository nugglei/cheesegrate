"use client"

import { useEffect, useMemo, useState } from "react"
import { countries } from "@/lib/countries"
import { createClient } from "@/lib/supabase/client"

type Props = {
  userId: string
}

export default function AccountCountryEditor({ userId }: Props) {
  const [countryCode, setCountryCode] = useState("")
  const [countryName, setCountryName] = useState("")
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadCountry() {
      setLoading(true)

      const supabase = createClient()

      const { data, error } = await supabase
        .from("profiles")
        .select("country_code, country_name")
        .eq("id", userId)
        .maybeSingle()

      console.log("Loaded country:", { data, error })

      setCountryCode(data?.country_code || "")
      setCountryName(data?.country_name || "")
      setLoading(false)
    }

    loadCountry()
  }, [userId])

  const isLocked = Boolean(countryCode)

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return countries
    }

    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    )
  }, [search])

  async function saveCountry(nextCode: string) {
    if (isLocked) return

    const country = countries.find((item) => item.code === nextCode)

    if (!country) return

    setSaving(true)
    setSaved(false)

    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        country_code: country.code,
        country_name: country.name,
      })
      .eq("id", userId)

    if (error) {
      console.error("Country save failed:", error)
      setSaving(false)
      return
    }

    setCountryCode(country.code)
    setCountryName(country.name)
    setSearch("")
    setIsOpen(false)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "24px" }}>
      <label style={{ fontWeight: 700 }} htmlFor="country">
        Country
      </label>

      <div className="relative">
        <input
          id="country"
          value={isLocked ? countryName : search}
          onChange={(event) => {
            setSearch(event.target.value)
            setIsOpen(true)
            setSaved(false)
          }}
          onFocus={() => {
            if (!isLocked) {
              setIsOpen(true)
            }
          }}
          disabled={loading || isLocked}
          placeholder={loading ? "Loading country..." : "Search country..."}
          className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
        />

        {!isLocked && isOpen && (
          <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-white/15 bg-black shadow-xl">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => saveCountry(country.code)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/10"
              >
                <span>{country.name}</span>
                <span className="text-xs text-zinc-500">{country.code}</span>
              </button>
            ))}

            {filteredCountries.length === 0 && (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No countries found.
              </div>
            )}
          </div>
        )}
      </div>

      {saving && <p className="text-sm text-zinc-400">Saving...</p>}
      {saved && (
  <p style={{ fontSize: "13px", color: "rgb(74 222 128)" }}>
    Saved country!
  </p>
)}
    </div>
  )
}