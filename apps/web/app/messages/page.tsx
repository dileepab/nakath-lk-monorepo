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
import { getReceivedMatches, getSentMatches } from "@/lib/match-api"
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

    async function loadMatches() {
      try {
        const [received, sent] = await Promise.all([getReceivedMatches(currentUser.uid), getSentMatches(currentUser.uid)])
        const approvedMatches = [...received, ...sent].filter((match) => match.status === "approved")
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
        const initialMatch = nextMatches.find((item) => item.match.id === requestedMatchId) ?? nextMatches[0] ?? null
        setActiveMatchId(initialMatch?.match.id ?? null)
      } finally {
        if (!cancelled) {
          setLoadingMatches(false)
        }
      }
    }

    void loadMatches()

    return () => {
      cancelled = true
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
            <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Private messages</Badge>
          </div>

          <div className="mt-8 flex min-h-0 flex-1 flex-col gap-6 pb-8 lg:flex-row">
            <Card className="flex h-[320px] shrink-0 flex-col overflow-hidden border-white/10 bg-[#121214]/90 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:h-full lg:w-1/3">
              <div className="border-b border-white/10 p-5">
                <h3 className="text-lg font-semibold text-foreground">Approved matches</h3>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {matches.length === 0 ? (
                  <p className="p-3 text-center text-sm text-muted-foreground">No approved matches yet.</p>
                ) : (
                  matches.map((item) => {
                    if (!currentUserId) return null
                    const selected = activeMatchId === item.match.id
                    const myReadAt = item.match.readStates?.[currentUserId]?.lastReadAt ?? 0
                    const hasUnread =
                      item.match.lastMessageSenderId === item.otherUserId &&
                      (item.match.lastMessageAt ?? 0) > myReadAt
                    return (
                      <button
                        key={item.match.id}
                        onClick={() => setActiveMatchId(item.match.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          selected
                            ? "border-primary/30 bg-primary/20"
                            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                        }`}
                      >
                        <p className="font-semibold text-sm text-foreground">
                          {displayNameFromDraft(item.otherProfile, item.otherUserId)}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">{profileMetaFromDraft(item.otherProfile)}</p>
                          {hasUnread ? (
                            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-primary">
                              New
                            </span>
                          ) : null}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </Card>

            {activeMatch && user ? (
              <ChatWindow
                activeMatch={activeMatch}
                currentUserId={user.uid}
                otherDisplayName={
                  activeMatchItem
                    ? displayNameFromDraft(activeMatchItem.otherProfile, activeMatchItem.otherUserId)
                    : undefined
                }
                otherProfile={activeMatchItem?.otherProfile ?? null}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Select a match to start messaging</p>
                <p className="mt-2 text-xs text-muted-foreground/60">Messages stay private between approved profiles</p>
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
