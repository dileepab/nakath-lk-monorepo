import type { Metadata } from "next"
import { Suspense } from "react"

import { BiodataDocumentPage } from "@/components/biodata-document-page"
import { loadPublicFamilyShare } from "@/lib/family-share-links"

export const metadata: Metadata = {
  title: "Biodata Document | Nakath.lk",
  description:
    "A printable and PDF-ready matrimonial biodata built from the Nakath.lk profile draft.",
}

export default async function BiodataDocumentRoute({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string; shareToken?: string }>
}) {
  const params = await searchParams
  const publicShare = params.shareToken ? await loadPublicFamilyShare(params.shareToken) : null

  return (
    <Suspense fallback={null}>
      <BiodataDocumentPage initialProfileId={params.profileId ?? null} publicShare={publicShare} />
    </Suspense>
  )
}
