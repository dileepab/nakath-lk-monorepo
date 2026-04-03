"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Copy, Download, MessageCircle, Send, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { buildBiodataShareText, buildBiodataShareTitle } from "@/lib/biodata-share"
import { cn } from "@/lib/utils"
import { type ProfileDraft } from "@acme/core"

export function BiodataSharePanel({
  draft,
  title = "Share-ready biodata",
  description = "Keep this biodata easy to pass to family without exposing more than the current privacy rules allow.",
  documentHref,
  canPrint = false,
  onPrint,
  compact = false,
  appearance = "dark",
}: {
  draft: ProfileDraft
  title?: string
  description?: string
  documentHref?: string
  canPrint?: boolean
  onPrint?: () => void
  compact?: boolean
  appearance?: "dark" | "paper"
}) {
  const [canNativeShare, setCanNativeShare] = useState(false)
  const shareText = useMemo(() => buildBiodataShareText(draft), [draft])
  const shareTitle = useMemo(() => buildBiodataShareTitle(draft), [draft])

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText)
      toast("Biodata share note copied", {
        description: "You can now paste it into WhatsApp or send it directly to family.",
      })
    } catch {
      toast("Could not copy the biodata note", {
        description: "Please try again from a browser tab with clipboard access.",
      })
    }
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer")
  }

  async function handleNativeShare() {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
      })
    } catch {
      // Ignore cancel/no-op cases from native share sheets.
    }
  }

  const isPaper = appearance === "paper"
  const panelClasses = isPaper
    ? "border-[#dccca6] bg-[#f5ead3] shadow-[0_18px_50px_rgba(91,67,22,0.08)]"
    : "border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl"
  const titleClasses = isPaper ? "text-[#2b2111]" : "text-foreground"
  const descriptionClasses = isPaper ? "text-[#6c5a39]" : "text-muted-foreground"
  const badgeClasses = isPaper
    ? "rounded-full border-[#d6c7a1] bg-[#fff8eb] px-3 py-1 text-[#6d5315]"
    : "rounded-full border-white/10 bg-white/[0.04] px-3 py-1 text-foreground"
  const subtleButtonClasses = isPaper
    ? "h-11 rounded-full border-[#d6c7a1] bg-[#fffdfa] text-[#2b2111] hover:bg-[#f7f1e3] hover:text-[#2b2111]"
    : "h-11 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
  const accentButtonClasses = isPaper
    ? "h-11 rounded-full border-[#d4b15a] bg-[#f0d791] text-[#7b5510] hover:bg-[#e8cb7c] hover:text-[#7b5510]"
    : "h-11 rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"

  const buttonRow = (
    <div className={`flex flex-col gap-3 ${compact ? "sm:flex-row sm:flex-wrap" : "sm:grid sm:grid-cols-2 xl:grid-cols-4"}`}>
      {documentHref ? (
        <Button
          asChild
          variant="outline"
          className={subtleButtonClasses}
        >
          <Link href={documentHref}>
            <Download className="h-4 w-4" />
            Open PDF view
          </Link>
        </Button>
      ) : null}

      {canPrint ? (
        <Button
          variant="outline"
          onClick={onPrint}
          className={subtleButtonClasses}
        >
          <Download className="h-4 w-4" />
          Print / Save PDF
        </Button>
      ) : null}

      <Button
        variant="outline"
        onClick={() => void handleCopy()}
        className={subtleButtonClasses}
      >
        <Copy className="h-4 w-4" />
        Copy share note
      </Button>

      <Button
        variant="outline"
        onClick={handleWhatsApp}
        className={subtleButtonClasses}
      >
        <MessageCircle className="h-4 w-4" />
        Send on WhatsApp
      </Button>

      {canNativeShare ? (
        <Button
          variant="outline"
          onClick={() => void handleNativeShare()}
          className={accentButtonClasses}
        >
          <Share2 className="h-4 w-4" />
          Open share sheet
        </Button>
      ) : null}
    </div>
  )

  if (compact) {
    return <div className="mt-4">{buttonRow}</div>
  }

  return (
    <Card className={cn(panelClasses, isPaper ? "" : "backdrop-blur-xl")}>
      <CardContent className="space-y-5 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={cn("text-sm font-semibold", titleClasses)}>{title}</p>
            <p className={cn("mt-2 text-sm leading-6", descriptionClasses)}>{description}</p>
          </div>
          <Badge variant="outline" className={badgeClasses}>
            <Send className="mr-2 h-3.5 w-3.5" />
            {draft.privacy.biodataShareMode.replace("-", " ")}
          </Badge>
        </div>

        {buttonRow}
      </CardContent>
    </Card>
  )
}
