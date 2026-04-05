"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, useEffect, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  CloudUpload,
  CreditCard,
  Database,
  HeartHandshake,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  LogOut,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { FamilyShareLinkManager } from "@/components/family-share-link-manager"
import { BiodataSharePanel } from "@/components/biodata-share-panel"
import { ImageEditDialog } from "@/components/image-edit-dialog"
import { MediaPreviewDialog } from "@/components/media-preview-dialog"
import { ProfilePhotoCard } from "@/components/profile-photo-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  districtOptions,
  educationOptions,
  genderOptions,
  initialProfileDraft,
  lagnaOptions,
  languageOptions,
  nakathOptions,
  professionOptions,
  religionOptions,
  siblingOptions,
  familySetupOptions,
  spouseCareerOptions,
  PROFILE_DRAFT_STORAGE_KEY,
  ageFromBirthDate,
  birthDateFromAge,
  birthTimeAccuracyOptions,
  getVerificationStatus,
  getHoroscopeInputConfidence,
  getHoroscopeInputSummary,
  hasUploadedAsset,
  isFullyVerified,
  mergeProfileDraft,
  type BirthTimeAccuracy,
  type BiodataShareMode,
  type ContactVisibility,
  type PhotoVisibility,
  type ProfileDraft,
  syncVerificationState,
} from "@acme/core"
import {
  isFirebaseConfigured,
  loadOwnProfileDraftFromBackend,
  saveProfileDraftToBackend,
} from "@/lib/profile-store"
import { generateHoroscopeChartSnapshot } from "@/lib/astrology-api"
import { useBiodataStore } from "@/lib/use-biodata-store"
import { useResolvedMediaUrl } from "@/lib/use-resolved-media-url"
import {
  allowedProfileAssetTypesLabel,
  isAllowedProfileAssetFile,
  uploadProfileAsset,
  type ProfileAssetKind,
} from "@/lib/storage-store"
import { cn } from "@/lib/utils"

const photoVisibilityOptions: Array<{
  value: PhotoVisibility
  label: string
  description: string
}> = [
  {
    value: "blurred",
    label: "Blurred until mutual interest",
    description: "Best default for launch. Faces stay soft until both sides agree.",
  },
  {
    value: "mutual",
    label: "Unlock on mutual interest",
    description: "Full photos open only after both sides respond positively.",
  },
  {
    value: "family",
    label: "Family reviewed first",
    description: "Share the biodata before photos become visible.",
  },
]

const contactVisibilityOptions: Array<{
  value: ContactVisibility
  label: string
  description: string
}> = [
  {
    value: "hidden",
    label: "Hide contact details",
    description: "Phone number stays fully hidden in the first stage.",
  },
  {
    value: "mutual",
    label: "Release after mutual interest",
    description: "Preferred for direct intros with strong privacy control.",
  },
  {
    value: "family-request",
    label: "Share through family request",
    description: "Useful when families guide the first conversation.",
  },
]

const biodataShareOptions: Array<{
  value: BiodataShareMode
  label: string
  description: string
}> = [
  {
    value: "pdf",
    label: "Formal PDF",
    description: "A polished biodata designed for respectful sharing.",
  },
  {
    value: "whatsapp",
    label: "WhatsApp first",
    description: "Optimized for quick family forwarding and mobile reading.",
  },
  {
    value: "family-review",
    label: "Family review mode",
    description: "Hold the draft for review before external sharing.",
  },
]

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
        <div className="space-y-2">
          <CardTitle className="text-2xl text-foreground">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: {
  value: T
  options: Array<{ value: T; label: string; description: string }>
  onChange: (value: T) => void
  columns?: 2 | 3
}) {
  return (
    <div className={cn("grid gap-3", columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition-all",
              isActive
                ? "border-primary/40 bg-primary/12 shadow-[0_16px_40px_rgba(212,175,55,0.12)]"
                : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
            )}
          >
            <p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-foreground/90")}>
              {option.label}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{option.description}</p>
          </button>
        )
      })}
    </div>
  )
}

function SelectField({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full border-white/10 bg-black/20">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#151518]">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function statusLabel(status: "not-submitted" | "submitted" | "verified") {
  if (status === "verified") return "Verified"
  if (status === "submitted") return "Submitted"
  return "Not submitted"
}

function statusClasses(status: "not-submitted" | "submitted" | "verified") {
  if (status === "verified") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
  if (status === "submitted") return "border-amber-400/25 bg-amber-500/12 text-amber-100"
  return "border-white/10 bg-white/[0.04] text-muted-foreground"
}

function assetPreviewKind(_kind: ProfileAssetKind): "image" | "document" {
  return "image"
}

function profileCompletion(draft: ProfileDraft) {
  const checks = [
    draft.basics.firstName,
    draft.basics.gender,
    draft.basics.age,
    draft.basics.profession,
    draft.basics.district,
    draft.basics.religion,
    draft.horoscope.birthDate,
    draft.horoscope.nakath,
    draft.horoscope.lagna,
    draft.horoscope.birthTime,
    draft.horoscope.birthPlace,
    draft.family.education,
    draft.family.summary,
    draft.preferences.ageMin,
    draft.preferences.ageMax,
    draft.preferences.willingToMigrate ? "yes" : "no",
  ]

  const completed = checks.filter(Boolean).length
  return Math.round((completed / checks.length) * 100)
}

function previewValue(value: string, fallback: string) {
  return value.trim() ? value : fallback
}

const assetCards: Array<{
  kind: ProfileAssetKind
  title: string
  description: string
  accept: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    kind: "profile-photo",
    title: "Profile photo",
    description: "Used for the biodata document now, and later for blurred or unlocked profile views. One image only.",
    accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
    icon: ImageIcon,
  },
  {
    kind: "selfie",
    title: "Verification selfie",
    description: "Lets us match the account holder to the submitted identity document later. One image only.",
    accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
    icon: Camera,
  },
]

export function BiodataBuilder() {
  const router = useRouter()
  const { user, loading: authLoading, signOutUser } = useAuth()
  const { draft, setDraft } = useBiodataStore()
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "disabled" | "ready" | "saving" | "saved" | "error"
  >("checking")
  const [backendMessage, setBackendMessage] = useState("Checking Firebase configuration...")
  const [uploadingAsset, setUploadingAsset] = useState<ProfileAssetKind | null>(null)
  const [pendingEditorUpload, setPendingEditorUpload] = useState<{ kind: ProfileAssetKind; file: File } | null>(null)
  const [uploadMessage, setUploadMessage] = useState("Upload profile media after signing in to start the verification path.")
  const [chartStatus, setChartStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [chartMessage, setChartMessage] = useState("Normalize the birth place and prepare the future horoscope snapshot.")
  const previewDraft = useDeferredValue(draft)
  const horoscopeSnapshot = previewDraft.horoscopeComputed

  useEffect(() => {
    const backendEnabled = isFirebaseConfigured()

    setBackendAvailable(backendEnabled)

    try {
      const storedDraft = window.localStorage.getItem(PROFILE_DRAFT_STORAGE_KEY)
      if (storedDraft) {
        setDraft(syncVerificationState(mergeProfileDraft(JSON.parse(storedDraft) as Partial<ProfileDraft>)))
      }
    } catch {
      // Ignore malformed local drafts and keep the starter profile.
    }

    if (!backendEnabled) {
      setBackendStatus("disabled")
      setBackendMessage("Saving is unavailable right now. You can continue filling the form.")
      return
    }

    if (authLoading) {
      setBackendStatus("checking")
      setBackendMessage("Checking signed-in user...")
      return
    }

    if (!user) {
      setBackendStatus("ready")
      setBackendMessage("Sign in to save your profile.")
      return
    }

    let cancelled = false

    void loadOwnProfileDraftFromBackend(user.uid)
      .then((remoteDraft) => {
        if (cancelled) return

        if (remoteDraft) {
          setDraft(syncVerificationState(remoteDraft))
          setBackendMessage("Loaded your latest saved profile.")
        } else {
          setBackendMessage("No saved profile yet.")
        }

        setBackendStatus("ready")
      })
      .catch(() => {
        if (cancelled) return

        setBackendStatus("error")
        setBackendMessage("Could not load your saved profile.")
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  useEffect(() => {
    window.localStorage.setItem(PROFILE_DRAFT_STORAGE_KEY, JSON.stringify(syncVerificationState(draft)))
  }, [draft])

  async function saveToBackend() {
    if (!backendAvailable) return
    if (!user) {
      router.push(`/auth?redirectTo=${encodeURIComponent("/biodata")}`)
      return
    }

    try {
      const syncedDraft = syncVerificationState(draft)

      setBackendStatus("saving")
      setBackendMessage("Saving your profile...")

      setDraft(syncedDraft)
      await saveProfileDraftToBackend(user.uid, syncedDraft)
      setBackendStatus("saved")
      setBackendMessage("Profile saved.")
    } catch {
      setBackendStatus("error")
      setBackendMessage("Could not save your profile.")
    }
  }

  async function handleAssetUpload(kind: ProfileAssetKind, file: File) {
    if (!backendAvailable) {
      setUploadMessage("Uploads are unavailable right now.")
      return
    }

    if (!user) {
      router.push(`/auth?redirectTo=${encodeURIComponent("/biodata")}`)
      return
    }

    if (!isAllowedProfileAssetFile(file)) {
      setBackendStatus("error")
      setBackendMessage(`Only ${allowedProfileAssetTypesLabel()} images are allowed.`)
      setUploadMessage("This file type is not supported for profile uploads.")
      return
    }

    try {
      setUploadingAsset(kind)
      setUploadMessage(`Uploading ${kind.replace("-", " ")}...`)
      setBackendStatus("saving")
      setBackendMessage("Uploading file...")

      const { path, url } = await uploadProfileAsset(user.uid, kind, file)
      let nextDraft = draft

      setDraft((current) => {
        const media =
          kind === "profile-photo"
            ? {
                ...current.media,
                profilePhotoUrl: url,
                profilePhotoPath: path,
              }
            : kind === "nic-front"
              ? {
                  ...current.media,
                  nicFrontUrl: url,
                  nicFrontPath: path,
                }
              : kind === "nic-back"
                ? {
                    ...current.media,
                    nicBackUrl: url,
                    nicBackPath: path,
                  }
                : {
                    ...current.media,
                    selfieUrl: url,
                    selfiePath: path,
                }

        nextDraft = syncVerificationState({
          ...current,
          media,
        })

        return nextDraft
      })

      await saveProfileDraftToBackend(user.uid, nextDraft)
      
      if (
        hasUploadedAsset(nextDraft.media.nicFrontPath, nextDraft.media.nicFrontUrl) &&
        hasUploadedAsset(nextDraft.media.nicBackPath, nextDraft.media.nicBackUrl) &&
        hasUploadedAsset(nextDraft.media.selfiePath, nextDraft.media.selfieUrl)
      ) {
        setUploadMessage("Checking verification...")
        try {
          const idToken = await user.getIdToken()
          const res = await fetch("/api/verify-identity", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          })
          const verifyData = await res.json()
          if (verifyData.verified) {
             setUploadMessage(`Verification complete: ${verifyData.confidence.toFixed(1)}% match.`)
             const updated = await loadOwnProfileDraftFromBackend(user.uid)
             if (updated) setDraft(updated)
          } else {
             setUploadMessage("Verification submitted for review.")
          }
        } catch {
             setUploadMessage("Verification submitted for review.")
        }
      } else {
        setUploadMessage(`${file.name} uploaded.`)
      }

      setBackendStatus("saved")
      setBackendMessage("Upload complete.")
    } catch {
      setBackendStatus("error")
      setBackendMessage("Upload failed.")
      setUploadMessage(`Only ${allowedProfileAssetTypesLabel()} images are allowed.`)
    } finally {
      setUploadingAsset(null)
    }
  }

  async function refreshHoroscopeSnapshot() {
    if (!user) {
      router.push(`/auth?redirectTo=${encodeURIComponent("/biodata")}`)
      return
    }

    try {
      setChartStatus("loading")
      setChartMessage("Preparing horoscope snapshot...")
      const idToken = await user.getIdToken()
      const result = await generateHoroscopeChartSnapshot(idToken, draft)
      setDraft(result.draft)
      setChartStatus("ready")
      setChartMessage(
        result.persisted
          ? `Snapshot refreshed: ${result.horoscopeComputed?.nakath || "Nakath pending"} • ${result.horoscopeComputed?.lagna || "Lagna pending"}`
          : `Snapshot prepared locally: ${result.horoscopeComputed?.nakath || "Nakath pending"} • ${result.horoscopeComputed?.lagna || "Lagna pending"}`,
      )
    } catch (error) {
      setChartStatus("error")
      setChartMessage(error instanceof Error ? error.message : "Could not prepare horoscope snapshot.")
    }
  }

  function handleSelectedFile(kind: ProfileAssetKind, file: File) {
    if (!isAllowedProfileAssetFile(file)) {
      setBackendStatus("error")
      setBackendMessage(`Only ${allowedProfileAssetTypesLabel()} images are allowed.`)
      setUploadMessage("This file type is not supported for profile uploads.")
      return
    }

    setPendingEditorUpload({ kind, file })
  }

  function renderUploadControl(asset: {
    kind: ProfileAssetKind
    accept: string
    label: string
    helper: string
  }) {
    const isUploading = uploadingAsset === asset.kind

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">{asset.label}</p>
          <span className="text-xs text-muted-foreground">{asset.helper}</span>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <input
            type="file"
            id={`file-upload-${asset.kind}`}
            accept={asset.accept}
            disabled={!user || !backendAvailable || isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                handleSelectedFile(asset.kind, file)
              }
              event.target.value = ""
            }}
            className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground">
              Choose file
            </div>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {isUploading ? "Uploading..." : "No file chosen"}
            </span>
          </div>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          {isUploading
            ? "Upload in progress. Visuals will sync automatically."
            : user
              ? "Signed in and ready for upload."
              : "Sign in first to enable uploads."}
        </p>
      </div>
    )
  }

  function assetMeta(kind: ProfileAssetKind) {
    if (kind === "profile-photo") {
      return {
        url: resolvedProfilePhotoUrl,
        path: draft.media.profilePhotoPath,
        status: "Ready for biodata preview",
      }
    }

    if (kind === "nic-front") {
      return {
        url: resolvedNicFrontUrl,
        path: draft.media.nicFrontPath,
        status: hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl)
          ? "Front uploaded"
          : "Front missing",
      }
    }

    if (kind === "nic-back") {
      return {
        url: resolvedNicBackUrl,
        path: draft.media.nicBackPath,
        status: hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl)
          ? "Back uploaded"
          : "Back missing",
      }
    }

    return {
      url: resolvedSelfieUrl,
      path: draft.media.selfiePath,
      status: statusLabel(getVerificationStatus(draft, "selfie")),
    }
  }

  const resolvedProfilePhotoUrl = useResolvedMediaUrl(draft.media.profilePhotoPath, draft.media.profilePhotoUrl)
  const resolvedNicFrontUrl = useResolvedMediaUrl(draft.media.nicFrontPath, draft.media.nicFrontUrl)
  const resolvedNicBackUrl = useResolvedMediaUrl(draft.media.nicBackPath, draft.media.nicBackUrl)
  const resolvedSelfieUrl = useResolvedMediaUrl(draft.media.selfiePath, draft.media.selfieUrl)
  const resolvedPreviewPhotoUrl = useResolvedMediaUrl(
    previewDraft.media.profilePhotoPath,
    previewDraft.media.profilePhotoUrl,
  )
  const completion = profileCompletion(previewDraft)
  const displayAge = ageFromBirthDate(previewDraft.horoscope.birthDate) ?? previewDraft.basics.age
  const previewName =
    `${previewDraft.basics.firstName} ${previewDraft.basics.lastName}`.trim() || "Your name"
  const previewAge = displayAge || "Add age"
  const previewGender = previewValue(previewDraft.basics.gender, "Add gender")
  const previewProfession = previewValue(previewDraft.basics.profession, "Add profession")
  const previewDistrict = previewValue(previewDraft.basics.district, "Add district")
  const previewReligion = previewValue(previewDraft.basics.religion, "Religion")
  const previewLanguage = previewValue(previewDraft.basics.language, "Language")
  const previewHeight = previewDraft.basics.heightCm.trim() ? `${previewDraft.basics.heightCm} cm` : "Height"
  const previewHoroscope =
    previewDraft.horoscope.nakath && previewDraft.horoscope.lagna
      ? `${previewDraft.horoscope.nakath} • ${previewDraft.horoscope.lagna}`
      : "Add nakath and lagna"
  const previewSummary = previewValue(
    previewDraft.family.summary,
    "Add a short personal summary to shape the biodata cover note.",
  )
  const previewPreferenceLine =
    previewDraft.preferences.ageMin && previewDraft.preferences.ageMax
      ? `Age ${previewDraft.preferences.ageMin} to ${previewDraft.preferences.ageMax}`
      : "Set your preferred age range"
  const previewPreferenceContext = [
    previewDraft.preferences.preferredDistrict && `from ${previewDraft.preferences.preferredDistrict}`,
    previewDraft.preferences.religionPreference && previewDraft.preferences.religionPreference,
    previewDraft.preferences.professionPreference && `with a ${previewDraft.preferences.professionPreference.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(", ")
  const documentHref = user ? `/biodata/document?profileId=${user.uid}` : "/biodata/document"
  const nicStatus = getVerificationStatus(previewDraft, "nic")
  const selfieStatus = getVerificationStatus(previewDraft, "selfie")
  const verificationReady = isFullyVerified(previewDraft)
  const verificationPackReady =
    hasUploadedAsset(previewDraft.media.nicFrontPath, previewDraft.media.nicFrontUrl) &&
    hasUploadedAsset(previewDraft.media.nicBackPath, previewDraft.media.nicBackUrl) &&
    hasUploadedAsset(previewDraft.media.selfiePath, previewDraft.media.selfieUrl)
  const horoscopeReady = Boolean(
    previewDraft.horoscope.birthDate &&
      previewDraft.horoscope.nakath &&
      previewDraft.horoscope.lagna &&
      previewDraft.horoscope.birthTime,
  )
  const horoscopeConfidence = getHoroscopeInputConfidence(previewDraft)
  const horoscopeSummary = getHoroscopeInputSummary(previewDraft)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
      <AstrologyBackground />

      <section className="relative z-10 px-6 pb-16 pt-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button variant="ghost" asChild className="w-fit rounded-full border border-white/10 bg-white/[0.04]">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to landing page
                </Link>
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Feature 1</Badge>
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                  Biodata builder
                </Badge>
              </div>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
                Biodata
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Create your profile and keep everything in one place.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Fill in your details, upload the required images, and prepare your share-ready biodata.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href={documentHref}>
                    Open share-ready biodata
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-foreground hover:bg-white/[0.08]"
                >
                  <Link href={documentHref}>Open PDF / print view</Link>
                </Button>
                <Button
                  onClick={saveToBackend}
                  disabled={!backendAvailable || backendStatus === "saving" || backendStatus === "checking"}
                  className="h-12 rounded-full bg-[#7b5510] px-6 text-base font-semibold text-[#fff7e5] hover:bg-[#62420c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {backendStatus === "saving" ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-4 w-4" />
                      Save profile
                    </>
                  )}
                </Button>
                {user ? (
                  <Button
                    variant="outline"
                    onClick={() => void signOutUser()}
                    className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-foreground hover:bg-white/[0.08]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    asChild
                    className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-foreground hover:bg-white/[0.08]"
                  >
                    <Link href="/auth?redirectTo=%2Fbiodata">Sign in to save</Link>
                  </Button>
                )}
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Save status</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1",
                      backendStatus === "saved" || backendStatus === "ready"
                        ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                        : backendStatus === "disabled"
                          ? "border-white/10 bg-white/[0.04] text-muted-foreground"
                          : backendStatus === "error"
                            ? "border-rose-400/25 bg-rose-500/12 text-rose-100"
                            : "border-amber-400/25 bg-amber-500/12 text-amber-100",
                    )}
                  >
                    {backendStatus}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{backendMessage}</p>
                </div>
              </div>

              <div className="mt-6 max-w-4xl">
                <BiodataSharePanel
                  draft={previewDraft}
                  documentHref={documentHref}
                  title="Share with family when the biodata is ready"
                  description="Keep the sharing tone aligned with your selected biodata mode. Use the printable view, copy a family-friendly note, or move it into WhatsApp without exposing contact details too early."
                />
              </div>

              {user ? (
                <div className="mt-4 max-w-4xl">
                  <FamilyShareLinkManager draft={previewDraft} />
                </div>
              ) : null}

          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              <SectionCard
                eyebrow="Basics"
                title="Profile basics"
                description="Capture the information that makes the profile readable before we get into matching logic."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FieldShell label="First name">
                    <Input
                      value={draft.basics.firstName}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, firstName: event.target.value },
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Last name">
                    <Input
                      value={draft.basics.lastName}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, lastName: event.target.value },
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Gender">
                    <SelectField
                      value={draft.basics.gender}
                      placeholder="Select gender"
                      options={genderOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, gender: value as ProfileDraft["basics"]["gender"] },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Age" hint="Changing age will keep the birth date aligned too.">
                    <Input
                      value={draft.basics.age}
                      onChange={(event) => {
                        const nextAge = event.target.value

                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, age: nextAge },
                          horoscope: {
                            ...current.horoscope,
                            birthDate: birthDateFromAge(nextAge, current.horoscope.birthDate) ?? current.horoscope.birthDate,
                          },
                          horoscopeComputed: null,
                        }))
                      }}
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Height (cm)">
                    <Input
                      value={draft.basics.heightCm}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, heightCm: event.target.value },
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Profession">
                    <SelectField
                      value={draft.basics.profession}
                      placeholder="Select profession"
                      options={professionOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, profession: value },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="District">
                    <SelectField
                      value={draft.basics.district}
                      placeholder="Select district"
                      options={districtOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, district: value },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Religion">
                    <SelectField
                      value={draft.basics.religion}
                      placeholder="Select religion"
                      options={religionOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, religion: value },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Primary language">
                    <SelectField
                      value={draft.basics.language}
                      placeholder="Select language"
                      options={languageOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          basics: { ...current.basics, language: value },
                        }))
                      }
                    />
                  </FieldShell>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Horoscope"
                title="Porondam-ready profile details"
                description="These are the fields we will later feed into compatibility scoring and auspicious-timing features."
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Chart snapshot status</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{chartMessage}</p>
                    {draft.horoscope.normalizedBirthPlace ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Normalized place: {draft.horoscope.normalizedBirthPlace}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refreshHoroscopeSnapshot()}
                    disabled={chartStatus === "loading" || !draft.horoscope.birthDate || !draft.horoscope.birthPlace}
                    className="rounded-full border-white/10 bg-black/20 text-foreground hover:bg-white/[0.08]"
                  >
                    {chartStatus === "loading" ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Preparing snapshot
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Refresh chart snapshot
                      </>
                    )}
                  </Button>
                </div>
                {horoscopeSnapshot ? (
                  <div className="mb-5 grid gap-3 rounded-2xl border border-primary/15 bg-primary/8 p-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Nakath</p>
                      <p className="text-sm font-medium text-foreground">
                        {horoscopeSnapshot.nakath} {horoscopeSnapshot.pada ? `• Pada ${horoscopeSnapshot.pada}` : ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Rashi / Lagna</p>
                      <p className="text-sm font-medium text-foreground">
                        {horoscopeSnapshot.rashi || "Rashi pending"} • {horoscopeSnapshot.lagna || "Needs reliable birth time"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Confidence</p>
                      <p className="text-sm font-medium capitalize text-foreground">{horoscopeSnapshot.confidence}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Ayanamsa</p>
                      <p className="text-sm font-medium text-foreground">{horoscopeSnapshot.ayanamsa}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Moon longitude</p>
                      <p className="text-sm font-medium text-foreground">
                        {typeof horoscopeSnapshot.moonLongitude === "number"
                          ? `${horoscopeSnapshot.moonLongitude.toFixed(4)}°`
                          : "Pending"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Snapshot updated</p>
                      <p className="text-sm font-medium text-foreground">
                        {horoscopeSnapshot.computedAt
                          ? new Date(horoscopeSnapshot.computedAt).toLocaleString("en-LK", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-5 md:grid-cols-2">
                  <FieldShell label="Nakath">
                    <SelectField
                      value={draft.horoscope.nakath}
                      placeholder="Select nakath"
                      options={nakathOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          horoscope: { ...current.horoscope, nakath: value },
                          horoscopeComputed: null,
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Lagna">
                    <SelectField
                      value={draft.horoscope.lagna}
                      placeholder="Select lagna"
                      options={lagnaOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          horoscope: { ...current.horoscope, lagna: value },
                          horoscopeComputed: null,
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell
                    label="Birth date"
                    hint="Added from the roadmap schema. This is more reliable than age alone for matching and astrology."
                  >
                    <Input
                      type="date"
                      value={draft.horoscope.birthDate}
                      onChange={(event) => {
                        const nextBirthDate = event.target.value

                        setDraft((current) => ({
                          ...current,
                          basics: {
                            ...current.basics,
                            age: ageFromBirthDate(nextBirthDate) ?? current.basics.age,
                          },
                          horoscope: { ...current.horoscope, birthDate: nextBirthDate },
                          horoscopeComputed: null,
                        }))
                      }}
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Birth time" hint="Required if we want confident Porondam context later.">
                    <Input
                      value={draft.horoscope.birthTime}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          horoscope: { ...current.horoscope, birthTime: event.target.value },
                          horoscopeComputed: null,
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Birth time accuracy" hint="Use approximate or unknown when the family is not fully sure.">
                    <SelectField
                      value={draft.horoscope.birthTimeAccuracy}
                      placeholder="Select time accuracy"
                      options={birthTimeAccuracyOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          horoscope: {
                            ...current.horoscope,
                            birthTimeAccuracy: value as BirthTimeAccuracy,
                          },
                          horoscopeComputed: null,
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Birth place">
                    <Input
                      value={draft.horoscope.birthPlace}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          horoscope: {
                            ...current.horoscope,
                            birthPlace: event.target.value,
                            normalizedBirthPlace: "",
                            birthLatitude: null,
                            birthLongitude: null,
                            birthTimeZone: "Asia/Colombo",
                          },
                          horoscopeComputed: null,
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Context"
                title="Family and personal summary"
                description="A good biodata feels respectful and informative, not overloaded. These fields shape that balance."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FieldShell label="Education">
                    <SelectField
                      value={draft.family.education}
                      placeholder="Select education"
                      options={educationOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          family: { ...current.family, education: value },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Siblings">
                    <SelectField
                      value={draft.family.siblings}
                      placeholder="Select sibling count"
                      options={siblingOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          family: { ...current.family, siblings: value },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Father's occupation">
                    <Input
                      value={draft.family.fatherOccupation}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          family: { ...current.family, fatherOccupation: event.target.value },
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Mother's occupation">
                    <Input
                      value={draft.family.motherOccupation}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          family: { ...current.family, motherOccupation: event.target.value },
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                </div>

                <FieldShell
                  label="Profile summary"
                  hint="This becomes the short cover note on the biodata and profile detail screen."
                >
                  <Textarea
                    value={draft.family.summary}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        family: { ...current.family, summary: event.target.value },
                      }))
                    }
                    className="min-h-28 border-white/10 bg-black/20"
                  />
                </FieldShell>
              </SectionCard>

              <SectionCard
                eyebrow="Preferences"
                title="Partner preferences"
                description="These fields shape the first matching pass and the biodata summary shared with families."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FieldShell label="Preferred age from">
                    <Input
                      value={draft.preferences.ageMin}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, ageMin: event.target.value },
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Preferred age to">
                    <Input
                      value={draft.preferences.ageMax}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, ageMax: event.target.value },
                        }))
                      }
                      className="border-white/10 bg-black/20"
                    />
                  </FieldShell>
                  <FieldShell label="Preferred district">
                    <SelectField
                      value={draft.preferences.preferredDistrict}
                      placeholder="Select district"
                      options={districtOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, preferredDistrict: value },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Preferred religion">
                    <SelectField
                      value={draft.preferences.religionPreference}
                      placeholder="Select religion"
                      options={religionOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, religionPreference: value },
                        }))
                      }
                    />
                  </FieldShell>
                </div>

                <FieldShell label="Profession preference">
                  <Input
                    value={draft.preferences.professionPreference}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        preferences: { ...current.preferences, professionPreference: event.target.value },
                      }))
                    }
                    className="border-white/10 bg-black/20"
                  />
                </FieldShell>

                <FieldShell label="Willing to migrate">
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, willingToMigrate: true },
                        }))
                      }
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left transition-all",
                        draft.preferences.willingToMigrate
                          ? "border-primary/40 bg-primary/12"
                          : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">Open to local or diaspora relocation</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Matches the roadmap preference field for migration readiness.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, willingToMigrate: false },
                        }))
                      }
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left transition-all",
                        !draft.preferences.willingToMigrate
                          ? "border-primary/40 bg-primary/12"
                          : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">Prefer Sri Lanka based introductions</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Keeps the first match set focused on local long-term plans.
                      </p>
                    </button>
                  </div>
                </FieldShell>
              </SectionCard>

              <SectionCard
                eyebrow="Lifestyle Alignment"
                title="Life After Marriage"
                description="Astrology predicts cosmic compatibility, but practical lifestyle clash is a major factor. These private questions calculate your unique Lifestyle Alignment Percentage for potential matches."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FieldShell label="Expected Family Setup" hint="Joint family (parents) vs Nuclear family.">
                    <SelectField
                      value={draft.preferences.expectedFamilySetup}
                      placeholder="Select family setup"
                      options={familySetupOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, expectedFamilySetup: value },
                        }))
                      }
                    />
                  </FieldShell>
                  <FieldShell label="Spouse Career Expectation" hint="Working, Non-working, or Flexible.">
                    <SelectField
                      value={draft.preferences.spouseCareerExpectation}
                      placeholder="Select career expectation"
                      options={spouseCareerOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          preferences: { ...current.preferences, spouseCareerExpectation: value },
                        }))
                      }
                    />
                  </FieldShell>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Trust controls"
                title="Privacy and verification"
                description="This is where the roadmap starts to feel different from generic dating UI. These controls shape safety and how the introduction unfolds."
              >
                <div className="space-y-5">
                  <FieldShell label="Photo visibility">
                    <ChoiceGroup
                      value={draft.privacy.photoVisibility}
                      options={photoVisibilityOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          privacy: { ...current.privacy, photoVisibility: value },
                        }))
                      }
                    />
                  </FieldShell>

                  <FieldShell label="Contact visibility">
                    <ChoiceGroup
                      value={draft.privacy.contactVisibility}
                      options={contactVisibilityOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          privacy: { ...current.privacy, contactVisibility: value },
                        }))
                      }
                    />
                  </FieldShell>

                  <FieldShell label="Biodata sharing mode">
                    <ChoiceGroup
                      value={draft.privacy.biodataShareMode}
                      options={biodataShareOptions}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          privacy: { ...current.privacy, biodataShareMode: value },
                        }))
                      }
                    />
                  </FieldShell>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FieldShell
                      label="Phone number"
                      hint="Shown only when your contact rule allows it after an approved match."
                    >
                      <Input
                        value={draft.contact.personalPhone}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            contact: { ...current.contact, personalPhone: event.target.value },
                          }))
                        }
                        placeholder="+94 77 123 4567"
                        className="border-white/10 bg-black/20"
                      />
                    </FieldShell>
                    <FieldShell
                      label="WhatsApp number"
                      hint="Optional. If blank, only your main phone number can be shared."
                    >
                      <Input
                        value={draft.contact.whatsappNumber}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            contact: { ...current.contact, whatsappNumber: event.target.value },
                          }))
                        }
                        placeholder="+94 77 123 4567"
                        className="border-white/10 bg-black/20"
                      />
                    </FieldShell>
                    <FieldShell
                      label="Family contact name"
                      hint="Used only when you choose family-request contact sharing."
                    >
                      <Input
                        value={draft.contact.familyContactName}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            contact: { ...current.contact, familyContactName: event.target.value },
                          }))
                        }
                        placeholder="Parent or guardian name"
                        className="border-white/10 bg-black/20"
                      />
                    </FieldShell>
                    <FieldShell
                      label="Family contact phone"
                      hint="Used for parent-guided introductions."
                    >
                      <Input
                        value={draft.contact.familyContactPhone}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            contact: { ...current.contact, familyContactPhone: event.target.value },
                          }))
                        }
                        placeholder="+94 77 123 4567"
                        className="border-white/10 bg-black/20"
                      />
                    </FieldShell>
                  </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                      <p className="text-sm font-semibold text-foreground">NIC review</p>
                      <div className={cn("mt-4 rounded-2xl border px-4 py-3", statusClasses(nicStatus))}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">Current status</span>
                          <span className="text-xs uppercase tracking-[0.2em]">{statusLabel(nicStatus)}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        {!hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl) ||
                        !hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl)
                          ? "Upload both NIC sides first. That moves this step into submitted review state."
                          : nicStatus === "verified"
                            ? "Identity review has cleared both sides and can support trust badges."
                            : "Both NIC sides are uploaded. This stays in submitted until your team review marks it verified."}
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                      <p className="text-sm font-semibold text-foreground">Selfie review</p>
                      <div className={cn("mt-4 rounded-2xl border px-4 py-3", statusClasses(selfieStatus))}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">Current status</span>
                          <span className="text-xs uppercase tracking-[0.2em]">{statusLabel(selfieStatus)}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        {!hasUploadedAsset(draft.media.selfiePath, draft.media.selfieUrl)
                          ? "Upload a verification selfie so the identity check can be matched to the NIC."
                          : selfieStatus === "verified"
                            ? "Selfie check has cleared review and supports the trust layer."
                            : "Selfie uploaded. This stays in submitted until a reviewer completes the match."}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-primary/20 bg-primary/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Verification workflow</p>
                        <p className="mt-2 text-sm leading-6 text-foreground/85">
                          {!verificationPackReady
                            ? "Upload NIC front, NIC back, and selfie to move this profile into the review queue."
                            : verificationReady
                              ? "Both checks are verified. This profile can show full trust badges across the product."
                              : "All required images are uploaded. The profile is now in the review queue and waiting for a verified decision."}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-1",
                          verificationReady
                            ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                            : verificationPackReady
                              ? "border-amber-400/25 bg-amber-500/12 text-amber-100"
                              : "border-white/10 bg-white/[0.04] text-muted-foreground",
                        )}
                      >
                        {verificationReady
                          ? "Verified"
                          : verificationPackReady
                            ? "Submitted for review"
                            : "Uploads missing"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 1</p>
                        <p className="mt-2 text-sm font-medium text-foreground">Upload NIC front</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2</p>
                        <p className="mt-2 text-sm font-medium text-foreground">Upload NIC back</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 3</p>
                        <p className="mt-2 text-sm font-medium text-foreground">Upload selfie</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 4</p>
                        <p className="mt-2 text-sm font-medium text-foreground">Team review unlocks verified</p>
                      </div>
                    </div>
                  </div>

                  <FieldShell
                    label="Verification assets"
                    hint={`One image per slot. Allowed types: ${allowedProfileAssetTypesLabel()}.`}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      {assetCards.map((asset) => {
                        const meta = assetMeta(asset.kind)

                        return (
                          <div
                            key={asset.kind}
                            className="rounded-[28px] border border-white/10 bg-black/20 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                                <asset.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{asset.title}</p>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">{asset.description}</p>
                              </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full px-3 py-1",
                                    meta.url
                                      ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                                      : "border-white/10 bg-white/[0.04] text-muted-foreground",
                                  )}
                                >
                                  {meta.url ? meta.status : "Not uploaded"}
                                </Badge>
                              </div>
                              {meta.path || meta.url ? (
                                <MediaPreviewDialog
                                  title={asset.title}
                                  path={meta.path}
                                  fallbackUrl={meta.url}
                                  kind={assetPreviewKind(asset.kind)}
                                />
                              ) : null}
                            </div>

                            <div className="mt-4">
                              {renderUploadControl({
                                kind: asset.kind,
                                accept: asset.accept,
                                label: "Upload image",
                                helper: "One image only",
                              })}
                            </div>
                          </div>
                        )
                      })}

                      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] md:col-span-2">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">NIC images</p>
                              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                Upload both NIC sides together. Verification only moves forward after both are present.
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "inline-flex w-fit rounded-full px-3 py-1",
                              hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl) &&
                                hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl)
                                ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                                : "border-amber-400/25 bg-amber-500/12 text-amber-100",
                            )}
                          >
                            {hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl) &&
                            hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl)
                              ? "Both sides ready"
                              : "Both sides required"}
                          </Badge>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">NIC completeness</p>
                            <p className="text-sm font-medium text-foreground">
                              {Number(hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl)) +
                                Number(hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl))}
                              /2 uploaded
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {([
                            {
                              title: "NIC front",
                              kind: "nic-front",
                              accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
                            },
                            {
                              title: "NIC back",
                              kind: "nic-back",
                              accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
                            },
                          ] as const).map((asset, index) => {
                            const meta = assetMeta(asset.kind)

                            return (
                              <div
                                key={asset.kind}
                                className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{asset.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {index === 0
                                        ? "Make sure the NIC number and face area are clear."
                                        : "Make sure the address and issue details are readable."}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "rounded-full px-3 py-1",
                                      meta.url
                                        ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                                        : "border-white/10 bg-white/[0.04] text-muted-foreground",
                                    )}
                                  >
                                    {meta.url ? meta.status : "Not uploaded"}
                                  </Badge>
                                </div>
                                {meta.path || meta.url ? (
                                  <MediaPreviewDialog
                                    title={asset.title}
                                    path={meta.path}
                                    fallbackUrl={meta.url}
                                    kind="image"
                                  />
                                ) : null}
                                <div className="mt-4">
                                  {renderUploadControl({
                                    kind: asset.kind,
                                    accept: asset.accept,
                                    label: `Upload ${asset.title.toLowerCase()}`,
                                    helper: "One image only",
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Upload status</p>
                      <p className="mt-2 text-sm leading-6 text-foreground/85">{uploadMessage}</p>
                    </div>
                  </FieldShell>

                  <FieldShell label="Family contact preference">
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            verification: { ...current.verification, familyContactAllowed: true },
                          }))
                        }
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition-all",
                          draft.verification.familyContactAllowed
                            ? "border-primary/40 bg-primary/12"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
                        )}
                      >
                        <p className="text-sm font-medium text-foreground">Family can coordinate first</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Best for parent-guided introductions and biodata review.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            verification: { ...current.verification, familyContactAllowed: false },
                          }))
                        }
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition-all",
                          !draft.verification.familyContactAllowed
                            ? "border-primary/40 bg-primary/12"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]",
                        )}
                      >
                        <p className="text-sm font-medium text-foreground">Direct conversation first</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Keep the introduction between the two profiles until both sides are comfortable.
                        </p>
                      </button>
                    </div>
                  </FieldShell>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Card className="border-white/10 bg-[#121214]/90 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Live biodata preview</p>
                      <CardTitle className="mt-2 text-2xl text-foreground">{previewName}</CardTitle>
                      <CardDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                        {previewAge} • {previewGender} • {previewProfession} • {previewDistrict}
                      </CardDescription>
                    </div>
                    <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">
                      {completion}% ready
                    </Badge>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-[#f0d27b] to-primary"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4">
                    <ProfilePhotoCard
                      photoUrl={resolvedPreviewPhotoUrl}
                      photoPath={previewDraft.media.profilePhotoPath}
                      displayName={previewName}
                      visibility={previewDraft.privacy.photoVisibility}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                      {previewReligion}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                      {previewLanguage}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                      {previewGender}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1">
                      {previewHeight}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Horoscope</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{previewHoroscope}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {horoscopeSummary}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {horoscopeConfidence} confidence
                        {previewDraft.horoscope.birthTimeAccuracy
                          ? ` • ${previewDraft.horoscope.birthTimeAccuracy.replace("-", " ")} time`
                          : ""}
                        {horoscopeReady ? "" : " • still improving"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Introduction mode</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {previewDraft.verification.familyContactAllowed ? "Family-aware intro" : "Direct intro"}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {previewDraft.privacy.photoVisibility === "family"
                          ? "This biodata can circulate before the photo is shown."
                          : previewDraft.privacy.photoVisibility === "blurred"
                            ? "Photos stay strongly softened until mutual comfort is clear."
                            : "A milder privacy preview is shown until both sides respond positively."}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Summary for the biodata cover note</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{previewSummary}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Verification status</p>
                    <div className="grid gap-3">
                      <div className={cn("rounded-2xl border px-4 py-3", statusClasses(nicStatus))}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">NIC review</span>
                          <span className="text-xs uppercase tracking-[0.2em]">
                            {statusLabel(nicStatus)}
                          </span>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl border px-4 py-3",
                          statusClasses(selfieStatus),
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">Selfie review</span>
                          <span className="text-xs uppercase tracking-[0.2em]">
                            {statusLabel(selfieStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Photo</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {hasUploadedAsset(previewDraft.media.profilePhotoPath, previewDraft.media.profilePhotoUrl)
                          ? "Uploaded"
                          : "Pending"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">NIC sides</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {hasUploadedAsset(previewDraft.media.nicFrontPath, previewDraft.media.nicFrontUrl) &&
                        hasUploadedAsset(previewDraft.media.nicBackPath, previewDraft.media.nicBackUrl)
                          ? "Uploaded"
                          : "Pending"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selfie</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {hasUploadedAsset(previewDraft.media.selfiePath, previewDraft.media.selfieUrl)
                          ? "Uploaded"
                          : "Pending"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
                    <div className="flex items-center gap-2">
                      {verificationReady ? (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <LockKeyhole className="h-4 w-4 text-primary" />
                      )}
                      <p className="text-sm font-semibold text-foreground">
                        {verificationReady ? "Ready for visible trust badges" : "Still in trust-setup mode"}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-foreground/85">
                      Photos: {previewDraft.privacy.photoVisibility.replace("-", " ")}. Contact:{" "}
                      {previewDraft.privacy.contactVisibility.replace("-", " ")}. Sharing:{" "}
                      {previewDraft.privacy.biodataShareMode.replace("-", " ")}.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Partner preference snapshot</p>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      {previewPreferenceLine}
                      {previewPreferenceContext ? `, preferably ${previewPreferenceContext}.` : "."}{" "}
                      {previewDraft.preferences.willingToMigrate
                        ? "Open to diaspora / relocation."
                        : "Prefers Sri Lanka based settling."}{" "}
                      {previewDraft.preferences.expectedFamilySetup
                        ? `${previewDraft.preferences.expectedFamilySetup} setup desired.`
                        : "Add family setup and career expectations to complete this section."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                      <Link href={documentHref}>
                        View biodata layout
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="h-11 rounded-full border-white/15 bg-white/[0.04] px-5 text-foreground hover:bg-white/[0.08]"
                    >
                      <Link href={documentHref}>Print / export PDF</Link>
                    </Button>
                    <Button
                      onClick={saveToBackend}
                      disabled={!backendAvailable || backendStatus === "saving" || backendStatus === "checking"}
                      className="h-11 rounded-full bg-[#7b5510] px-5 font-semibold text-[#fff7e5] hover:bg-[#62420c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {backendStatus === "saving" ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <CloudUpload className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.035] backdrop-blur-xl">
                <CardContent className="px-6 py-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Next after this</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    Once this structure is stable, the next roadmap slices should be PDF export, Porondam scoring,
                    verification workflow, and profile detail views backed by Firebase.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ImageEditDialog
        open={Boolean(pendingEditorUpload)}
        file={pendingEditorUpload?.file ?? null}
        kind={pendingEditorUpload?.kind ?? null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingEditorUpload(null)
          }
        }}
        onConfirm={async (croppedFile) => {
          if (!pendingEditorUpload) return
          await handleAssetUpload(pendingEditorUpload.kind, croppedFile)
          setPendingEditorUpload(null)
        }}
      />
    </main>
  )
}
