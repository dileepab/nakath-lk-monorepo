"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  FileText,
  HeartHandshake,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  SearchX,
  Sparkles,
  UserRound,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { FamilyShareLinkManager } from "@/components/family-share-link-manager"
import { ProfilePhotoCard } from "@/components/profile-photo-card"
import { BiodataSharePanel } from "@/components/biodata-share-panel"
import { ShortlistNotesPanel } from "@/components/shortlist-notes-panel"
import { ShortlistToggleButton } from "@/components/shortlist-toggle-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  initialProfileDraft,
  ageFromBirthDate,
  getVerificationStatus,
  isFullyVerified,
  type ProfileDraft,
} from "@acme/core"
import { calculatePorondamPreview } from "@acme/core"
import {
  isFirebaseConfigured,
  loadPublicProfileDraftFromBackend,
  loadOwnProfileDraftFromBackend,
} from "@/lib/profile-store"
import {
  listShortlistEntries,
  removeProfileFromShortlist,
  saveProfileToShortlist,
  updateShortlistEntry,
  type ShortlistEntry,
  type ShortlistNoteTag,
} from "@/lib/shortlist-store"
import { getReceivedMatches, getSentMatches, sendMatchRequest } from "@/lib/match-api"
import { cn } from "@/lib/utils"

type ContactReveal = {
  revealed: boolean
  mode: "none" | "personal" | "family"
  displayName: string
  fields: Array<{ label: string; value: string }>
  message: string
}

function detailAge(draft: ProfileDraft) {
  return ageFromBirthDate(draft.horoscope.birthDate) ?? draft.basics.age
}

function verificationClasses(draft: ProfileDraft) {
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

  if (nic !== "not-submitted" || selfie !== "not-submitted") return "Submitted"
  return "Not submitted"
}

function visibilityLabel(draft: ProfileDraft) {
  if (draft.privacy.photoVisibility === "family") return "Family review"
  if (draft.privacy.photoVisibility === "mutual") return "Mutual unlock"
  return "Blurred first"
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-foreground">{title}</CardTitle>
        <CardDescription className="leading-6 text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

type RelationshipState = {
  status: "pending" | "approved" | "rejected" | "withdrawn"
  direction: "incoming" | "outgoing"
  matchId: string
}

type BrowseProfile = {
  id: string
  source: "backend" | "current-user"
  draft: ProfileDraft
}

export function ProfileDetailPage({ profileId }: { profileId: string }) {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<BrowseProfile | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "sign-in-required">("loading")
  const [referenceDraft, setReferenceDraft] = useState<ProfileDraft>(initialProfileDraft)
  const [referenceLabel, setReferenceLabel] = useState("Compared against the launch demo biodata.")
  const [requestState, setRequestState] = useState<"idle" | "loading" | "sent">("idle")
  const [relationship, setRelationship] = useState<RelationshipState | null>(null)
  const [contactReveal, setContactReveal] = useState<ContactReveal | null>(null)
  const [loadingContact, setLoadingContact] = useState(false)
  const [shortlistEntry, setShortlistEntry] = useState<ShortlistEntry | null>(null)
  const [savingShortlist, setSavingShortlist] = useState(false)

  const handleRequest = async () => {
    if (!user || !profile || profile.source === "current-user") return
    setRequestState("loading")
    try {
      const idToken = await user.getIdToken()
      await sendMatchRequest(idToken, profile.id)
      setRequestState("sent")
    } catch {
      setRequestState("idle")
    }
  }

  useEffect(() => {
    if (profileId === "me") {
      if (authLoading) {
        setStatus("loading")
        return
      }

      if (!user || !isFirebaseConfigured()) {
        setProfile(null)
        setStatus("sign-in-required")
        return
      }

      let cancelled = false
      setStatus("loading")

      void loadOwnProfileDraftFromBackend(user.uid)
        .then((draft) => {
          if (cancelled) return

          if (!draft) {
            setProfile(null)
            setStatus("not-found")
            return
          }

          setProfile({
            id: user.uid,
            source: "current-user",
            draft,
          })
          setStatus("ready")
        })
        .catch(() => {
          if (cancelled) return
          setProfile(null)
          setStatus("not-found")
        })

      return () => {
        cancelled = true
      }
    }

    if (authLoading) {
      setStatus("loading")
      return
    }

    if (!user || !isFirebaseConfigured()) {
      setProfile(null)
      setStatus("sign-in-required")
      return
    }

    let cancelled = false
    setStatus("loading")

    void loadPublicProfileDraftFromBackend(profileId)
      .then((draft) => {
        if (cancelled) return

        if (!draft) {
          setProfile(null)
          setStatus("not-found")
          return
        }

        setProfile({
          id: profileId,
          source: "backend",
          draft,
        })
        setStatus("ready")
      })
      .catch(() => {
        if (cancelled) return
        setProfile(null)
        setStatus("not-found")
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, profileId, user])

  useEffect(() => {
    if (authLoading) return

    if (!user || !isFirebaseConfigured()) {
      setReferenceDraft(initialProfileDraft)
      setReferenceLabel("Compared against the launch demo biodata.")
      setRelationship(null)
      return
    }

    let cancelled = false

    void Promise.all([loadOwnProfileDraftFromBackend(user.uid), getReceivedMatches(user.uid), getSentMatches(user.uid)])
      .then(([draft, received, sent]) => {
        if (cancelled) return

        if (draft) {
          setReferenceDraft(draft)
          setReferenceLabel("Compared against your saved biodata.")
        } else {
          setReferenceDraft(initialProfileDraft)
          setReferenceLabel("Compared against the launch demo biodata.")
        }

        if (profileId !== "me") {
          const incoming = received.find((match) => match.senderId === profileId)
          const outgoing = sent.find((match) => match.receiverId === profileId)
          const nextRelationship = incoming
            ? { status: incoming.status, direction: "incoming" as const, matchId: incoming.id }
            : outgoing
              ? { status: outgoing.status, direction: "outgoing" as const, matchId: outgoing.id }
              : null
          setRelationship(nextRelationship)
        } else {
          setRelationship(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        setReferenceDraft(initialProfileDraft)
        setReferenceLabel("Compared against the launch demo biodata.")
        setRelationship(null)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, profileId, user])

  useEffect(() => {
    if (!user || profileId === "me" || !isFirebaseConfigured()) {
      setShortlistEntry(null)
      return
    }

    let cancelled = false

    void listShortlistEntries(user.uid)
      .then((entries) => {
        if (!cancelled) {
          setShortlistEntry(entries.find((entry) => entry.profileId === profileId) ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShortlistEntry(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [profileId, user])

  const displayName = useMemo(() => {
    if (!profile) return ""
    return `${profile.draft.basics.firstName} ${profile.draft.basics.lastName}`.trim()
  }, [profile])
  const isShortlisted = Boolean(shortlistEntry)
  const isUnlocked = relationship?.status === "approved"
  const hasPendingIncoming = relationship?.status === "pending" && relationship.direction === "incoming"
  const hasPendingOutgoing = relationship?.status === "pending" && relationship.direction === "outgoing"
  const chatHref = relationship?.matchId ? `/messages?matchId=${relationship.matchId}` : "/messages"

  async function handleToggleShortlist() {
    if (!user || !profile || profile.source === "current-user") return

    setSavingShortlist(true)

    try {
      if (isShortlisted) {
        await removeProfileFromShortlist(user.uid, profile.id)
        setShortlistEntry(null)
      } else {
        await saveProfileToShortlist(user.uid, profile.id)
        const now = Date.now()
        setShortlistEntry({
          profileId: profile.id,
          savedAt: now,
          updatedAt: now,
          note: "",
          tags: [],
        })
      }
    } finally {
      setSavingShortlist(false)
    }
  }

  async function handleSaveShortlistNotes(next: { note: string; tags: ShortlistNoteTag[] }) {
    if (!user || !profile || !shortlistEntry) {
      throw new Error("Save this profile first, then add private notes.")
    }

    await updateShortlistEntry(user.uid, profile.id, next)
    setShortlistEntry({
      ...shortlistEntry,
      note: next.note,
      tags: next.tags,
      updatedAt: Date.now(),
    })
  }

  useEffect(() => {
    if (!user || !profile || !isUnlocked || !relationship?.matchId || profile.source === "current-user") {
      setContactReveal(null)
      setLoadingContact(false)
      return
    }

    const currentUser = user
    const currentMatchId = relationship.matchId
    let cancelled = false
    setLoadingContact(true)

    async function loadContactReveal() {
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch(`/api/matches/${currentMatchId}/contact`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Could not load contact details.")
        }

        const payload = (await response.json()) as ContactReveal
        if (!cancelled) {
          setContactReveal(payload)
        }
      } catch {
        if (!cancelled) {
          setContactReveal({
            revealed: false,
            mode: "none",
            displayName,
            fields: [],
            message: "Contact details are not available right now.",
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingContact(false)
        }
      }
    }

    void loadContactReveal()

    return () => {
      cancelled = true
    }
  }, [displayName, isUnlocked, profile, relationship?.matchId, user])

  if (status === "loading") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading the full profile view...
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  if (status === "sign-in-required") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-2xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="px-6 py-8">
              <p className="text-lg font-semibold text-foreground">Sign in to open your full profile</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Sign in to continue to this profile and open the full app navigation.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href={profileId === "me" ? "/auth?redirectTo=%2Fbiodata" : `/auth?redirectTo=${encodeURIComponent(`/profile?profileId=${profileId}`)}`}>
                    Sign in
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                >
                  <Link href="/profiles">Back to browse</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  if (status === "not-found" || !profile) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-2xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="px-6 py-8">
              <div className="flex items-center gap-3">
                <SearchX className="h-5 w-5 text-primary" />
                <p className="text-lg font-semibold text-foreground">Profile not found</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This profile is not available right now.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/biodata">
                    Open biodata builder
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                >
                  <Link href="/profiles">Back to browse</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  const { draft } = profile
  const age = detailAge(draft)
  const verified = isFullyVerified(draft)
  const preview = profile.source === "current-user" ? null : calculatePorondamPreview(referenceDraft, draft)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
      <AstrologyBackground />

      <section className="relative z-10 px-6 pb-16 pt-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" asChild className="w-fit rounded-full border border-white/10 bg-white/[0.04]">
              <Link href="/profiles">
                <ArrowLeft className="h-4 w-4" />
                Back to browse
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Profile detail</Badge>
              {profile.source === "current-user" ? (
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                  Your profile
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <Card className="overflow-hidden border-white/10 bg-[#121214]/90 py-0 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <CardContent className="p-5">
                  <ProfilePhotoCard
                    photoUrl={draft.media.profilePhotoUrl}
                    photoPath={draft.media.profilePhotoPath}
                    displayName={displayName}
                    visibility={draft.privacy.photoVisibility}
                    unlocked={isUnlocked}
                  />
                </CardContent>
              </Card>

              <DetailSection
                title="Trust snapshot"
                description="Privacy, verification, and introduction preferences."
              >
                <div className="space-y-3">
                  <div className={cn("rounded-2xl border px-4 py-3", verificationClasses(draft))}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">Verification state</span>
                      <span className="text-xs uppercase tracking-[0.2em]">{verificationLabel(draft)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Photo privacy</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {isUnlocked ? "Unlocked for approved match" : visibilityLabel(draft)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Introduction path</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {draft.verification.familyContactAllowed
                        ? "Family can coordinate the first step."
                        : "The introduction starts directly between the two profiles."}
                    </p>
                  </div>
                </div>
              </DetailSection>
            </div>

            <div className="space-y-6">
              <Card className="border-white/10 bg-[#121214]/90 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">Full profile</p>
                      <CardTitle className="mt-3 text-4xl text-foreground">{displayName}</CardTitle>
                      <CardDescription className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                        {age} years • {draft.basics.profession} • {draft.basics.district}
                      </CardDescription>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        {profile.source === "current-user" ? "Reference profile" : "Porondam preview"}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-primary">
                        {profile.source === "current-user" ? "Base" : `${preview?.total ?? 0}/20`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {profile.source === "current-user" ? "Your profile" : preview?.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn("rounded-full px-3 py-1", verificationClasses(draft))}>
                      {verificationLabel(draft)}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
                      {draft.basics.religion}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
                      {draft.basics.language}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
                      {verified ? "Verified profile" : "Verification in progress"}
                    </Badge>
                    {shortlistEntry?.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-primary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Profile summary</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{draft.family.summary}</p>
                  </div>

                  <DetailGrid
                    items={[
                      { label: "Profession", value: draft.basics.profession },
                      { label: "Location", value: draft.basics.district },
                      { label: "Height", value: `${draft.basics.heightCm} cm` },
                      { label: "Religion", value: draft.basics.religion },
                    ]}
                  />

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {profile.source === "current-user" ? (
                      <>
                        <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                          <Link href="/biodata">
                            Edit biodata
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                        >
                          <Link href="/biodata/document">
                            <FileText className="h-4 w-4" />
                            Open biodata document
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <ShortlistToggleButton
                          saved={isShortlisted}
                          loading={savingShortlist}
                          onClick={handleToggleShortlist}
                        />
                        {isUnlocked ? (
                          <>
                            <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                              <Link href={chatHref}>
                                Open chat
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              className="h-11 rounded-full border-emerald-500/25 bg-emerald-500/12 text-emerald-100"
                              disabled
                            >
                              Photo unlocked
                            </Button>
                          </>
                        ) : hasPendingIncoming ? (
                          <>
                            <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                              <Link href="/dashboard">
                                Respond in dashboard
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              disabled
                              className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground"
                            >
                              Waiting for your decision
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground opacity-90"
                              onClick={handleRequest}
                              disabled={!user || requestState !== "idle" || hasPendingOutgoing}
                            >
                              {requestState === "loading"
                                ? "Sending Request..."
                                : hasPendingOutgoing || requestState === "sent"
                                  ? "Request Sent"
                                  : "Request introduction"}
                              {!hasPendingOutgoing && requestState === "idle" && <LockKeyhole className="ml-2 h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              disabled
                              className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground"
                            >
                              Contact still protected
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <BiodataSharePanel
                    draft={draft}
                    compact
                    documentHref={profile.source === "current-user" ? "/biodata/document" : undefined}
                    title={
                      profile.source === "current-user"
                        ? "Share your biodata"
                        : "Share this profile with family"
                    }
                    description=""
                  />

                  {profile.source === "current-user" ? <FamilyShareLinkManager draft={draft} /> : null}

                  {profile.source !== "current-user" && shortlistEntry ? (
                    <ShortlistNotesPanel
                      entry={shortlistEntry}
                      onSave={handleSaveShortlistNotes}
                    />
                  ) : null}

                  {profile.source !== "current-user" && !shortlistEntry ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                      <p className="text-sm font-semibold text-foreground">Private family notes</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Save this profile first if you want to keep private family feedback, follow-up notes, or quick tags for later.
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <DetailSection
                  title="Porondam preview"
                  description={
                    profile.source === "current-user"
                      ? "This biodata is currently acting as the comparison base for other profiles."
                      : "Launch-stage scoring built from horoscope inputs, preferences, and trust signals."
                  }
                >
                  {profile.source === "current-user" ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <p className="text-sm leading-7 text-muted-foreground">
                        Save and refine this biodata, then compare other profiles against it in the browse flow. This
                        keeps the score personalized to your own age range, district, religion, and intro preferences.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{preview?.label}</p>
                              {preview ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground"
                                >
                                  {preview.confidence} confidence
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-foreground/85">{preview?.summary}</p>
                            {preview ? (
                              <p className="mt-3 text-xs leading-6 text-muted-foreground">{preview.confidenceNote}</p>
                            ) : null}
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Overall fit</p>
                            <p className="mt-2 text-2xl font-semibold text-primary">{preview?.total ?? 0}/20</p>
                          </div>
                        </div>
                      </div>
                      {preview ? (
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground">{preview.sections.traditional.label}</p>
                              <span className="text-xs uppercase tracking-[0.2em] text-primary">
                                {preview.sections.traditional.score}/{preview.sections.traditional.max}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {preview.sections.traditional.summary}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground">{preview.sections.practical.label}</p>
                              <span className="text-xs uppercase tracking-[0.2em] text-primary">
                                {preview.sections.practical.score}/{preview.sections.practical.max}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {preview.sections.practical.summary}
                            </p>
                            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Lifestyle alignment {preview.lifestylePercentage}%
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{referenceLabel}</p>
                      <div className="grid gap-3">
                        {preview?.factors.map((factor) => (
                          <div key={factor.key} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{factor.label}</p>
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  {factor.group}
                                </span>
                              </div>
                              <span className="text-xs uppercase tracking-[0.2em] text-primary">
                                {factor.score}/{factor.max}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{factor.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </DetailSection>

                <DetailSection
                  title="Horoscope context"
                  description="The fields we already have in place for Porondam and timing features later."
                >
                  <DetailGrid
                    items={[
                      { label: "Birth date", value: draft.horoscope.birthDate },
                      { label: "Birth time", value: draft.horoscope.birthTime },
                      { label: "Birth time accuracy", value: draft.horoscope.birthTimeAccuracy.replace("-", " ") },
                      { label: "Birth place", value: draft.horoscope.birthPlace },
                      {
                        label: "Normalized place",
                        value: draft.horoscope.normalizedBirthPlace || "Pending normalization",
                      },
                      {
                        label: "Nakath / Pada",
                        value: draft.horoscopeComputed
                          ? `${draft.horoscopeComputed.nakath} • Pada ${draft.horoscopeComputed.pada || "pending"}`
                          : `${draft.horoscope.nakath} • Pending snapshot`,
                      },
                      {
                        label: "Rashi / Lagna",
                        value: draft.horoscopeComputed
                          ? `${draft.horoscopeComputed.rashi || "Rashi pending"} • ${draft.horoscopeComputed.lagna || "Needs reliable birth time"}`
                          : `${draft.horoscope.lagna || "Lagna pending"} • Snapshot not refreshed`,
                      },
                      {
                        label: "Snapshot confidence",
                        value: draft.horoscopeComputed?.confidence || "Pending snapshot",
                      },
                      {
                        label: "Ayanamsa",
                        value: draft.horoscopeComputed?.ayanamsa || "Pending snapshot",
                      },
                    ]}
                  />
                </DetailSection>

                <DetailSection
                  title="Family background"
                  description="Structured for family-safe browsing rather than generic dating copy."
                >
                  <DetailGrid
                    items={[
                      { label: "Education", value: draft.family.education },
                      { label: "Siblings", value: draft.family.siblings },
                      { label: "Father's occupation", value: draft.family.fatherOccupation },
                      { label: "Mother's occupation", value: draft.family.motherOccupation },
                    ]}
                  />
                </DetailSection>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
                <DetailSection
                  title="Partner preferences"
                  description="This will later feed matching and filter logic more directly."
                >
                  <DetailGrid
                    items={[
                      { label: "Preferred age", value: `${draft.preferences.ageMin} to ${draft.preferences.ageMax}` },
                      { label: "Preferred district", value: draft.preferences.preferredDistrict },
                      { label: "Religion preference", value: draft.preferences.religionPreference },
                      { label: "Profession preference", value: draft.preferences.professionPreference },
                    ]}
                  />
                </DetailSection>

                <DetailSection
                  title="Trust and interaction rules"
                  description="These rules control what another person actually sees and when it unlocks."
                >
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">Contact visibility</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {isUnlocked
                          ? "This approved introduction can continue in private chat."
                          : draft.privacy.contactVisibility === "family-request"
                          ? "Contact is shared only through a family request flow."
                          : draft.privacy.contactVisibility === "mutual"
                            ? "Contact is released after mutual interest."
                            : "Contact stays hidden in the first stage."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">Long-term location preference</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {draft.preferences.willingToMigrate
                          ? "Open to local or diaspora relocation when the match is right."
                          : "Prefers a Sri Lanka-based future and local introductions first."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">Sharing mode</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Biodata is currently prepared in {draft.privacy.biodataShareMode.replace("-", " ")} mode.
                      </p>
                    </div>
                  </div>
                </DetailSection>
              </div>

              {profile.source !== "current-user" && isUnlocked ? (
                <DetailSection
                  title="Unlocked contact details"
                  description="Shown only after the introduction is approved and the contact rule allows it."
                >
                  {loadingContact ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-muted-foreground">
                      Loading contact details...
                    </div>
                  ) : contactReveal?.revealed ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                        <p className="text-sm font-medium text-foreground">{contactReveal.message}</p>
                      </div>
                      <DetailGrid items={contactReveal.fields} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-muted-foreground">
                      {contactReveal?.message ?? "Contact details are not available right now."}
                    </div>
                  )}
                </DetailSection>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
