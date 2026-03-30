"use client"

import { useEffect, useMemo, useState } from "react"

import { type ProfileAssetKind } from "@/lib/storage-store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { AspectRatio } from "@/components/ui/aspect-ratio"

const cropAspectByKind: Record<ProfileAssetKind, number> = {
  "profile-photo": 9 / 11,
  "nic-front": 1.586,
  "nic-back": 1.586,
  selfie: 1,
}

const cropCopyByKind: Record<ProfileAssetKind, { title: string; description: string }> = {
  "profile-photo": {
    title: "Adjust profile photo",
    description: "Frame the portrait the same way it appears across profile cards and biodata previews.",
  },
  "nic-front": {
    title: "Adjust NIC front",
    description: "Keep the front side centered so the review preview stays readable.",
  },
  "nic-back": {
    title: "Adjust NIC back",
    description: "Keep the back side centered so the review preview stays readable.",
  },
  selfie: {
    title: "Adjust verification selfie",
    description: "Center the face so the review preview and verification step stay consistent.",
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not load image."))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create image blob."))
          return
        }

        resolve(blob)
      },
      type,
      quality,
    )
  })
}

export function ImageEditDialog({
  open,
  file,
  kind,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  file: File | null
  kind: ProfileAssetKind | null
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => Promise<void> | void
}) {
  const [previewUrl, setPreviewUrl] = useState("")
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const cropAspect = kind ? cropAspectByKind[kind] : 1
  const copy = kind ? cropCopyByKind[kind] : cropCopyByKind["profile-photo"]

  useEffect(() => {
    if (!file || !open) {
      setPreviewUrl("")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setZoom(kind === "profile-photo" ? 1.1 : 1)
    setOffsetX(0)
    setOffsetY(0)
    setError("")

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file, kind, open])

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${offsetX * 22}%, ${offsetY * 22}%) scale(${zoom})`,
    }),
    [offsetX, offsetY, zoom],
  )

  async function handleConfirm() {
    if (!file || !previewUrl || !kind) return

    try {
      setSaving(true)
      setError("")

      const image = await loadImage(previewUrl)
      const naturalWidth = image.naturalWidth
      const naturalHeight = image.naturalHeight

      const baseWidth =
        naturalWidth / naturalHeight > cropAspect ? naturalHeight * cropAspect : naturalWidth
      const baseHeight =
        naturalWidth / naturalHeight > cropAspect ? naturalHeight : naturalWidth / cropAspect

      const cropWidth = baseWidth / zoom
      const cropHeight = baseHeight / zoom
      const maxOffsetX = Math.max(0, (naturalWidth - cropWidth) / 2)
      const maxOffsetY = Math.max(0, (naturalHeight - cropHeight) / 2)
      const sourceX = clamp(naturalWidth / 2 - cropWidth / 2 + offsetX * maxOffsetX, 0, naturalWidth - cropWidth)
      const sourceY = clamp(naturalHeight / 2 - cropHeight / 2 + offsetY * maxOffsetY, 0, naturalHeight - cropHeight)

      const outputWidth = kind === "profile-photo" ? 1080 : kind === "selfie" ? 1200 : 1600
      const outputHeight = Math.round(outputWidth / cropAspect)
      const canvas = document.createElement("canvas")
      canvas.width = outputWidth
      canvas.height = outputHeight

      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("Canvas is unavailable.")
      }

      context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)

      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg"
      const blob = await canvasToBlob(canvas, outputType)
      const extension = outputType === "image/png" ? "png" : "jpg"
      const baseName = file.name.replace(/\.[^/.]+$/, "")
      const croppedFile = new File([blob], `${baseName}.${extension}`, {
        type: outputType,
        lastModified: Date.now(),
      })

      await onConfirm(croppedFile)
      onOpenChange(false)
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Could not prepare the image.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-white/10 bg-[#121214] text-foreground">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
            <AspectRatio ratio={cropAspect}>
              <div className="relative h-full w-full overflow-hidden rounded-[22px] border border-white/10 bg-black">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt={file?.name ?? "Upload preview"}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-150"
                      style={transformStyle}
                    />
                    <div className="pointer-events-none absolute inset-0 border-[10px] border-black/35" />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Preview unavailable.
                  </div>
                )}
              </div>
            </AspectRatio>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Zoom</p>
              <Slider
                value={[zoom]}
                min={1}
                max={2.4}
                step={0.01}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
              />
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Horizontal</p>
              <Slider
                value={[offsetX]}
                min={-1}
                max={1}
                step={0.01}
                onValueChange={(value) => setOffsetX(value[0] ?? 0)}
              />
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vertical</p>
              <Slider
                value={[offsetY]}
                min={-1}
                max={1}
                step={0.01}
                onValueChange={(value) => setOffsetY(value[0] ?? 0)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-muted-foreground">
            The saved image will match this crop ratio, so profile cards and previews won’t chop the image unexpectedly later.
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={!file || saving}>
            {saving ? "Saving image..." : "Use this crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
