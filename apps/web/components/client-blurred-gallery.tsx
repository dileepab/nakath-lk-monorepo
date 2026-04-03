"use client"

import dynamic from "next/dynamic"

const BlurredGallery = dynamic(() => import("@/components/blurred-gallery").then((mod) => mod.BlurredGallery), {
  ssr: false,
})

export function ClientBlurredGallery() {
  return <BlurredGallery />
}
