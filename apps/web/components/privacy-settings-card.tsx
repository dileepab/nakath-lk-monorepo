"use client"

import { useState } from "react"
import { EyeOff, LoaderCircle, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { saveProfileDraftToBackend } from "@/lib/profile-store"
import { type BiodataShareMode, type ContactVisibility, type PhotoVisibility, type ProfileDraft } from "@acme/core"

type SaveKey = "photoVisibility" | "contactVisibility" | "biodataShareMode" | "familyContactAllowed"

const photoOptions: Array<{ value: PhotoVisibility; label: string; description: string }> = [
  { value: "blurred", label: "Blur until approval", description: "Keep your photo softened until the introduction is accepted." },
  { value: "mutual", label: "Unlock on mutual approval", description: "Show the full photo once both sides approve the introduction." },
  { value: "family", label: "Family-first reveal", description: "Keep the photo held back unless the flow reaches a family-led step." },
]

const contactOptions: Array<{ value: ContactVisibility; label: string; description: string }> = [
  { value: "hidden", label: "In-app only", description: "Keep phone details hidden even after approval." },
  { value: "mutual", label: "Reveal after approval", description: "Show personal contact details once the introduction is approved." },
  { value: "family-request", label: "Family contact only", description: "Reveal family contact details instead of direct personal contact." },
]

const biodataOptions: Array<{ value: BiodataShareMode; label: string; description: string }> = [
  { value: "pdf", label: "PDF friendly", description: "Best for a clean biodata document that can still be shared later." },
  { value: "whatsapp", label: "WhatsApp ready", description: "Optimized for quick digital sharing inside trusted family circles." },
  { value: "family-review", label: "Family review first", description: "Keep the biodata framed for parents and guardians before wider sharing." },
]

export function PrivacySettingsCard({
  userId,
  draft,
  onDraftChange,
}: {
  userId: string
  draft: ProfileDraft
  onDraftChange: (draft: ProfileDraft) => void
}) {
  const [savingKey, setSavingKey] = useState<SaveKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function persist(nextDraft: ProfileDraft, key: SaveKey) {
    onDraftChange(nextDraft)
    setSavingKey(key)
    setError(null)

    try {
      await saveProfileDraftToBackend(userId, nextDraft)
    } catch (nextError) {
      onDraftChange(draft)
      setError("Could not save these privacy settings right now.")
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="space-y-3 pb-5">
        <div className="flex items-center gap-2">
          <EyeOff className="h-4 w-4 text-primary" />
          <CardTitle className="text-xl text-foreground">Privacy and sharing</CardTitle>
        </div>
        <CardDescription className="leading-6 text-muted-foreground">
          Control how much becomes visible before and after an introduction is approved. These settings shape how safe the app feels for you and your family.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <Label className="text-sm font-semibold text-foreground">Profile photo visibility</Label>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Decide when your profile photo should stop being softened for another person.
          </p>
          <Select
            value={draft.privacy.photoVisibility}
            onValueChange={(value) =>
              void persist(
                {
                  ...draft,
                  privacy: {
                    ...draft.privacy,
                    photoVisibility: value as PhotoVisibility,
                  },
                },
                "photoVisibility",
              )
            }
            disabled={savingKey === "photoVisibility"}
          >
            <SelectTrigger className="mt-4 border-white/10 bg-white/[0.04] text-foreground">
              <SelectValue placeholder="Choose how photos unlock" />
            </SelectTrigger>
            <SelectContent>
              {photoOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-3 text-sm text-muted-foreground">
            {photoOptions.find((option) => option.value === draft.privacy.photoVisibility)?.description}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <Label className="text-sm font-semibold text-foreground">Contact reveal rule</Label>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Decide whether people see your own number, a family contact, or only the in-app conversation after approval.
          </p>
          <Select
            value={draft.privacy.contactVisibility}
            onValueChange={(value) =>
              void persist(
                {
                  ...draft,
                  privacy: {
                    ...draft.privacy,
                    contactVisibility: value as ContactVisibility,
                  },
                },
                "contactVisibility",
              )
            }
            disabled={savingKey === "contactVisibility"}
          >
            <SelectTrigger className="mt-4 border-white/10 bg-white/[0.04] text-foreground">
              <SelectValue placeholder="Choose how contact unlocks" />
            </SelectTrigger>
            <SelectContent>
              {contactOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-3 text-sm text-muted-foreground">
            {contactOptions.find((option) => option.value === draft.privacy.contactVisibility)?.description}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <Label className="text-sm font-semibold text-foreground">Biodata sharing mode</Label>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose the tone of your biodata handoff so it matches how your family prefers to introduce profiles.
          </p>
          <Select
            value={draft.privacy.biodataShareMode}
            onValueChange={(value) =>
              void persist(
                {
                  ...draft,
                  privacy: {
                    ...draft.privacy,
                    biodataShareMode: value as BiodataShareMode,
                  },
                },
                "biodataShareMode",
              )
            }
            disabled={savingKey === "biodataShareMode"}
          >
            <SelectTrigger className="mt-4 border-white/10 bg-white/[0.04] text-foreground">
              <SelectValue placeholder="Choose a biodata sharing mode" />
            </SelectTrigger>
            <SelectContent>
              {biodataOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-3 text-sm text-muted-foreground">
            {biodataOptions.find((option) => option.value === draft.privacy.biodataShareMode)?.description}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-sm font-semibold text-foreground">Allow family contact details after approval</Label>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep a family-first option available if an approved introduction should still route through parents or guardians.
              </p>
            </div>
            <Switch
              checked={draft.verification.familyContactAllowed}
              disabled={savingKey === "familyContactAllowed"}
              onCheckedChange={(checked) =>
                void persist(
                  {
                    ...draft,
                    verification: {
                      ...draft.verification,
                      familyContactAllowed: checked,
                    },
                  },
                  "familyContactAllowed",
                )
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-medium">Settings save directly to your profile</span>
          </div>
          <Badge className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-muted-foreground">
            {savingKey ? (
              <>
                <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin text-primary" />
                Saving
              </>
            ) : (
              "Synced"
            )}
          </Badge>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
