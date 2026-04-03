"use client"

import { Bookmark, BookmarkCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ShortlistToggleButton({
  saved,
  loading,
  disabled,
  onClick,
  fullWidth = false,
  savedLabel = "Saved for later",
  unsavedLabel = "Save for later",
  loadingLabel = "Saving...",
}: {
  saved: boolean
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  fullWidth?: boolean
  savedLabel?: string
  unsavedLabel?: string
  loadingLabel?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || loading}
      className={`h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08] ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {loading ? loadingLabel : saved ? savedLabel : unsavedLabel}
    </Button>
  )
}
