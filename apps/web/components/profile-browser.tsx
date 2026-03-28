"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  EyeOff,
  HeartHandshake,
  LoaderCircle,
  LockKeyhole,
  Search,
  Sparkles,
  Users,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { ProfilePhotoCard } from "@/components/profile-photo-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { browseProfileFixtures, type BrowseProfileFixture } from "@acme/core"
import {
  initialProfileDraft,
  ageFromBirthDate,
  getVerificationStatus,
  isFullyVerified,
  type PhotoVisibility,
  type ProfileDraft,
} from "@acme/core"
import { calculatePorondamPreview } from "@acme/core"
import { isFirebaseConfigured, loadProfileDraftFromBackend } from "@/lib/profile-store"
import { sendMatchRequest } from "@/lib/match-api"
import { cn } from "@/lib/utils"

type BrowseFilter = "all" | "verified" | "blurred" | "family"

const filterOptions: Array<{
  value: BrowseFilter
  label: string
  description: string
}> = [
  { value: "all", label: "All profiles", description: "See the overall launch mix." },
  { value: "verified", label: "Verified", description: "Strongest trust signal first." },
  { value: "blurred", label: "Blurred first", description: "Privacy-led introductions." },
  { value: "family", label: "Family review", description: "Family-safe sharing path." },
]

function verificationTone(draft: ProfileDraft) {
  if (isFullyVerified(draft)) {
    return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
  }

  const nic = getVerificationStatus(draft, "nic")
  const selfie = getVerificationStatus(draft, "selfie")

  if (nic !== "not-submitted" || selfie !== "not-submitted") {
    return "border-amber-400/25 bg-amber-500/12 text-amber-100"
  }

  return "border-white/10 bg-white/[0.04] text-muted-foreground"
}

function verificationLabel(draft: ProfileDraft) {
  if (isFullyVerified(draft)) return "Verified"

  const nic = getVerificationStatus(draft, "nic")
  const selfie = getVerificationStatus(draft, "selfie")

  if (nic !== "not-submitted" || selfie !== "not-submitted") {
    return "Submitted"
  }

  return "Not submitted"
}

function visibilityLabel(value: PhotoVisibility) {
  if (value === "family") return "Family review"
  if (value === "mutual") return "Mutual unlock"
  return "Blurred first"
}

function cardAge(draft: ProfileDraft) {
  return ageFromBirthDate(draft.horoscope.birthDate) ?? draft.basics.age
}

function ProfileBrowseCard({
  profile,
  referenceDraft,
  currentUserUid,
}: {
  profile: BrowseProfileFixture
  referenceDraft: ProfileDraft
  currentUserUid: string | null
}) {
  const [requestState, setRequestState] = useState<"idle" | "loading" | "sent">("idle")

  const handleRequest = async () => {
    if (!currentUserUid || profile.source === "current-user") return
    setRequestState("loading")
    try {
      await sendMatchRequest(currentUserUid, profile.id)
      setRequestState("sent")
    } catch {
      setRequestState("idle")
    }
  }
  const draft = profile.draft
  const displayName = `${draft.basics.firstName} ${draft.basics.lastName}`.trim()
  const verified = isFullyVerified(draft)
  const age = cardAge(draft)
  const detailHref = profile.source === "current-user" ? "/profiles/me" : `/profiles/${profile.id}`
  const isReferenceProfile = profile.source === "current-user"
  const preview = isReferenceProfile ? null : calculatePorondamPreview(referenceDraft, draft)

  return (
    <Card className="overflow-hidden border-white/10 bg-[#121214]/90 py-0 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <CardContent className="px-0">
        <div className="grid gap-0 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r">
            <ProfilePhotoCard
              photoUrl={draft.media.profilePhotoUrl}
              displayName={displayName}
              visibility={draft.privacy.photoVisibility}
            />
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-foreground">{displayName}</h2>
                  {profile.source === "current-user" ? (
                    <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Your profile</Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {age} years • {draft.basics.profession} • {draft.basics.district} • {draft.basics.religion}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {isReferenceProfile ? "Reference profile" : "Porondam preview"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {isReferenceProfile ? "Base" : `${preview?.total ?? 0}/20`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isReferenceProfile ? "Used to score other profiles." : preview?.label}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className={cn("rounded-full px-3 py-1", verificationTone(draft))}>
                {verificationLabel(draft)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
                {visibilityLabel(draft.privacy.photoVisibility)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
                {draft.verification.familyContactAllowed ? "Family intro ready" : "Direct intro"}
              </Badge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {isReferenceProfile ? "Browse role" : "Top match signal"}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {isReferenceProfile
                    ? "This saved biodata becomes the comparison base for browse scoring."
                    : preview?.factors
                        .slice()
                        .sort((left, right) => right.score / right.max - left.score / left.max)[0]?.note ?? "Match factors are still being calculated."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Photo rule</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {draft.privacy.photoVisibility === "family"
                    ? "No photo is shown before family review."
                    : draft.privacy.photoVisibility === "mutual"
                      ? "A lighter preview appears before mutual interest."
                      : "The photo stays strongly softened until the intro unlocks."}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Profile note</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{draft.family.summary}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {profile.source === "current-user" ? (
                <>
                  <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                    <Link href={detailHref}>
                      View full profile
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                  >
                    <Link href="/biodata/document">Open biodata document</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                    <Link href={detailHref}>
                      View full profile
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRequest}
                    disabled={!currentUserUid || requestState !== "idle"}
                    className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                  >
                    {requestState === "loading" ? "Sending..." : requestState === "sent" ? "Request Sent" : draft.privacy.contactVisibility === "family-request" ? "Send family request" : "Request contact"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfileBrowser() {
  const { user, loading: authLoading } = useAuth()
  const [currentUserProfile, setCurrentUserProfile] = useState<BrowseProfileFixture | null>(null)
  const [activeFilter, setActiveFilter] = useState<BrowseFilter>("all")
  const [query, setQuery] = useState("")
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (authLoading || !user || !isFirebaseConfigured()) {
      setCurrentUserProfile(null)
      return
    }

    let cancelled = false
    setLoadingProfile(true)

    void loadProfileDraftFromBackend(user.uid)
      .then((draft) => {
        if (cancelled) return

        if (!draft) {
          setCurrentUserProfile(null)
          return
        }

        setCurrentUserProfile({
          id: `current-${user.uid}`,
          source: "current-user",
          matchScore: 19,
          draft,
        })
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProfile(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const profiles = useMemo(() => {
    const merged = currentUserProfile ? [currentUserProfile, ...browseProfileFixtures] : browseProfileFixtures

    return merged.filter((profile) => {
      if (activeFilter === "verified" && !isFullyVerified(profile.draft)) return false
      if (activeFilter === "blurred" && profile.draft.privacy.photoVisibility !== "blurred") return false
      if (activeFilter === "family" && profile.draft.privacy.photoVisibility !== "family") return false

      const normalizedQuery = query.trim().toLowerCase()
      if (!normalizedQuery) return true

      const haystack = [
        profile.draft.basics.firstName,
        profile.draft.basics.lastName,
        profile.draft.basics.profession,
        profile.draft.basics.district,
        profile.draft.family.summary,
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [activeFilter, currentUserProfile, query])
  const referenceDraft = currentUserProfile?.draft ?? initialProfileDraft

  const verifiedCount = profiles.filter((profile) => isFullyVerified(profile.draft)).length
  const familyReviewCount = profiles.filter((profile) => profile.draft.privacy.photoVisibility === "family").length

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
      <AstrologyBackground />

      <section className="relative z-10 px-6 pb-16 pt-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" asChild className="w-fit rounded-full border border-white/10 bg-white/[0.04]">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to landing page
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Browse preview</Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                Profile list
              </Badge>
              <Button
                variant="outline"
                asChild
                className="h-9 rounded-full border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
              >
                <Link href="/review">Reviewer workspace</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Real product surface</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Browse profiles in a way that actually reflects privacy, verification, and family-safe introductions.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                This is the first proper list view for the app. It uses the same biodata model, the same photo privacy
                rules, and the same verification state we already wired into the builder.
              </p>
            </div>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <CardContent className="grid gap-4 px-6 py-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Profiles shown</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{profiles.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Verified</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{verifiedCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Family-first</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{familyReviewCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl text-foreground">Browse controls</CardTitle>
                <CardDescription className="leading-6 text-muted-foreground">
                  Filter by trust level or privacy mode, then test how the cards read before we build matching logic.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search profession, district, or profile tone"
                    className="h-12 rounded-full border-white/10 bg-black/20 pl-11"
                  />
                </div>

                <div className="space-y-3">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setActiveFilter(option.value)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-4 text-left transition-all",
                        activeFilter === option.value
                          ? "border-primary/40 bg-primary/12 shadow-[0_16px_40px_rgba(212,175,55,0.12)]"
                          : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">What this proves</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    The same profile data can now drive builder, biodata PDF, browse cards, and a launch-stage
                    Porondam preview without rewriting the logic in each place.
                  </p>
                </div>

                <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary">Scoring basis</p>
                  <p className="mt-3 text-sm leading-7 text-foreground/90">
                    {currentUserProfile
                      ? "Scores are compared against your saved biodata, so the browse list reflects your own age, district, religion, and trust preferences."
                      : "Scores are currently compared against the launch demo biodata until a signed-in user profile is available."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {loadingProfile ? (
                <Card className="border-white/10 bg-white/[0.035] backdrop-blur-xl">
                  <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    Loading your saved profile into the browse view...
                  </CardContent>
                </Card>
              ) : null}

              {profiles.length ? (
                profiles.map((profile) => (
                  <ProfileBrowseCard key={profile.id} profile={profile} referenceDraft={referenceDraft} currentUserUid={user?.uid ?? null} />
                ))
              ) : (
                <Card className="border-white/10 bg-white/[0.035] backdrop-blur-xl">
                  <CardContent className="px-6 py-8">
                    <p className="text-lg font-semibold text-foreground">No profiles match this filter yet.</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Try a different trust filter or clear the search to bring the full browse set back.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
