"use client"

import { LockKeyhole, ShieldCheck } from "lucide-react"

import { type PhotoVisibility } from "@acme/core"
import { cn } from "@/lib/utils"

function visibilityCopy(visibility: PhotoVisibility) {
  if (visibility === "family") {
    return {
      badge: "Family review mode",
      title: "Photo held back for family-first sharing",
      body: "The biodata can circulate first, and the photo opens only after the family review step is complete.",
    }
  }

  if (visibility === "mutual") {
    return {
      badge: "Mutual unlock",
      title: "Photo opens after both sides respond positively",
      body: "A softened preview can exist, but the fully visible image should wait until the interest is mutual.",
    }
  }

  return {
    badge: "Blurred preview",
    title: "Photo stays softened before the intro is unlocked",
    body: "This keeps the profile respectful while still giving a sense of presence in the biodata flow.",
  }
}

export function ProfilePhotoCard({
  photoUrl,
  displayName,
  visibility,
  className,
  compact = false,
}: {
  photoUrl: string
  displayName: string
  visibility: PhotoVisibility
  className?: string
  compact?: boolean
}) {
  const copy = visibilityCopy(visibility)

  if (!photoUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20",
          compact ? "h-44 w-36" : "h-64 w-full",
          className,
        )}
      >
        <div className="px-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm font-medium text-foreground">No profile photo uploaded yet</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Upload a portrait and the privacy rule will control how it appears in shared views.
          </p>
        </div>
      </div>
    )
  }

  if (visibility === "family") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] border border-white/15 bg-[radial-gradient(circle_at_top,#5f4611_0%,#1b140a_45%,#0a0a0c_100%)]",
          compact ? "h-44 w-36" : "h-64 w-full",
          className,
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.22))]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/12">
            <LockKeyhole className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{copy.badge}</p>
          <p className="mt-3 text-sm font-medium text-foreground">{copy.title}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.body}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[24px] border border-white/10",
        compact ? "h-44 w-36" : "h-64 w-full",
        className,
      )}
    >
      <img
        src={photoUrl}
        alt={displayName}
        className={cn(
          "h-full w-full object-cover transition-transform duration-500",
          visibility === "blurred"
            ? "scale-105 blur-xl brightness-[0.72]"
            : "scale-[1.03] blur-md brightness-[0.82]",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/85 via-[#080809]/35 to-transparent" />
      <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground backdrop-blur">
        {copy.badge}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">{copy.title}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.body}</p>
        </div>
      </div>
    </div>
  )
}
