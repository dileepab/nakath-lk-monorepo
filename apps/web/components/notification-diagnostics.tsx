"use client"

import { useEffect, useState } from "react"
import { BellRing, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getStoredFcmToken } from "@/lib/notifications"

type DiagnosticsPayload = {
  tokenCount: number
}

export function NotificationDiagnostics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [hasStoredToken, setHasStoredToken] = useState(false)
  const [permissionLabel, setPermissionLabel] = useState("Checking")

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionLabel("Unavailable")
      return
    }

    setPermissionLabel(
      Notification.permission === "granted"
        ? "Granted"
        : Notification.permission === "denied"
          ? "Blocked"
          : "Not enabled",
    )
    setHasStoredToken(Boolean(getStoredFcmToken()))
  }, [])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const currentUser = user
    let cancelled = false

    async function loadDiagnostics() {
      try {
        setLoading(true)
        setError(null)
        const idToken = await currentUser.getIdToken()
        const response = await fetch("/api/notifications/diagnostics", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Could not load notification diagnostics.")
        }

        const payload = (await response.json()) as DiagnosticsPayload
        if (!cancelled) {
          setTokenCount(payload.tokenCount)
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Could not load notification diagnostics.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDiagnostics()

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Notification diagnostics</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Browser</p>
            <p className="mt-2 text-sm font-medium text-foreground">{permissionLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">This device</p>
            <p className="mt-2 text-sm font-medium text-foreground">{hasStoredToken ? "Token saved" : "No local token"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Account tokens</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {loading ? "Checking..." : `${tokenCount} saved`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            Checking current browser notification state...
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="font-medium">How to read this</span>
            </div>
            <p className="mt-2">
              `Browser` shows system permission, `This device` shows whether this tab has stored an FCM token locally, and
              `Account tokens` shows how many browser/device registrations exist for this signed-in account.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {!loading && hasStoredToken && permissionLabel === "Granted" ? (
          <Badge className="w-fit rounded-full border border-emerald-400/25 bg-emerald-500/12 px-3 py-1 font-medium text-emerald-100">
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" />
            This browser is ready for push
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )
}
