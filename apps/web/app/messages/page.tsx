"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, Suspense } from "react"
import { ArrowLeft, LoaderCircle, MessageCircle } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ChatWindow } from "@/components/chat-window"
import { getProfileDisplayName, getProfileSummaryLine } from "@/lib/profile-presenter"
import { subscribeReceivedMatches, subscribeSentMatches } from "@/lib/match-api"
import { loadPublicProfileDraftFromBackend } from "@/lib/profile-store"
import { type MatchRequest, type ProfileDraft } from "@acme/core"

type MatchListItem = {
  match: MatchRequest
  otherUserId: string
  otherProfile: ProfileDraft | null
}

function displayNameFromDraft(draft: ProfileDraft | null, fallbackUserId: string) {
  return getProfileDisplayName(draft, "Your match")
}

function profileMetaFromDraft(draft: ProfileDraft | null) {
  return getProfileSummaryLine(draft, "Approved introduction")
}

function formatConversationTime(value: number | undefined) {
  if (!value) return ""

  return new Intl.DateTimeFormat("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Colombo",
  }).format(value)
}

function MessagesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [matches, setMatches] = useState<MatchListItem[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/auth?redirectTo=%2Fmessages")
      return
    }

    const currentUser = user

    let cancelled = false

    async function syncMatches(received: MatchRequest[], sent: MatchRequest[]) {
      try {
        const approvedMatches = [...received, ...sent]
          .filter((match) => match.status === "approved")
          .sort(
            (left, right) =>
              (right.lastMessageAt ?? right.updatedAt ?? right.createdAt) -
              (left.lastMessageAt ?? left.updatedAt ?? left.createdAt),
          )
        const otherUserIds = Array.from(
          new Set(
            approvedMatches.map((match) => (match.senderId === currentUser.uid ? match.receiverId : match.senderId)),
          ),
        )
        const profilePairs = await Promise.all(
          otherUserIds.map(
            async (otherUserId) => [otherUserId, await loadPublicProfileDraftFromBackend(otherUserId)] as const,
          ),
        )

        if (cancelled) return

        const profileMap = new Map(profilePairs)
        const nextMatches = approvedMatches.map((match) => {
          const otherUserId = match.senderId === currentUser.uid ? match.receiverId : match.senderId
          return {
            match,
            otherUserId,
            otherProfile: profileMap.get(otherUserId) ?? null,
          }
        })

        setMatches(nextMatches)

        const requestedMatchId = searchParams.get("matchId")
        const requestedMatch = requestedMatchId
          ? nextMatches.find((item) => item.match.id === requestedMatchId) ?? null
          : null
        setActiveMatchId((current) => {
          if (current && nextMatches.some((item) => item.match.id === current)) {
            return current
          }
          return requestedMatch?.match.id ?? null
        })
      } finally {
        if (!cancelled) {
          setLoadingMatches(false)
        }
      }
    }

    let latestReceived: MatchRequest[] = []
    let latestSent: MatchRequest[] = []

    const unsubscribeReceived = subscribeReceivedMatches(currentUser.uid, (matches) => {
      latestReceived = matches
      void syncMatches(latestReceived, latestSent)
    })

    const unsubscribeSent = subscribeSentMatches(currentUser.uid, (matches) => {
      latestSent = matches
      void syncMatches(latestReceived, latestSent)
    })

    return () => {
      cancelled = true
      unsubscribeReceived()
      unsubscribeSent()
    }
  }, [authLoading, router, searchParams, user])

  const activeMatch = useMemo(
    () => matches.find((item) => item.match.id === activeMatchId)?.match ?? null,
    [activeMatchId, matches],
  )
  const activeMatchItem = useMemo(
    () => matches.find((item) => item.match.id === activeMatchId) ?? null,
    [activeMatchId, matches],
  )
  const currentUserId = user?.uid ?? null
  const showMobileChat = Boolean(activeMatch && user)
  const unreadConversationCount = useMemo(() => {
    if (!currentUserId) return 0
    return matches.filter((item) => {
      const incomingCount = item.match.messageCounts?.[item.otherUserId] ?? 0
      const readCount = item.match.readStates?.[currentUserId]?.readMessageCount ?? 0
      return incomingCount - readCount > 0
    }).length
  }, [currentUserId, matches])

  function openMatch(matchId: string) {
    setActiveMatchId(matchId)
    router.replace(`/messages?matchId=${encodeURIComponent(matchId)}`)
  }

  function closeMobileChat() {
    setActiveMatchId(null)
    router.replace("/messages")
  }

  if (authLoading || loadingMatches) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading conversations...
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
      <AstrologyBackground />

      <section className="relative z-10 flex h-screen flex-col px-6 pb-16 pt-10 md:px-12 lg:px-20">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" asChild className="w-fit rounded-full border border-white/10 bg-white/[0.04]">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {unreadConversationCount ? (
                <Badge variant="outline" className="rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-primary">
                  {unreadConversationCount} unread
                </Badge>
              ) : null}
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Private messages</Badge>
            </div>
          </div>

          <div className="mt-8 flex min-h-0 flex-1 gap-6 pb-8">
            <Card
              className={`${
                showMobileChat ? "hidden lg:flex" : "flex"
              } min-h-0 flex-1 flex-col overflow-hidden border-white/10 bg-[#121214]/95 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:max-w-[360px] lg:flex-[0_0_360px]`}
            >
              <div className="border-b border-white/10 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Inbox</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">Approved matches</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Keep conversations organized and return to the threads that need your attention.
                </p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {matches.length === 0 ? (
                  <p className="p-3 text-center text-sm text-muted-foreground">No approved matches yet.</p>
                ) : (
                  matches.map((item) => {
                    if (!currentUserId) return null
                    const selected = activeMatchId === item.match.id
                    const incomingCount = item.match.messageCounts?.[item.otherUserId] ?? 0
                    const readCount = item.match.readStates?.[currentUserId]?.readMessageCount ?? 0
                    const unreadCount = Math.max(0, incomingCount - readCount)
                    const lastActivityAt = item.match.lastMessageAt ?? item.match.updatedAt ?? item.match.createdAt
                    const previewText =
                      item.match.lastMessagePreview ||
                      profileMetaFromDraft(item.otherProfile) ||
                      "Approved introduction"

                    return (
                      <button
                        key={item.match.id}
                        onClick={() => openMatch(item.match.id)}
                        className={`w-full rounded-3xl border p-4 text-left transition-all ${
                          selected
                            ? "border-primary/35 bg-primary/15 shadow-[0_20px_45px_rgba(191,146,53,0.14)]"
                            : unreadCount > 0
                              ? "border-primary/20 bg-primary/8 hover:bg-primary/12"
                              : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 text-sm font-semibold text-primary">
                            {displayNameFromDraft(item.otherProfile, item.otherUserId).slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {displayNameFromDraft(item.otherProfile, item.otherUserId)}
                                </p>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {formatConversationTime(lastActivityAt)}
                                </p>
                              </div>
                              {unreadCount > 0 ? (
                                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground">
                                  {unreadCount}
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`mt-3 line-clamp-2 text-sm leading-6 ${
                                unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {previewText}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </Card>

            {activeMatch && user ? (
              <div className={`${showMobileChat ? "flex" : "hidden lg:flex"} min-h-0 flex-1`}>
                <ChatWindow
                  activeMatch={activeMatch}
                  currentUserId={user.uid}
                  otherDisplayName={
                    activeMatchItem
                      ? displayNameFromDraft(activeMatchItem.otherProfile, activeMatchItem.otherUserId)
                      : undefined
                  }
                  otherProfile={activeMatchItem?.otherProfile ?? null}
                  onBack={closeMobileChat}
                />
              </div>
            ) : (
              <div className="hidden flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] lg:flex">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-muted-foreground">Select a match to start messaging</p>
                  <p className="mt-2 text-xs text-muted-foreground/60">Messages stay private between approved profiles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading conversations...
            </CardContent>
          </Card>
        </section>
      </main>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
