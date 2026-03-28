import type { Metadata } from "next"
import { Suspense } from "react"

import { AuthPage } from "@/components/auth-page"

export const metadata: Metadata = {
  title: "Sign In | Nakath Platform",
  description: "Sign in to save and manage your matrimony biodata securely.",
}

export default function AuthRoute() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  )
}
