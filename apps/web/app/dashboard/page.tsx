"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowUpRight, LoaderCircle, Settings, FileText } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { AuspiciousClock } from "@/components/auspicious-clock"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { loadProfileDraftFromBackend } from "@/lib/profile-store"
import { getReceivedMatches, updateMatchStatus } from "@/lib/match-api"
import { type MatchRequest, type ProfileDraft } from "@acme/core"
import { motion } from "framer-motion"

function IncomingMatchesCard({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<MatchRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getReceivedMatches(userId).then(matches => {
      if (!cancelled) {
        setRequests(matches.filter(m => m.status === "pending"))
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [userId])

  const handleAction = async (matchId: string, status: "approved" | "rejected") => {
    await updateMatchStatus(matchId, status)
    setRequests(prev => prev.filter(m => m.id !== matchId))
  }

  if (loading) {
    return (
      <Card className="border-white/10 bg-[#121214]/90 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
          Checking for intro requests...
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-primary/20 bg-primary/10 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Pending Introductions</h3>
        <p className="text-sm text-foreground/85 text-balance">
          {requests.length} member{requests.length === 1 ? "" : "s"} requested to view your full profile and initiate contact.
        </p>
        <div className="grid gap-3">
          {requests.map(req => (
            <div key={req.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold">User ({req.senderId.slice(-4)}) wants to connect</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => handleAction(req.id, "approved")} className="h-9 rounded-full bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30">Approve</Button>
                <Button onClick={() => handleAction(req.id, "rejected")} variant="outline" className="h-9 rounded-full border-white/10 bg-transparent text-foreground hover:bg-white/5">Decline</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth?redirectTo=%2Fdashboard")
      return
    }

    let cancelled = false

    loadProfileDraftFromBackend(user.uid)
      .then((remoteDraft) => {
        if (cancelled) return
        setDraft(remoteDraft)
        setLoadingProfile(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadingProfile(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router])

  if (authLoading || loadingProfile) {
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
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Daily tools</Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                Auspicious Dashboard
              </Badge>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Your Control Center</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {draft ? `Welcome back, ${draft.basics.firstName}.` : "Welcome back."}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Keep track of your match interactions, profile completion, and the best times to start conversations.
              </p>
              
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/biodata">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage biodata draft
                  </Link>
                </Button>
                {draft && draft.basics.firstName ? (
                  <Button variant="outline" asChild className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-foreground hover:bg-white/[0.08]">
                    <Link href={`/biodata/document?profileId=${user?.uid}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View exportable PDF
                    </Link>
                  </Button>
                ) : null}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild variant="outline" className="h-12 rounded-full border-primary/50 text-primary bg-primary/10 px-6 text-base hover:bg-primary/20">
                    <Link href="/messages">
                      Open Private Messages
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>

            <div className="grid gap-6">
                <IncomingMatchesCard userId={user?.uid ?? ""} />
               <AuspiciousClock />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
