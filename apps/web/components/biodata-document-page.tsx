"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Database, PencilLine } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { BiodataDocument } from "@/components/biodata-document"
import { FamilyShareLinkManager } from "@/components/family-share-link-manager"
import { BiodataSharePanel } from "@/components/biodata-share-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PROFILE_DRAFT_STORAGE_KEY, initialProfileDraft, mergeProfileDraft, type ProfileDraft } from "@acme/core"
import { isFirebaseConfigured, loadProfileDraftFromBackend } from "@/lib/profile-store"
import { cn } from "@/lib/utils"

export function BiodataDocumentPage() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [draft, setDraft] = useState<ProfileDraft>(initialProfileDraft)
  const [sourceLabel, setSourceLabel] = useState("Local draft")
  const explicitProfileId = searchParams.get("profileId")
  const profileId = explicitProfileId || user?.uid || null

  useEffect(() => {
    let cancelled = false

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
  }, [authLoading, profileId])

  return (
    <main className="print-shell min-h-screen bg-[#ece5d7] px-6 py-8 text-[#20170c] md:px-10">
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

      {user && (!explicitProfileId || explicitProfileId === user.uid) ? (
        <div className="mx-auto mb-6 max-w-[880px] print-hidden">
          <FamilyShareLinkManager draft={draft} appearance="paper" />
        </div>
      ) : null}

      <BiodataDocument draft={draft} />
    </main>
  )
}
