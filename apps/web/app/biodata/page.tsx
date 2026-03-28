import type { Metadata } from "next"

import { BiodataBuilder } from "@/components/biodata-builder"

export const metadata: Metadata = {
  title: "Build Your Biodata | Nakath.lk",
  description:
    "Create a structured Sri Lankan matrimony biodata with privacy, verification, and horoscope details ready for PDF export.",
}

export default function BiodataPage() {
  return <BiodataBuilder />
}
