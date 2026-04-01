"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { ProfileDetailPage } from "@/components/profile-detail-page"

function ProfilePageContent() {
  const searchParams = useSearchParams()
  const profileId = searchParams.get("profileId")?.trim() || "me"

  return <ProfileDetailPage profileId={profileId} />
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  )
}
