"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  HeartHandshake,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { BiodataSharePanel } from "@/components/biodata-share-panel"
import { ProfilePhotoCard } from "@/components/profile-photo-card"
import { ShortlistToggleButton } from "@/components/shortlist-toggle-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getFirebaseAuth } from "@/lib/firebase-client"
import { getReceivedMatches, getSentMatches, sendMatchRequest } from "@/lib/match-api"
import { getProfileDisplayName, getProfileSummaryLine } from "@/lib/profile-presenter"
import { isFirebaseConfigured, loadPublicProfileDraftFromBackend } from "@/lib/profile-store"
import { listShortlistEntries, removeProfileFromShortlist, type ShortlistEntry } from "@/lib/shortlist-store"
import { type MatchRequest, type ProfileDraft, isFullyVerified } from "@acme/core"

type RelationshipState = {
  status: "pending" | "approved" | "rejected" | "withdrawn"
  direction: "incoming" | "outgoing"
  matchId: string
}

type SavedProfileItem = {
  entry: ShortlistEntry
  draft: ProfileDraft | null
  relationship: RelationshipState | null
}

function buildRelationships(currentUserId: string, matches: MatchRequest[]) {
  const nextRelationships: Record<string, RelationshipState> = {}

  for (const match of matches) {
    const otherUserId = match.senderId === currentUserId ? match.receiverId : match.senderId
    nextRelationships[otherUserId] = {
      status: match.status,
      direction: match.receiverId === currentUserId ? "incoming" : "outgoing",
      matchId: match.id,
    }
  }

  return nextRelationships
}

export default function SavedProfilesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [items, setItems] = useState<SavedProfileItem[]>([])
  const [loadingState, setLoadingState] = useState(true)
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null)
  const [requestingProfileId, setRequestingProfileId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth?redirectTo=%2Fsaved")
      return
    }

    if (!isFirebaseConfigured()) {
      setItems([])
      setLoadingState(false)
      return
    }

    const currentUser = user
    let cancelled = false

    async function loadSavedProfiles() {
      try {
        const [shortlistEntries, receivedMatches, sentMatches] = await Promise.all([
          listShortlistEntries(currentUser.uid),
          getReceivedMatches(currentUser.uid),
          getSentMatches(currentUser.uid),
        ])

        const relationshipMap = buildRelationships(currentUser.uid, [...receivedMatches, ...sentMatches])
        const drafts = await Promise.all(
          shortlistEntries.map(async (entry) => ({
            entry,
            draft: await loadPublicProfileDraftFromBackend(entry.profileId),
            relationship: relationshipMap[entry.profileId] ?? null,
          })),
        )

        if (!cancelled) {
          setItems(drafts)
        }
      } finally {
        if (!cancelled) {
          setLoadingState(false)
        }
      }
    }

    void loadSavedProfiles()

    return () => {
      cancelled = true
    }
  }, [authLoading, router, user])

  const pendingIncomingCount = useMemo(
    () => items.filter((item) => item.relationship?.status === "pending" && item.relationship.direction === "incoming").length,
    [items],
  )
  const approvedCount = useMemo(
    () => items.filter((item) => item.relationship?.status === "approved").length,
    [items],
  )

  async function handleRemove(profileId: string) {
    if (!user) return

    setSavingProfileId(profileId)
    try {
      await removeProfileFromShortlist(user.uid, profileId)
      setItems((current) => current.filter((item) => item.entry.profileId !== profileId))
    } finally {
      setSavingProfileId(null)
    }
  }

  async function handleRequest(profileId: string) {
    if (!user) return

    const token = await getFirebaseAuth().currentUser?.getIdToken()
    if (!token) return

    setRequestingProfileId(profileId)

    try {
      await sendMatchRequest(token, profileId)
      setItems((current) =>
        current.map((item) =>
          item.entry.profileId === profileId
            ? {
                ...item,
                relationship: {
                  status: "pending",
                  direction: "outgoing",
                  matchId: item.relationship?.matchId ?? item.entry.profileId,
                },
              }
            : item,
        ),
      )
    } finally {
      setRequestingProfileId(null)
    }
  }

  if (authLoading || loadingState) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading your saved profiles...
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

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
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Saved</Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                Shortlist
              </Badge>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Return later</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Keep the profiles you want to revisit in one calm place.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Save profiles while browsing, then come back when you are ready to compare, request an introduction, or continue an approved conversation.
              </p>
            </div>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <CardContent className="grid gap-4 px-6 py-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Saved profiles</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{items.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Awaiting you</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{pendingIncomingCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Approved</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{approvedCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 space-y-6">
            {items.length ? (
              items.map((item) => {
                const displayName = getProfileDisplayName(item.draft, "Saved profile")
                const summaryLine = getProfileSummaryLine(item.draft, "Profile shared")
                const unlocked = item.relationship?.status === "approved"
                const pendingIncoming = item.relationship?.status === "pending" && item.relationship.direction === "incoming"
                const pendingOutgoing = item.relationship?.status === "pending" && item.relationship.direction === "outgoing"
                const chatHref = item.relationship?.matchId ? `/messages?matchId=${item.relationship.matchId}` : "/messages"

                return (
                  <Card
                    key={item.entry.profileId}
                    className="overflow-hidden border-white/10 bg-[#121214]/90 py-0 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                  >
                    <CardContent className="px-0">
                      <div className="grid gap-0 xl:grid-cols-[0.92fr_1.08fr]">
                        <div className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r">
                          <ProfilePhotoCard
                            photoUrl={item.draft?.media.profilePhotoUrl ?? ""}
                            photoPath={item.draft?.media.profilePhotoPath ?? ""}
                            displayName={displayName}
                            visibility={item.draft?.privacy.photoVisibility ?? "blurred"}
                            unlocked={unlocked}
                          />
                        </div>

                        <div className="p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-semibold text-foreground">{displayName}</h2>
                                <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">
                                  Saved
                                </Badge>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-muted-foreground">{summaryLine}</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Current state</p>
                              <p className="mt-2 text-sm font-semibold text-foreground">
                                {item.relationship?.status === "approved"
                                  ? "Approved match"
                                  : pendingIncoming
                                    ? "Waiting for you"
                                    : pendingOutgoing
                                      ? "Request sent"
                                      : "Saved for later"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground"
                            >
                              {item.draft && isFullyVerified(item.draft) ? "Verified profile" : "Profile shared"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground"
                            >
                              {unlocked ? "Photo unlocked" : item.draft?.privacy.photoVisibility === "family" ? "Family review" : "Blurred first"}
                            </Badge>
                          </div>

                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Why keep this saved</p>
                              <p className="mt-2 text-sm font-medium text-foreground">
                                {pendingIncoming
                                  ? "This profile is waiting for your decision in the dashboard."
                                  : unlocked
                                    ? "This match is approved and ready for conversation."
                                    : "Keep this profile nearby while you compare and decide later."}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Trust signal</p>
                              <p className="mt-2 text-sm font-medium text-foreground">
                                {item.draft?.verification.familyContactAllowed
                                  ? "Family-assisted introduction is available."
                                  : "Direct introduction is available through the app."}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                              <Link href={`/profile?profileId=${item.entry.profileId}`}>
                                Open profile
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>

                            {unlocked ? (
                              <Button
                                asChild
                                variant="outline"
                                className="h-11 rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                              >
                                <Link href={chatHref}>Open chat</Link>
                              </Button>
                            ) : pendingIncoming ? (
                              <Button
                                asChild
                                variant="outline"
                                className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                              >
                                <Link href="/dashboard">Respond in dashboard</Link>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => void handleRequest(item.entry.profileId)}
                                disabled={requestingProfileId === item.entry.profileId || pendingOutgoing}
                                className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                              >
                                {requestingProfileId === item.entry.profileId
                                  ? "Sending..."
                                  : pendingOutgoing
                                    ? "Request sent"
                                    : "Request introduction"}
                              </Button>
                            )}

                            <ShortlistToggleButton
                              saved
                              loading={savingProfileId === item.entry.profileId}
                              savedLabel="Remove from saved"
                              loadingLabel="Updating..."
                              onClick={() => void handleRemove(item.entry.profileId)}
                            />
                          </div>

                          {item.draft ? <BiodataSharePanel draft={item.draft} compact /> : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <CardContent className="space-y-4 px-6 py-8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="text-lg font-semibold text-foreground">No saved profiles yet</p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Save profiles from Browse or from a profile detail page, then come back here to compare and continue when you are ready.
                  </p>
                  <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/profiles">Go to browse</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
