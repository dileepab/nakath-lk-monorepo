import type { Metadata } from "next"
import { Suspense } from "react"

import { BiodataDocumentPage } from "@/components/biodata-document-page"

export const metadata: Metadata = {
  title: "Biodata Document | Sanhinda",
  description:
    "A printable and PDF-ready matrimonial biodata built from the Sanhinda profile draft.",
}

export default function BiodataDocumentRoute() {
  return (
    <Suspense fallback={null}>
      <BiodataDocumentPage />
    </Suspense>
  )
}
