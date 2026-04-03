"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, BellRing, LoaderCircle, Settings as SettingsIcon, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { NotificationDiagnostics } from "@/components/notification-diagnostics"
import { NotificationPrompt } from "@/components/notification-prompt"
import { PrivacySettingsCard } from "@/components/privacy-settings-card"
import { ReminderHistory } from "@/components/reminder-history"
import { UpcomingAuspiciousTimes } from "@/components/upcoming-auspicious-times"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { loadOwnProfileDraftFromBackend } from "@/lib/profile-store"
import { type ProfileDraft } from "@acme/core"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [loadingState, setLoadingState] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setLoadingState(false)
      return
    }

    const currentUser = user
    let cancelled = false

    async function loadSettings() {
      try {
        const nextDraft = await loadOwnProfileDraftFromBackend(currentUser.uid)
        if (!cancelled) {
          setDraft(nextDraft)
        }
      } finally {
        if (!cancelled) {
          setLoadingState(false)
        }
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  if (authLoading || loadingState) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading your settings...
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="space-y-4 px-6 py-6">
              <p className="text-lg font-semibold text-foreground">Sign in to manage your settings</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Notification preferences, privacy controls, and device readiness are only available once you are signed in.
              </p>
              <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/auth?redirectTo=%2Fsettings">Go to sign in</Link>
              </Button>
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
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Settings</Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                Privacy and notifications
              </Badge>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Control center</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Tune how Nakath.lk should speak, reveal, and alert.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Keep the app useful without making it noisy. These preferences shape what becomes visible, which reminders arrive, and how much the app reaches out on your behalf.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                  <CardContent className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-primary" />
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Notification focus</p>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-foreground">Calendar and match alerts</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Decide whether you want Rahu, Poya, Avurudu, and match activity updates in the browser.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                  <CardContent className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Privacy focus</p>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-foreground">Photo, contact, and biodata rules</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Choose when photos unlock, how contact details reveal, and whether the biodata feels family-led or direct.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6">
              <NotificationPrompt userId={user.uid} />
              <NotificationDiagnostics />
            </div>
          </div>

          {draft ? (
            <div className="mt-10 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-6">
                <UpcomingAuspiciousTimes userId={user.uid} draft={draft} onDraftChange={setDraft} />
                <ReminderHistory />
              </div>
              <div className="space-y-6">
                <PrivacySettingsCard userId={user.uid} draft={draft} onDraftChange={setDraft} />
                <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                  <CardContent className="space-y-4 px-6 py-6">
                    <div className="flex items-center gap-2">
                      <SettingsIcon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">What these settings now control</p>
                    </div>
                    <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                      <p>Match activity notifications now cover new requests, approvals, and fresh messages.</p>
                      <p>Calendar notifications now use Sri Lanka timing and are scheduled before event starts rather than after them.</p>
                      <p>Browser push still depends on this device having permission and a healthy saved token.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="mt-10">
              <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <CardContent className="space-y-4 px-6 py-6">
                  <p className="text-lg font-semibold text-foreground">Complete your biodata to unlock full settings</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    We need a saved profile before we can remember notification preferences and privacy choices for your account.
                  </p>
                  <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/biodata">Go to biodata</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
