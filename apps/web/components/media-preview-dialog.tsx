"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type MediaPreviewKind = "image" | "document"

export function MediaPreviewDialog({
  title,
  path,
  fallbackUrl,
  kind,
}: {
  title: string
  path?: string | null
  fallbackUrl?: string | null
  kind: MediaPreviewKind
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [resolvedUrl, setResolvedUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return

    let active = true
    let objectUrl = ""

    async function loadPreview() {
      if (!path) {
        setResolvedUrl(fallbackUrl ?? "")
        setError(fallbackUrl ? "" : "Preview unavailable.")
        return
      }

      if (!user) {
        setResolvedUrl("")
        setError("Sign in to preview this file.")
        return
      }

      setLoading(true)
      setError("")

      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/media/file?path=${encodeURIComponent(path)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Preview failed")
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)

        if (active) {
          setResolvedUrl(objectUrl)
        }
      } catch {
        if (active) {
          setResolvedUrl(fallbackUrl ?? "")
          setError(fallbackUrl ? "" : "Could not load the preview.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      active = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [fallbackUrl, open, path, user])

  if (!path && !fallbackUrl) return null

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex h-8 rounded-full border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-primary hover:bg-white/[0.08]"
      >
        <Eye className="h-3.5 w-3.5" />
        Preview file
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-white/10 bg-[#121214] p-0 text-foreground">
          <DialogHeader className="border-b border-white/10 px-6 py-4">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-auto p-6">
            {loading ? (
              <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm text-muted-foreground">
                Loading preview...
              </div>
            ) : resolvedUrl ? (
              kind === "image" ? (
                <img
                  src={resolvedUrl}
                  alt={title}
                  className="mx-auto max-h-[70vh] w-auto rounded-2xl object-contain"
                />
              ) : (
                <iframe
                  title={title}
                  src={resolvedUrl}
                  className="h-[70vh] w-full rounded-2xl border border-white/10 bg-white"
                />
              )
            ) : (
              <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm text-muted-foreground">
                {error || "Preview unavailable."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
