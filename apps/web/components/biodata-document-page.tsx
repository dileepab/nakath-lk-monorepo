"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, Clock3, Database, Link2Off, PencilLine, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { BiodataDocument } from "@/components/biodata-document"
import { FamilyShareLinkManager } from "@/components/family-share-link-manager"
import { BiodataSharePanel } from "@/components/biodata-share-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PROFILE_DRAFT_STORAGE_KEY, initialProfileDraft, mergeProfileDraft, type ProfileDraft } from "@acme/core"
import { isFirebaseConfigured, loadProfileDraftFromBackend } from "@/lib/profile-store"
import { cn } from "@/lib/utils"

type PublicShareState =
  | {
      status: "ready"
      draft: ProfileDraft
      shareMode: string
      expiresAt: string | null
      viewCount: number
      lastViewedAt: string | null
    }
  | {
      status: "not-found" | "expired" | "revoked"
    }

function formatDateTime(value: string | null) {
  if (!value) return "Not available yet"

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value))
}

function UnavailableShareState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="min-h-screen bg-[#ece5d7] px-6 py-8 text-[#20170c] md:px-10">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <Card className="w-full border-[#dccca6] bg-[#f8f2e6] shadow-[0_28px_90px_rgba(0,0,0,0.12)]">
          <CardContent className="space-y-5 px-8 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#d8c28f] bg-[#fff6e2]">
              <Link2Off className="h-6 w-6 text-[#8d6b16]" />
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-semibold text-[#271f12]">{title}</p>
              <p className="text-sm leading-7 text-[#5f4b2a]">{description}</p>
            </div>
            <div className="flex justify-center">
              <Button asChild className="rounded-full bg-[#7b5510] text-[#fff7e5] hover:bg-[#62420c]">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Nakath.lk
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export function BiodataDocumentPage({
  initialProfileId,
  publicShare,
}: {
  initialProfileId?: string | null
  publicShare?: PublicShareState | null
}) {
  const { user, loading: authLoading } = useAuth()
  const [draft, setDraft] = useState<ProfileDraft>(initialProfileDraft)
  const [sourceLabel, setSourceLabel] = useState("Local draft")
  const explicitProfileId = initialProfileId ?? null
  const profileId = explicitProfileId || user?.uid || null
  const isPublicShare = publicShare?.status === "ready"

  useEffect(() => {
    let cancelled = false

    if (publicShare?.status === "ready") {
      setDraft(publicShare.draft)
      setSourceLabel("Secure family share")
      return
    }

    try {
      const storedDraft = window.localStorage.getItem(PROFILE_DRAFT_STORAGE_KEY)
      if (storedDraft) {
        setDraft(mergeProfileDraft(JSON.parse(storedDraft) as Partial<ProfileDraft>))
      }
    } catch {
      // Keep the starter biodata when local data is missing or malformed.
    }

    if (authLoading) {
      setSourceLabel("Checking signed-in user")
      return
    }

    if (!profileId || !isFirebaseConfigured()) {
      setSourceLabel(profileId ? "Profile id provided, but Firebase is not configured" : "Local draft")
      return
    }

    void loadProfileDraftFromBackend(profileId)
      .then((remoteDraft) => {
        if (cancelled) return
        if (!remoteDraft) {
          setSourceLabel("Remote profile not found. Showing local draft")
          return
        }

        setDraft(remoteDraft)
        setSourceLabel(`Firestore profile ${profileId}`)
      })
      .catch(() => {
        if (cancelled) return
        setSourceLabel("Could not load Firestore profile. Showing local draft")
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, profileId, publicShare])

  if (publicShare && publicShare.status !== "ready") {
    switch (publicShare.status) {
      case "not-found":
        return (
          <UnavailableShareState
            title="This family share link was not found"
            description="The link may have been copied incorrectly, replaced with a newer one, or removed after the biodata changed."
          />
        )
      case "revoked":
        return (
          <UnavailableShareState
            title="This family share link has been turned off"
            description="The owner disabled this link after sharing. Ask them for a fresh link if you still need the biodata."
          />
        )
      case "expired":
        return (
          <UnavailableShareState
            title="This family share link has expired"
            description="Secure family links are temporary. Ask the owner for a new one if they still want to share the biodata."
          />
        )
    }
  }

  return (
    <main className="print-shell min-h-screen bg-[#ece5d7] px-6 py-8 text-[#20170c] md:px-10">
      {isPublicShare ? (
        <div className="mx-auto mb-6 max-w-[880px] print-hidden">
          <Card className="border-[#dccca6] bg-[#f8f2e6] shadow-[0_18px_50px_rgba(91,67,22,0.08)]">
            <CardContent className="space-y-4 px-6 py-6">
              <div className="flex flex-wrap items-center gap-2 text-[#8d6b16]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.26em]">Secure family share</p>
              </div>
              <p className="text-lg font-semibold text-[#271f12]">
                This biodata was shared through a protected Nakath.lk family link.
              </p>
              <div className="grid gap-3 text-sm leading-6 text-[#5f4b2a] md:grid-cols-2">
                <p>
                  Contact details and protected media are intentionally excluded here. Families can review the biodata
                  without exposing direct reach-out details too early.
                </p>
                <p className="flex items-start gap-2">
                  <Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#8d6b16]" />
                  Expires {formatDateTime(publicShare.expiresAt)}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="print-hidden mx-auto mb-6 flex max-w-[880px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild className="rounded-full border-[#d6c7a1] bg-white text-[#20170c] hover:bg-[#f7f1e3]">
              <Link href="/biodata">
                <ArrowLeft className="h-4 w-4" />
                Back to builder
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full border-[#d6c7a1] bg-white text-[#20170c] hover:bg-[#f7f1e3]">
              <Link href="/biodata">
                <PencilLine className="h-4 w-4" />
                Edit biodata
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border-[#d6c7a1] bg-white px-3 py-1 text-[#20170c]",
                sourceLabel.startsWith("Firestore") ? "bg-[#f6eed9]" : "bg-white",
              )}
            >
              <Database className="h-3.5 w-3.5" />
              {sourceLabel}
            </Badge>
          </div>
        </div>
      )}

      {!isPublicShare ? (
        <div className="mx-auto mb-6 max-w-[880px] print-hidden">
          <BiodataSharePanel
            draft={draft}
            title="Family sharing options"
            description="Use the print-friendly biodata, a WhatsApp-ready note, or a copied family review summary without revealing contact details too early."
            documentHref="/biodata/document"
            canPrint
            onPrint={() => window.print()}
            appearance="paper"
          />
        </div>
      ) : null}

      {!isPublicShare && user && (!explicitProfileId || explicitProfileId === user.uid) ? (
        <div className="mx-auto mb-6 max-w-[880px] print-hidden">
          <FamilyShareLinkManager draft={draft} appearance="paper" />
        </div>
      ) : null}

      <BiodataDocument draft={draft} />
    </main>
  )
}
