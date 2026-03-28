import { BadgeCheck, FileText, HeartHandshake, LockKeyhole, Sparkles } from "lucide-react"

import { ProfilePhotoCard } from "@/components/profile-photo-card"
import { Badge } from "@/components/ui/badge"
import { ageFromBirthDate, getVerificationStatus, isFullyVerified, type ProfileDraft } from "@acme/core"

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-[#e7dcc0] bg-[#fffdfa] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8d6b16]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-[#efe6cf] bg-white px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8b806a]">{item.label}</p>
          <p className="mt-2 text-sm leading-6 text-[#271f12]">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

export function BiodataDocument({ draft }: { draft: ProfileDraft }) {
  const displayAge = ageFromBirthDate(draft.horoscope.birthDate) ?? draft.basics.age
  const displayName = `${draft.basics.firstName} ${draft.basics.lastName}`.trim()
  const nicStatus = getVerificationStatus(draft, "nic")
  const selfieStatus = getVerificationStatus(draft, "selfie")
  const verificationReady = isFullyVerified(draft)
  const verificationSubmitted = nicStatus !== "not-submitted" && selfieStatus !== "not-submitted"

  function formatStatus(status: "not-submitted" | "submitted" | "verified") {
    if (status === "verified") return "Verified"
    if (status === "submitted") return "Submitted"
    return "Not submitted"
  }

  return (
    <article className="biodata-sheet mx-auto w-full max-w-[880px] rounded-[36px] border border-[#eadfc7] bg-[#f8f2e6] p-6 text-[#20170c] shadow-[0_28px_90px_rgba(0,0,0,0.12)] md:p-10">
      <header className="rounded-[30px] border border-[#dbc68d] bg-[linear-gradient(135deg,#271708_0%,#4d310b_52%,#7b5510_100%)] px-6 py-7 text-[#fff7e5] md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#e5cc81]">Sanhinda biodata</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{displayName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#f3e7cb]">
              A polished matrimonial biodata designed for careful introductions, family sharing, and future digital export.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:max-w-[16rem] md:justify-end">
            <Badge className="rounded-full border border-[#efdba2]/25 bg-[#e2c267] px-3 py-1 text-[#2e1e06]">
              {displayAge} years
            </Badge>
            <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white">
              {draft.basics.gender}
            </Badge>
            <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white">
              {draft.basics.district}
            </Badge>
          </div>
        </div>

        {draft.media.profilePhotoUrl ? (
          <div className="mt-6 flex justify-start md:justify-end">
            <ProfilePhotoCard
              photoUrl={draft.media.profilePhotoUrl}
              displayName={displayName}
              visibility={draft.privacy.photoVisibility}
              compact
            />
          </div>
        ) : null}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Section title="Personal Profile">
          <DetailGrid
            items={[
              { label: "Profession", value: draft.basics.profession },
              { label: "Religion", value: draft.basics.religion },
              { label: "Language", value: draft.basics.language },
              { label: "Height", value: `${draft.basics.heightCm} cm` },
              { label: "Date of birth", value: draft.horoscope.birthDate },
              { label: "Place of birth", value: draft.horoscope.birthPlace },
            ]}
          />
        </Section>

        <Section title="Trust Summary">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#efe6cf] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#271f12]">
                <LockKeyhole className="h-4 w-4 text-[#8d6b16]" />
                Privacy mode
              </div>
              <p className="mt-2 text-sm leading-6 text-[#4c3b1f]">
                Photos are set to <span className="font-medium">{draft.privacy.photoVisibility.replace("-", " ")}</span>,
                and contact details are <span className="font-medium">{draft.privacy.contactVisibility.replace("-", " ")}</span>.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#4c3b1f]">
                {draft.privacy.photoVisibility === "family"
                  ? "This document keeps the photo fully held back until the family review step is complete."
                  : draft.privacy.photoVisibility === "blurred"
                    ? "This document shows only a softened photo preview before the introduction unlocks."
                    : "This document keeps a controlled preview until both sides respond positively."}
              </p>
            </div>

            <div className="rounded-2xl border border-[#efe6cf] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#271f12]">
                <BadgeCheck className="h-4 w-4 text-[#8d6b16]" />
                Verification
              </div>
              <p className="mt-2 text-sm leading-6 text-[#4c3b1f]">
                NIC review is <span className="font-medium">{formatStatus(nicStatus)}</span> and selfie review is{" "}
                <span className="font-medium">{formatStatus(selfieStatus)}</span>.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#4c3b1f]">
                {verificationReady
                  ? "This profile can carry verified trust badges because both checks are complete."
                  : verificationSubmitted
                    ? "Both files are on record and the profile is waiting for final review."
                    : "Verification is still incomplete until both the NIC and selfie are uploaded."}
              </p>
            </div>

            <div className="rounded-2xl border border-[#efe6cf] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#271f12]">
                <FileText className="h-4 w-4 text-[#8d6b16]" />
                Sharing mode
              </div>
              <p className="mt-2 text-sm leading-6 text-[#4c3b1f]">
                Preferred sharing format is <span className="font-medium">{draft.privacy.biodataShareMode.replace("-", " ")}</span>.
              </p>
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Section title="Horoscope Details">
          <DetailGrid
            items={[
              { label: "Nakath", value: draft.horoscope.nakath },
              { label: "Lagna", value: draft.horoscope.lagna },
              { label: "Birth time", value: draft.horoscope.birthTime },
              { label: "Porondam readiness", value: "Birth date, time, and place are captured for scoring." },
            ]}
          />
        </Section>

        <Section title="Family Background">
          <DetailGrid
            items={[
              { label: "Education", value: draft.family.education },
              { label: "Siblings", value: draft.family.siblings },
              { label: "Father's occupation", value: draft.family.fatherOccupation },
              { label: "Mother's occupation", value: draft.family.motherOccupation },
            ]}
          />
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Section title="Personal Summary">
          <div className="rounded-[24px] border border-[#efe6cf] bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-[#271f12]">
              <HeartHandshake className="h-4 w-4 text-[#8d6b16]" />
              Introduction note
            </div>
            <p className="mt-3 text-sm leading-7 text-[#3d3019]">{draft.family.summary}</p>
          </div>
        </Section>

        <Section title="Partner Preferences">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#efe6cf] bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8b806a]">Age range</p>
              <p className="mt-2 text-sm leading-6 text-[#271f12]">
                {draft.preferences.ageMin} to {draft.preferences.ageMax}
              </p>
            </div>
            <div className="rounded-2xl border border-[#efe6cf] bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8b806a]">Preference notes</p>
              <p className="mt-2 text-sm leading-6 text-[#271f12]">
                {draft.preferences.preferredDistrict}, {draft.preferences.religionPreference}, with a{" "}
                {draft.preferences.professionPreference.toLowerCase()}.
              </p>
            </div>
            <div className="rounded-2xl border border-[#efe6cf] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#271f12]">
                <Sparkles className="h-4 w-4 text-[#8d6b16]" />
                Migration preference
              </div>
              <p className="mt-2 text-sm leading-6 text-[#4c3b1f]">
                {draft.preferences.willingToMigrate
                  ? "Open to local or diaspora relocation when the match feels right."
                  : "Prefers a Sri Lanka-based future and local introductions first."}
              </p>
            </div>
          </div>
        </Section>
      </div>
    </article>
  )
}
