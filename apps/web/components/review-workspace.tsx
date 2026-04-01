"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Database,
  FileSearch,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { MediaPreviewDialog } from "@/components/media-preview-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { browseProfileFixtures, getBrowseProfileFixture } from "@acme/core"
import { horoscopeRuleConfig } from "@acme/core"
import { calculatePorondamPreview } from "@acme/core"
import { getVerificationStatus, hasUploadedAsset, type ProfileDraft, type VerificationState } from "@acme/core"
import { useResolvedMediaUrl } from "@/lib/use-resolved-media-url"
import { cn } from "@/lib/utils"

type ReviewerRole = "user" | "reviewer" | "admin"

type ReviewQueueItem = {
  userId: string
  displayName: string
  verificationStatus: string
  updatedAt?: string | null
  draft: ProfileDraft
}

type ReviewerSession = {
  configured: boolean
  role: ReviewerRole
  access: boolean
  email?: string | null
  reason?: string
}

type ApiError = {
  error?: string
  reason?: string
}

type WorkspaceStatus = "checking" | "signed-out" | "setup-required" | "access-denied" | "ready" | "error"

function statusTone(status: VerificationState) {
  if (status === "verified") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
  if (status === "submitted") return "border-amber-400/25 bg-amber-500/12 text-amber-100"
  return "border-white/10 bg-white/[0.04] text-muted-foreground"
}

function statusLabel(status: VerificationState) {
  if (status === "verified") return "Verified"
  if (status === "submitted") return "Submitted"
  return "Not submitted"
}

function ReviewDecision({
  label,
  value,
  onChange,
  disabled,
  allowVerified,
}: {
  label: string
  value: VerificationState
  onChange: (value: VerificationState) => void
  disabled?: boolean
  allowVerified: boolean
}) {
  const options: VerificationState[] = allowVerified
    ? ["not-submitted", "submitted", "verified"]
    : ["not-submitted", "submitted"]

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50",
              option === value
                ? statusTone(option)
                : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/20 hover:text-foreground",
            )}
          >
            {statusLabel(option)}
          </button>
        ))}
      </div>
    </div>
  )
}

async function fetchReviewerSession(idToken: string) {
  const response = await fetch("/api/review/session", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null
    throw new Error(payload?.error ?? payload?.reason ?? "Could not verify reviewer session.")
  }

  return (await response.json()) as ReviewerSession
}

async function fetchReviewQueue(idToken: string) {
  const response = await fetch("/api/review/profiles", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null
    throw new Error(payload?.error ?? payload?.reason ?? "Could not load review queue.")
  }

  const payload = (await response.json()) as {
    role: ReviewerRole
    profiles: ReviewQueueItem[]
  }

  return payload
}

async function updateReviewProfile(
  idToken: string,
  userId: string,
  decision: { nicStatus?: VerificationState; selfieStatus?: VerificationState },
) {
  const response = await fetch(`/api/review/profiles/${userId}/verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(decision),
  })

  if (!response.ok) {
    throw new Error("Could not save review decision.")
  }

  const payload = (await response.json()) as {
    profile: ReviewQueueItem
  }

  return payload.profile
}

function EmptyWorkspaceState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  statusBlock,
}: {
  title: string
  description: string
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string
  secondaryLabel?: string
  statusBlock?: ReactNode
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
      <AstrologyBackground />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-2xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <CardContent className="px-6 py-8">
            <p className="text-lg font-semibold text-foreground">{title}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            {statusBlock ? <div className="mt-5">{statusBlock}</div> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              {secondaryHref && secondaryLabel ? (
                <Button
                  variant="outline"
                  asChild
                  className="h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export function ReviewWorkspace() {
  const { user, loading: authLoading } = useAuth()
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>("checking")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [selectedFixtureId, setSelectedFixtureId] = useState(browseProfileFixtures[0]?.id ?? "fixture-dilani")
  const [reviewerSession, setReviewerSession] = useState<ReviewerSession | null>(null)
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setReviewerSession(null)
      setReviewQueue([])
      setSelectedProfileId(null)
      setDraft(null)
      setWorkspaceError(null)
      setWorkspaceStatus("signed-out")
      return
    }

    let cancelled = false

    async function bootstrapWorkspace() {
      setWorkspaceStatus("checking")
      setWorkspaceError(null)

      try {
        if (!user) return
        const idToken = await user.getIdToken()
        const session = await fetchReviewerSession(idToken)
        if (cancelled) return

        setReviewerSession(session)

        if (!session.configured) {
          setReviewQueue([])
          setSelectedProfileId(null)
          setDraft(null)
          setWorkspaceStatus("setup-required")
          return
        }

        if (!session.access) {
          setReviewQueue([])
          setSelectedProfileId(null)
          setDraft(null)
          setWorkspaceStatus("access-denied")
          return
        }

        const reviewData = await fetchReviewQueue(idToken)
        if (cancelled) return

        setReviewQueue(reviewData.profiles)
        setSelectedProfileId(reviewData.profiles[0]?.userId ?? null)
        setDraft(reviewData.profiles[0]?.draft ?? null)
        setWorkspaceStatus("ready")
      } catch (error) {
        if (cancelled) return
        setReviewerSession(null)
        setReviewQueue([])
        setSelectedProfileId(null)
        setDraft(null)
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "The protected reviewer session did not finish cleanly. Check whether the allowlisted email is deployed and whether /api/review/session or /api/review/profiles is returning an error.",
        )
        setWorkspaceStatus("error")
      }
    }

    void bootstrapWorkspace()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  useEffect(() => {
    if (workspaceStatus !== "ready" || !selectedProfileId) return

    const selected = reviewQueue.find((item) => item.userId === selectedProfileId)
    setDraft(selected?.draft ?? null)
  }, [reviewQueue, selectedProfileId, workspaceStatus])

  const selectedFixture = useMemo(() => getBrowseProfileFixture(selectedFixtureId), [selectedFixtureId])
  const scorePreview = useMemo(() => {
    if (!draft || !selectedFixture) return null
    return calculatePorondamPreview(draft, selectedFixture.draft)
  }, [draft, selectedFixture])
  const nicStatus = draft ? getVerificationStatus(draft, "nic") : "not-submitted"
  const selfieStatus = draft ? getVerificationStatus(draft, "selfie") : "not-submitted"
  const hasNic = Boolean(
    draft &&
      hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl) &&
      hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl),
  )
  const hasSelfie = Boolean(draft && hasUploadedAsset(draft.media.selfiePath, draft.media.selfieUrl))
  const resolvedProfilePhotoUrl = useResolvedMediaUrl(draft?.media.profilePhotoPath, draft?.media.profilePhotoUrl)
  const resolvedNicFrontUrl = useResolvedMediaUrl(draft?.media.nicFrontPath, draft?.media.nicFrontUrl)
  const resolvedNicBackUrl = useResolvedMediaUrl(draft?.media.nicBackPath, draft?.media.nicBackUrl)
  const resolvedSelfieUrl = useResolvedMediaUrl(draft?.media.selfiePath, draft?.media.selfieUrl)

  async function updateVerification(field: "nicStatus" | "selfieStatus", value: VerificationState) {
    if (!draft || !selectedProfileId || !user) return

    try {
      setSaveState("saving")
      const idToken = await user.getIdToken()
      const updatedProfile = await updateReviewProfile(idToken, selectedProfileId, {
        nicStatus: field === "nicStatus" ? value : draft.verification.nicStatus,
        selfieStatus: field === "selfieStatus" ? value : draft.verification.selfieStatus,
      })

      setReviewQueue((current) =>
        current.map((item) => (item.userId === updatedProfile.userId ? updatedProfile : item)),
      )
      setDraft(updatedProfile.draft)
      setSaveState("saved")
    } catch {
      setSaveState("error")
    }
  }

  if (authLoading || workspaceStatus === "checking") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading reviewer workspace...
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  if (workspaceStatus === "signed-out") {
    return (
      <EmptyWorkspaceState
        title="Reviewer sign-in required"
        description="This workspace is now reserved for reviewer and admin accounts. Sign in with an allowed account to open the protected review queue."
        primaryHref="/auth?redirectTo=%2Freview"
        primaryLabel="Sign in"
        secondaryHref="/profiles"
        secondaryLabel="Back to profiles"
      />
    )
  }

  if (workspaceStatus === "setup-required") {
    return (
      <EmptyWorkspaceState
        title="Reviewer backend not configured"
        description="The browser route is ready, but the protected reviewer backend still needs Firebase Admin credentials and an allowlist before this page can review other users."
        primaryHref="/profiles"
        primaryLabel="Back to profiles"
        secondaryHref="/biodata"
        secondaryLabel="Open biodata builder"
        statusBlock={
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Required env</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              Add <code>FIREBASE_ADMIN_PROJECT_ID</code>, <code>FIREBASE_ADMIN_CLIENT_EMAIL</code>,{" "}
              <code>FIREBASE_ADMIN_PRIVATE_KEY</code>, and at least one email in <code>ADMIN_EMAILS</code> or{" "}
              <code>REVIEWER_EMAILS</code>.
            </p>
            {reviewerSession?.reason ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{reviewerSession.reason}</p>
            ) : null}
          </div>
        }
      />
    )
  }

  if (workspaceStatus === "access-denied") {
    return (
      <EmptyWorkspaceState
        title="Reviewer access required"
        description="This account is signed in correctly, but it is not on the reviewer/admin allowlist yet. Once we add the email to the configured role list, this page will open the shared review queue."
        primaryHref="/profiles"
        primaryLabel="Back to profiles"
        secondaryHref="/auth"
        secondaryLabel="Switch account"
        statusBlock={
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Session</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              Email: {reviewerSession?.email ?? "Unknown"} • Resolved role: {reviewerSession?.role ?? "user"}
            </p>
          </div>
        }
      />
    )
  }

  if (workspaceStatus === "error") {
    return (
      <EmptyWorkspaceState
        title="Reviewer workspace could not load"
        description={workspaceError ?? "The protected reviewer session did not finish cleanly. A refresh usually clears it; if not, we should check the Admin SDK env values and the review API responses next."}
        primaryHref="/review"
        primaryLabel="Reload review"
        secondaryHref="/profiles"
        secondaryLabel="Back to profiles"
      />
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
                Back to profiles
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Reviewer workspace</Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                {reviewerSession?.role ?? "reviewer"} mode
              </Badge>
              <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                Protected queue
              </Badge>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Internal workflow</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Review verification uploads, approve trust states, and inspect match scoring from one place.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                This workspace is using server-verified reviewer access and only saves decisions through the protected
                review API.
              </p>
            </div>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <CardContent className="grid gap-4 px-6 py-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">NIC</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{statusLabel(nicStatus)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Selfie</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{statusLabel(selfieStatus)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Save status</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{saveState}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl text-foreground">Verification review</CardTitle>
                  <CardDescription className="leading-6 text-muted-foreground">
                    Uploaded files create the submission state. This reviewer panel is where we can promote them to verified.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {draft ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[
                          {
                            title: "Profile photo",
                            url: resolvedProfilePhotoUrl,
                            status: hasUploadedAsset(draft.media.profilePhotoPath, draft.media.profilePhotoUrl)
                              ? "Uploaded"
                              : "Missing",
                            path: draft.media.profilePhotoPath,
                            kind: "image" as const,
                          },
                          {
                            title: "NIC front",
                            url: resolvedNicFrontUrl,
                            status: hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl)
                              ? "Uploaded"
                              : "Missing",
                            path: draft.media.nicFrontPath,
                            kind: "image" as const,
                          },
                          {
                            title: "NIC back",
                            url: resolvedNicBackUrl,
                            status: hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl)
                              ? "Uploaded"
                              : "Missing",
                            path: draft.media.nicBackPath,
                            kind: "image" as const,
                          },
                          {
                            title: "Verification selfie",
                            url: resolvedSelfieUrl,
                            status: hasSelfie ? "Uploaded" : "Missing",
                            path: draft.media.selfiePath,
                            kind: "image" as const,
                          },
                        ].map((asset) => (
                          <div key={asset.title} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                            <p className="text-sm font-semibold text-foreground">{asset.title}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">{asset.status}</p>
                            {asset.path || asset.url ? (
                              <MediaPreviewDialog
                                title={asset.title}
                                path={asset.path}
                                fallbackUrl={asset.url}
                                kind={asset.kind}
                              />
                            ) : (
                              <p className="mt-4 text-sm leading-6 text-muted-foreground">No upload available yet.</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <ReviewDecision
                          label="NIC decision"
                          value={nicStatus}
                          onChange={(value) => void updateVerification("nicStatus", value)}
                          allowVerified={hasNic}
                          disabled={!selectedProfileId}
                        />
                        <ReviewDecision
                          label="Selfie decision"
                          value={selfieStatus}
                          onChange={(value) => void updateVerification("selfieStatus", value)}
                          allowVerified={hasSelfie}
                          disabled={!selectedProfileId}
                        />
                      </div>

                      <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
                        <div className="flex items-center gap-2">
                          <LockKeyhole className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-foreground">Reviewer note</p>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-foreground/90">
                          This session is using server-verified reviewer access. Decisions are saved through protected
                          review APIs rather than direct client writes.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                      <p className="text-sm font-semibold text-foreground">No profile selected</p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        The queue is empty right now, so there is nothing to review yet. As soon as users save biodata
                        and upload verification files, they can appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl text-foreground">Scoring oversight</CardTitle>
                  <CardDescription className="leading-6 text-muted-foreground">
                    Review how the active profile scores against a fixture profile and inspect the factor breakdown.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {browseProfileFixtures.map((fixture) => (
                      <button
                        key={fixture.id}
                        type="button"
                        onClick={() => setSelectedFixtureId(fixture.id)}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition-all",
                          selectedFixtureId === fixture.id
                            ? "border-primary/40 bg-primary/12"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
                        )}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {fixture.draft.basics.firstName} {fixture.draft.basics.lastName}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{fixture.draft.basics.district}</p>
                      </button>
                    ))}
                  </div>

                  {scorePreview && selectedFixture ? (
                    <>
                      <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{scorePreview.label}</p>
                            <p className="mt-3 text-sm leading-7 text-foreground/90">{scorePreview.summary}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Score</p>
                            <p className="mt-2 text-2xl font-semibold text-primary">{scorePreview.total}/20</p>
                          </div>
                        </div>
                        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Candidate: {selectedFixture.draft.basics.firstName} {selectedFixture.draft.basics.lastName}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {scorePreview.factors.map((factor) => (
                          <div key={factor.key} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground">{factor.label}</p>
                              <span className="text-xs uppercase tracking-[0.2em] text-primary">
                                {factor.score}/{factor.max}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{factor.note}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                      <p className="text-sm font-semibold text-foreground">Queue profile needed</p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Select a profile from the queue to inspect its Porondam preview against the fixture set.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl text-foreground">Review queue</CardTitle>
                  <CardDescription className="leading-6 text-muted-foreground">
                    Profiles loaded through the protected review API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reviewQueue.length ? (
                    reviewQueue.map((item) => (
                      <button
                        key={item.userId}
                        type="button"
                        onClick={() => setSelectedProfileId(item.userId)}
                        className={cn(
                          "w-full rounded-2xl border px-4 py-4 text-left transition-all",
                          selectedProfileId === item.userId
                            ? "border-primary/40 bg-primary/12"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
                        )}
                      >
                        <p className="text-sm font-medium text-foreground">{item.displayName}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.verificationStatus}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">No profiles are currently in the review queue.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl text-foreground">Horoscope rule config</CardTitle>
                  <CardDescription className="leading-6 text-muted-foreground">
                    This shows what the dedicated rule engine is using right now.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Completeness thresholds</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      High: {horoscopeRuleConfig.completeness.highThreshold} fields, Medium:{" "}
                      {horoscopeRuleConfig.completeness.mediumThreshold} fields
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Nakath distance rules</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      Configured distances: {Object.keys(horoscopeRuleConfig.nakath.distanceScores).join(", ")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Lagna compatibility</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      Compatible element pairs: {horoscopeRuleConfig.lagna.compatiblePairs.join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <CardContent className="px-6 py-6">
                  <div className="flex items-center gap-2">
                    <FileSearch className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Role model status</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Admin configured: {reviewerSession?.configured ? "yes" : "no"} • Resolved role:{" "}
                    {reviewerSession?.role ?? "user"} • Session: {reviewerSession?.email ?? "Unknown"}.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
