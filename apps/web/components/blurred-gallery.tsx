"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react"

import { type ProfileDraft } from "@acme/core"
import { browseProfileFixtures } from "@acme/core"
import { isFirebaseConfigured, listPublicProfileDraftsFromBackend } from "@/lib/profile-store"

type PreviewProfile = {
  id: string
  image: string
  name: string
  age: number | string
  profession: string
  location: string
  source: "real" | "demo"
}

const previewTargetCount = 6

const privacyPoints = [
  "Photos stay softened before mutual interest.",
  "Contact details are not the first thing people see.",
  "The page still feels premium without oversharing anyone.",
]

function ageFromDraft(draft: ProfileDraft) {
  return draft.basics.age || "?"
}

function anonymizeName(draft: ProfileDraft) {
  const firstName = draft.basics.firstName?.trim() || "Member"
  const lastInitial = draft.basics.lastName?.trim().charAt(0)
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName
}

function profileImageForIndex(index: number) {
  const fixtureImages = browseProfileFixtures
    .map((fixture) => fixture.draft.media.profilePhotoUrl)
    .filter(Boolean)

  return fixtureImages[index % fixtureImages.length] || "/images/couple-1.jpg"
}

function toRealPreviewProfile(profile: { id: string; draft: ProfileDraft }, index: number): PreviewProfile {
  return {
    id: profile.id,
    image: profileImageForIndex(index),
    name: anonymizeName(profile.draft),
    age: ageFromDraft(profile.draft),
    profession: profile.draft.basics.profession || "Professional background",
    location: profile.draft.basics.district || "Sri Lanka",
    source: "real",
  }
}

function toDemoPreviewProfile(index: number): PreviewProfile {
  const fixture = browseProfileFixtures[index % browseProfileFixtures.length]

  return {
    id: fixture.id,
    image: fixture.draft.media.profilePhotoUrl || profileImageForIndex(index),
    name: anonymizeName(fixture.draft),
    age: ageFromDraft(fixture.draft),
    profession: fixture.draft.basics.profession || "Professional background",
    location: fixture.draft.basics.district || "Sri Lanka",
    source: "demo",
  }
}

export function BlurredGallery() {
  const [realProfiles, setRealProfiles] = useState<Array<{ id: string; draft: ProfileDraft }>>([])

  useEffect(() => {
    if (!isFirebaseConfigured()) return

    let cancelled = false

    void listPublicProfileDraftsFromBackend()
      .then((profiles) => {
        if (cancelled) return

        const usableProfiles = profiles.filter((profile) => profile.draft.basics.firstName.trim())
        setRealProfiles(usableProfiles.slice(0, previewTargetCount))
      })
      .catch(() => {
        if (cancelled) return
        setRealProfiles([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const profiles = useMemo(() => {
    const realCards = realProfiles.map(toRealPreviewProfile)
    const fallbackCount = Math.max(0, previewTargetCount - realCards.length)
    const demoCards = Array.from({ length: fallbackCount }, (_, index) => toDemoPreviewProfile(index))
    return [...realCards, ...demoCards]
  }, [realProfiles])

  const doubledProfiles = useMemo(() => [...profiles, ...profiles], [profiles])
  const reversedProfiles = useMemo(() => [...doubledProfiles].reverse(), [doubledProfiles])

  return (
    <section id="privacy" className="relative z-10 overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Privacy Preview
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Let people browse with confidence, without exposing too much too early
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              The blurred profile idea is worth keeping. It creates intrigue, signals respect, and matches the roadmap’s
              privacy-first positioning better than an open dating-style gallery.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <LockKeyhole className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Why this section works</p>
                <p className="text-sm text-muted-foreground">It demonstrates privacy as a visible product rule.</p>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-6 text-foreground">
              {privacyPoints.map((point) => (
                <li key={point} className="border-l border-primary/25 pl-4">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden pt-3">
        <div className="animate-scroll-left flex gap-6" style={{ width: "fit-content" }}>
          {doubledProfiles.map((profile, index) => (
            <ProfileCard key={`row1-${profile.id}-${index}`} profile={profile} />
          ))}
        </div>
      </div>

      <div className="overflow-hidden pt-3">
        <div className="animate-scroll-right flex gap-6" style={{ width: "fit-content" }}>
          {reversedProfiles.map((profile, index) => (
            <ProfileCard key={`row2-${profile.id}-${index}`} profile={profile} />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
    </section>
  )
}

function ProfileCard({ profile }: { profile: PreviewProfile }) {
  return (
    <article className="group relative h-[360px] w-[260px] flex-shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        {profile.source === "real" ? "Live preview" : "Demo preview"}
      </div>

      <div className="relative h-full w-full">
        <Image
          src={profile.image}
          alt={profile.name}
          fill
          className="object-cover blur-md brightness-[0.82] transition-all duration-500 group-hover:scale-105 group-hover:blur-[7px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080809] via-[#080809]/45 to-transparent" />

        <div className="absolute inset-x-0 top-16 flex justify-center px-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
            <LockKeyhole className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Verified
            </span>
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/80">
              {profile.location}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {profile.name}, {profile.age}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{profile.profession}</p>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Introduction opens after approval</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
    </article>
  )
}
