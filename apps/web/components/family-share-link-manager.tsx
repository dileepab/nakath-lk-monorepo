"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Copy, ExternalLink, Link2, LoaderCircle, RefreshCw, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type ProfileDraft } from "@acme/core"

type FamilyShareLinkSummary = {
  url: string
  shareMode: string
  createdAt: string | null
  expiresAt: string | null
  lastViewedAt: string | null
  viewCount: number
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available yet"

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value))
}

export function FamilyShareLinkManager({
  draft,
  appearance = "dark",
}: {
  draft: ProfileDraft
  appearance?: "dark" | "paper"
}) {
  const { user, loading } = useAuth()
  const [link, setLink] = useState<FamilyShareLinkSummary | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [action, setAction] = useState<"create" | "revoke" | "copy" | null>(null)

  const isPaper = appearance === "paper"
  const cardClasses = isPaper
    ? "border-[#dccca6] bg-[#f5ead3] shadow-[0_18px_50px_rgba(91,67,22,0.08)]"
    : "border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl"
  const titleClasses = isPaper ? "text-[#2b2111]" : "text-foreground"
  const mutedClasses = isPaper ? "text-[#6c5a39]" : "text-muted-foreground"
  const subtleButtonClasses = isPaper
    ? "h-11 rounded-full border-[#d6c7a1] bg-[#fffdfa] text-[#2b2111] hover:bg-[#f7f1e3] hover:text-[#2b2111]"
    : "h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
  const accentButtonClasses = isPaper
    ? "h-11 rounded-full border-[#d4b15a] bg-[#f0d791] text-[#7b5510] hover:bg-[#e8cb7c] hover:text-[#7b5510]"
    : "h-11 rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
  const badgeClasses = isPaper
    ? "rounded-full border-[#d6c7a1] bg-[#fff8eb] px-3 py-1 text-[#6d5315]"
    : "rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground"

  const statusLabel = useMemo(() => {
    if (!link) return "No active link"
    return `Active for ${link.shareMode.replace("-", " ")}`
  }, [link])

  useEffect(() => {
    if (loading) return

    if (!user) {
      setLink(null)
      setLoadingState(false)
      return
    }

    const currentUser = user
    let cancelled = false

    async function loadLink() {
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch("/api/share-links/current", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        const payload = (await response.json().catch(() => null)) as { link?: FamilyShareLinkSummary | null } | null
        if (!response.ok) {
          throw new Error(payload && "error" in payload ? String((payload as { error?: string }).error) : "Could not load family link.")
        }

        if (!cancelled) {
          setLink(payload?.link ?? null)
        }
      } catch {
        if (!cancelled) {
          setLink(null)
        }
      } finally {
        if (!cancelled) {
          setLoadingState(false)
        }
      }
    }

    void loadLink()

    return () => {
      cancelled = true
    }
  }, [loading, user])

  async function createOrRefreshLink() {
    if (!user) return

    setAction("create")
    try {
      const idToken = await user.getIdToken()
      const response = await fetch("/api/share-links/current", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draft }),
      })

      const payload = (await response.json().catch(() => null)) as { link?: FamilyShareLinkSummary; error?: string } | null
      if (!response.ok || !payload?.link) {
        throw new Error(payload?.error ?? "Could not create a secure family link.")
      }

      setLink(payload.link)
      toast("Secure family link ready", {
        description: "You can now copy it into WhatsApp or send it directly to family.",
      })
    } catch (error) {
      toast("Could not prepare the family link", {
        description: error instanceof Error ? error.message : "Please try again once your biodata is saved.",
      })
    } finally {
      setAction(null)
    }
  }

  async function revokeLink() {
    if (!user) return

    setAction("revoke")
    try {
      const idToken = await user.getIdToken()
      const response = await fetch("/api/share-links/current", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not disable the active family link.")
      }

      setLink(null)
      toast("Family link disabled", {
        description: "The old link will no longer open outside the app.",
      })
    } catch (error) {
      toast("Could not disable the family link", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setAction(null)
    }
  }

  async function copyLink() {
    if (!link) return

    setAction("copy")
    try {
      await navigator.clipboard.writeText(link.url)
      toast("Secure family link copied", {
        description: "You can now paste it directly into WhatsApp or another message.",
      })
    } catch {
      toast("Could not copy the family link", {
        description: "Please try again from a browser tab with clipboard access.",
      })
    } finally {
      setAction(null)
    }
  }

  if (loadingState) {
    return (
      <Card className={cardClasses}>
        <CardContent className="flex items-center gap-3 px-6 py-6">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          <p className={cn("text-sm", mutedClasses)}>Checking whether a secure family link is already active...</p>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Card className={cardClasses}>
      <CardContent className="space-y-5 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={cn("text-sm font-semibold", titleClasses)}>Secure family share link</p>
            <p className={cn("mt-2 text-sm leading-6", mutedClasses)}>
              This creates a family-safe public page from a snapshot of the current biodata. Contact details and protected media stay out of it.
            </p>
          </div>
          <Badge variant="outline" className={badgeClasses}>
            <ShieldCheck className="mr-2 h-3.5 w-3.5" />
            {statusLabel}
          </Badge>
        </div>

        {link ? (
          <div className={cn("rounded-3xl border px-5 py-5", isPaper ? "border-[#dccca6] bg-[#fff9ed]" : "border-white/10 bg-black/20")}>
            <div className="flex flex-wrap items-center gap-2">
              <Link2 className={cn("h-4 w-4", isPaper ? "text-[#8d6b16]" : "text-primary")} />
              <p className={cn("text-sm font-medium break-all", titleClasses)}>{link.url}</p>
            </div>
            <div className={cn("mt-4 grid gap-3 text-sm sm:grid-cols-3", mutedClasses)}>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em]">Created</p>
                <p className="mt-2 leading-6">{formatDateTime(link.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em]">Expires</p>
                <p className="mt-2 leading-6">{formatDateTime(link.expiresAt)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em]">Views</p>
                <p className="mt-2 leading-6">
                  {link.viewCount} opened
                  {link.lastViewedAt ? ` • last viewed ${formatDateTime(link.lastViewedAt)}` : ""}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={cn("rounded-3xl border px-5 py-5", isPaper ? "border-[#dccca6] bg-[#fff9ed]" : "border-white/10 bg-black/20")}>
            <p className={cn("text-sm leading-6", mutedClasses)}>
              No secure family link is active right now. Generate one when you want a shareable link that stays outside normal sign-in access.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            onClick={() => void createOrRefreshLink()}
            disabled={action === "create"}
            className={accentButtonClasses}
          >
            {action === "create" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {link ? "Regenerate family link" : "Generate family link"}
          </Button>

          {link ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyLink()}
                disabled={action === "copy"}
                className={subtleButtonClasses}
              >
                {action === "copy" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Copy secure link
              </Button>
              <Button
                asChild
                type="button"
                variant="outline"
                className={subtleButtonClasses}
              >
                <a href={link.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open shared page
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void revokeLink()}
                disabled={action === "revoke"}
                className={subtleButtonClasses}
              >
                {action === "revoke" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Disable link
              </Button>
            </>
          ) : null}
        </div>

        <div className={cn("flex items-start gap-2 text-sm leading-6", mutedClasses)}>
          <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", isPaper ? "text-[#8d6b16]" : "text-primary")} />
          <p>Each link captures a snapshot of the current biodata. Regenerate it after major edits so family sees the latest version.</p>
        </div>
      </CardContent>
    </Card>
  )
}
