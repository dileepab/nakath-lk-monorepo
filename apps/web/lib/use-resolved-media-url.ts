"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"

export function useResolvedMediaUrl(path?: string, fallbackUrl?: string) {
  const { user } = useAuth()
  const [resolvedUrl, setResolvedUrl] = useState(fallbackUrl ?? "")

  useEffect(() => {
    let cancelled = false

    if (!path) {
      setResolvedUrl(fallbackUrl ?? "")
      return
    }

    if (!path.startsWith("profiles/")) {
      setResolvedUrl(fallbackUrl || path)
      return
    }

    if (!user) {
      setResolvedUrl(fallbackUrl ?? "")
      return
    }

    async function resolveUrl() {
      const mediaPath = path
      const currentUser = user
      if (!mediaPath || !currentUser) {
        if (!cancelled) {
          setResolvedUrl(fallbackUrl ?? "")
        }
        return
      }

      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch(`/api/media/url?path=${encodeURIComponent(mediaPath)}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          if (!cancelled) {
            setResolvedUrl(fallbackUrl ?? "")
          }
          return
        }

        const payload = (await response.json()) as { url?: string }
        if (!cancelled) {
          setResolvedUrl(payload.url ?? fallbackUrl ?? "")
        }
      } catch {
        if (!cancelled) {
          setResolvedUrl(fallbackUrl ?? "")
        }
      }
    }

    void resolveUrl()

    return () => {
      cancelled = true
    }
  }, [fallbackUrl, path, user])

  return resolvedUrl
}
