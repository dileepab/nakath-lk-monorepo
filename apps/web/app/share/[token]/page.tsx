import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Clock3, Link2Off, ShieldCheck } from "lucide-react"

import { BiodataDocument } from "@/components/biodata-document"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { loadPublicFamilyShare } from "@/lib/family-share-links"

export const metadata: Metadata = {
  title: "Family Share | Nakath.lk",
  description: "A secure family-share biodata page from Nakath.lk.",
  robots: {
    index: false,
    follow: false,
  },
  themeColor: "#0B0B0C",
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

export default async function FamilySharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await loadPublicFamilyShare(token)

  switch (result.status) {
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
    case "ready":
      break
  }

  return (
    <main className="min-h-screen bg-[#ece5d7] px-6 py-8 text-[#20170c] md:px-10">
      <div className="mx-auto mb-6 max-w-[880px]">
        <Card className="border-[#dccca6] bg-[#f8f2e6] shadow-[0_18px_50px_rgba(91,67,22,0.08)]">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center gap-2 text-[#8d6b16]">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.26em]">Secure family share</p>
            </div>
            <p className="text-lg font-semibold text-[#271f12]">This biodata was shared through a protected Nakath.lk family link.</p>
            <div className="grid gap-3 text-sm leading-6 text-[#5f4b2a] md:grid-cols-2">
              <p>Contact details and protected media are intentionally excluded here. Families can review the biodata without exposing direct reach-out details too early.</p>
              <p className="flex items-start gap-2">
                <Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#8d6b16]" />
                Expires {result.expiresAt ? new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(result.expiresAt)) : "soon"}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BiodataDocument draft={result.draft} />
    </main>
  )
}
