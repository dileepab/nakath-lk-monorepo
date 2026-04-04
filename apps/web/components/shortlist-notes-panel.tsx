"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, FileText, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SHORTLIST_NOTE_TAGS, type ShortlistEntry, type ShortlistNoteTag } from "@/lib/shortlist-store"
import { cn } from "@/lib/utils"

function formatUpdatedAt(value: number | null) {
  if (!value) return "Not saved yet"

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(value)
}

export function ShortlistNotesPanel({
  entry,
  onSave,
  title = "Private family notes",
  description = "Keep private notes and quick family signals here. These stay visible only to your signed-in account.",
  className,
}: {
  entry: ShortlistEntry
  onSave: (next: { note: string; tags: ShortlistNoteTag[] }) => Promise<void>
  title?: string
  description?: string
  className?: string
}) {
  const [note, setNote] = useState(entry.note)
  const [tags, setTags] = useState<ShortlistNoteTag[]>(entry.tags)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNote(entry.note)
    setTags(entry.tags)
  }, [entry.note, entry.tags, entry.updatedAt])

  const trimmedNote = useMemo(() => note.trim().slice(0, 320), [note])
  const isDirty = trimmedNote !== entry.note || JSON.stringify(tags) !== JSON.stringify(entry.tags)

  function toggleTag(tag: ShortlistNoteTag) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))
  }

  function resetDraft() {
    setNote(entry.note)
    setTags(entry.tags)
  }

  async function handleSave() {
    setSaving(true)

    try {
      await onSave({ note: trimmedNote, tags })
      toast("Saved private notes", {
        description: "Your shortlist notes and family tags are updated.",
      })
    } catch (error) {
      toast("Could not save private notes", {
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn("rounded-3xl border border-white/10 bg-white/[0.035] p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{title}</p>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Only you can see this
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {SHORTLIST_NOTE_TAGS.map((tag) => {
          const selected = tags.includes(tag)

          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition-colors",
                selected
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/20 hover:text-foreground",
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-3">
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 320))}
          placeholder="Add a short private note for yourself or family, such as what stood out or what to revisit later."
          className="min-h-28 rounded-3xl border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/80"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>Last updated {formatUpdatedAt(entry.updatedAt ?? entry.savedAt)}</span>
          </div>
          <span>{320 - note.length} characters remaining</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !isDirty}
          className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {saving ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Saving notes...
            </>
          ) : (
            "Save notes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resetDraft}
          disabled={saving || !isDirty}
          className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
