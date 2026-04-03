"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  MessageCircle,
  Settings,
  UserRound,
  XCircle,
} from "lucide-react"
import { motion } from "framer-motion"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { AuspiciousClock } from "@/components/auspicious-clock"
import { NotificationPrompt } from "@/components/notification-prompt"
import { ReminderHistory } from "@/components/reminder-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getFirebaseAuth } from "@/lib/firebase-client"
import { getProfileDisplayName, getProfileSummaryLine } from "@/lib/profile-presenter"
import { loadOwnProfileDraftFromBackend, loadPublicProfileDraftFromBackend } from "@/lib/profile-store"
import { getReceivedMatches, getSentMatches, updateMatchStatus } from "@/lib/match-api"
import { type MatchRequest, type MatchStatus, type ProfileDraft } from "@acme/core"

type MatchWithProfile = {
  match: MatchRequest
  otherUserId: string
  otherProfile: ProfileDraft | null
}

function displayNameFromDraft(draft: ProfileDraft | null, fallbackUserId: string) {
  return getProfileDisplayName(draft, "New introduction")
}

function profileMetaFromDraft(draft: ProfileDraft | null) {
  return getProfileSummaryLine(draft, "Profile shared")
}

function profileHref(otherUserId: string) {
  return `/profile?profileId=${otherUserId}`
}

function SectionCard({
  title,
  description,
  count,
  children,
}: {
  title: string
  description: string
  count: number
  children: React.ReactNode
}) {
  return (
    <Card className="border-white/10 bg-[#121214]/90 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
            {count}
          </Badge>
        </div>
        <div className="mt-5 space-y-3">{children}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-muted-foreground">{text}</p>
}

function MatchCard({
  item,
  statusLabel,
  actions,
}: {
  item: MatchWithProfile
  statusLabel: string
  actions?: React.ReactNode
}) {
  const name = displayNameFromDraft(item.otherProfile, item.otherUserId)
  const meta = profileMetaFromDraft(item.otherProfile)

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{name}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{meta}</p>
        </div>
        <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
          {statusLabel}
        </Badge>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        >
          <Link href={profileHref(item.otherUserId)}>
            Open profile
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
        {actions}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [incoming, setIncoming] = useState<MatchWithProfile[]>([])
  const [outgoing, setOutgoing] = useState<MatchWithProfile[]>([])
  const [approved, setApproved] = useState<MatchWithProfile[]>([])
  const [actionMatchId, setActionMatchId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth?redirectTo=%2Fdashboard")
      return
    }

    const currentUser = user

    let cancelled = false

    async function loadDashboard() {
      try {
        const [profileDraft, receivedMatches, sentMatches] = await Promise.all([
          loadOwnProfileDraftFromBackend(currentUser.uid),
          getReceivedMatches(currentUser.uid),
          getSentMatches(currentUser.uid),
        ])

        if (cancelled) return

        setDraft(profileDraft)

        const allMatches = [...receivedMatches, ...sentMatches]
        const otherUserIds = Array.from(
          new Set(
            allMatches.map((match) => (match.senderId === currentUser.uid ? match.receiverId : match.senderId)),
          ),
        )

        const profilePairs = await Promise.all(
          otherUserIds.map(
            async (otherUserId) => [otherUserId, await loadPublicProfileDraftFromBackend(otherUserId)] as const,
          ),
        )

        if (cancelled) return

        const profileMap = new Map(profilePairs)
        const enrich = (match: MatchRequest): MatchWithProfile => {
          const otherUserId = match.senderId === currentUser.uid ? match.receiverId : match.senderId
          return {
            match,
            otherUserId,
            otherProfile: profileMap.get(otherUserId) ?? null,
          }
        }

        const receivedPending = receivedMatches.filter((match) => match.status === "pending").map(enrich)
        const sentPending = sentMatches.filter((match) => match.status === "pending").map(enrich)
        const approvedMatches = allMatches
          .filter((match) => match.status === "approved")
          .map(enrich)
          .sort((left, right) => (right.match.updatedAt ?? right.match.createdAt) - (left.match.updatedAt ?? left.match.createdAt))

        setIncoming(receivedPending)
        setOutgoing(sentPending)
        setApproved(approvedMatches)
      } finally {
        if (!cancelled) {
          setLoadingState(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [authLoading, router, user])

  const profileCompletion = useMemo(() => {
    if (!draft) return 0

    const checks = [
      draft.basics.firstName,
      draft.basics.profession,
      draft.basics.district,
      draft.horoscope.birthDate,
      draft.horoscope.nakath,
      draft.horoscope.lagna,
      draft.family.summary,
      draft.preferences.ageMin,
      draft.preferences.ageMax,
    ]

    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [draft])

  async function handleMatchAction(matchId: string, newStatus: Extract<MatchStatus, "approved" | "rejected" | "withdrawn">) {
    if (!user) return

    const idToken = await getFirebaseAuth().currentUser?.getIdToken()
    if (!idToken) return

    setActionMatchId(matchId)

    try {
      await updateMatchStatus(idToken, matchId, newStatus)

      if (newStatus === "approved") {
        const approvedItem = incoming.find((item) => item.match.id === matchId)
        if (approvedItem) {
          setApproved((current) => [{ ...approvedItem, match: { ...approvedItem.match, status: "approved" } }, ...current])
        }
      }

      if (newStatus === "withdrawn") {
        setOutgoing((current) => current.filter((item) => item.match.id !== matchId))
      } else {
        setIncoming((current) => current.filter((item) => item.match.id !== matchId))
      }
    } finally {
      setActionMatchId(null)
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
              Loading your dashboard...
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
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Dashboard</Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                Matches and messages
              </Badge>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Your home</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {draft ? `Welcome back, ${draft.basics.firstName}.` : "Welcome back."}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Review new introductions, keep track of your outgoing requests, and continue conversations from one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild className="h-12 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/biodata">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit profile
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-foreground hover:bg-white/[0.08]"
                >
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Privacy and notifications
                  </Link>
                </Button>
                {draft ? (
                  <Button
                    variant="outline"
                    asChild
                    className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-foreground hover:bg-white/[0.08]"
                  >
                    <Link href={`/biodata/document?profileId=${user?.uid}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View biodata
                    </Link>
                  </Button>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-primary/40 bg-primary/10 px-6 text-base text-primary hover:bg-primary/20"
                >
                  <Link href="/messages">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Open messages
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {draft ? <NotificationPrompt userId={user?.uid ?? ""} /> : null}
              <AuspiciousClock />
              {draft ? (
                <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                  <CardContent className="space-y-4 px-6 py-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Privacy and notification settings</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Keep alerts useful and decide how your profile should unlock after approval.
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground">
                        Settings
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Alert mix</p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {[
                            draft.alerts.rahuKalaya ? "Rahu" : null,
                            draft.alerts.poyaDays ? "Poya" : null,
                            draft.alerts.avuruduNekath ? "Avurudu" : null,
                            draft.alerts.matchActivity ? "Matches" : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "No alerts enabled"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Privacy rule</p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {draft.privacy.photoVisibility === "blurred"
                            ? "Photo blurred until approval"
                            : draft.privacy.photoVisibility === "family"
                              ? "Family-first photo reveal"
                              : "Photo unlocks after approval"}
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="h-11 rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <Link href="/settings">
                        Open settings
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
              {draft ? <ReminderHistory /> : null}
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <CardContent className="px-6 py-6">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Incoming</p>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">{incoming.length}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <CardContent className="px-6 py-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Active connections</p>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">{approved.length}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <CardContent className="px-6 py-6">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Profile complete</p>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">{profileCompletion}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <SectionCard
                title="Incoming requests"
                description="People waiting for your response."
                count={incoming.length}
              >
                {incoming.length ? (
                  incoming.map((item) => (
                    <MatchCard
                      key={item.match.id}
                      item={item}
                      statusLabel="Pending"
                      actions={
                        <>
                          <Button
                            onClick={() => void handleMatchAction(item.match.id, "approved")}
                            disabled={actionMatchId === item.match.id}
                            className="h-10 rounded-full bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
                          >
                            {actionMatchId === item.match.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Approve"}
                          </Button>
                          <Button
                            onClick={() => void handleMatchAction(item.match.id, "rejected")}
                            disabled={actionMatchId === item.match.id}
                            variant="outline"
                            className="h-10 rounded-full border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                          >
                            Decline
                          </Button>
                        </>
                      }
                    />
                  ))
                ) : (
                  <EmptyState text="No new requests right now." />
                )}
              </SectionCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <SectionCard
                title="Outgoing requests"
                description="Requests you have already sent."
                count={outgoing.length}
              >
                {outgoing.length ? (
                  outgoing.map((item) => (
                    <MatchCard
                      key={item.match.id}
                      item={item}
                      statusLabel="Waiting"
                      actions={
                        <Button
                          onClick={() => void handleMatchAction(item.match.id, "withdrawn")}
                          disabled={actionMatchId === item.match.id}
                          variant="outline"
                          className="h-10 rounded-full border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                        >
                          {actionMatchId === item.match.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Withdraw"}
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <EmptyState text="You have no pending outgoing requests." />
                )}
              </SectionCard>
            </motion.div>
          </div>

          <div className="mt-6">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <SectionCard
                title="Active connections"
                description="Approved introductions ready for conversation."
                count={approved.length}
              >
                {approved.length ? (
                  approved.map((item) => (
                    <MatchCard
                      key={item.match.id}
                      item={item}
                      statusLabel="Approved"
                      actions={
                        <Button
                          asChild
                          className="h-10 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          <Link href={`/messages?matchId=${item.match.id}`}>
                            Open chat
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <EmptyState text="Approved introductions will appear here once both sides accept." />
                )}
              </SectionCard>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}
