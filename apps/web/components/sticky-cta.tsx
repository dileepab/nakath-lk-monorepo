"use client"

import { useEffect, useState } from "react"
import { FileText, LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.55)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="border-t border-white/10 bg-[#0d0d0f]/90 px-6 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-foreground">Start with the biodata. Reveal more only when it makes sense.</p>
            <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
              <LockKeyhole className="h-4 w-4 text-primary" />
              Trust-first launch direction for Nakath.lk
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-11 rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <a href="/biodata">
                Create Bio-Data
                <FileText className="h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 hidden lg:flex rounded-full border-white/15 bg-white/5 text-foreground hover:bg-white/10"
            >
              <a href="/profiles">Browse profiles</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 rounded-full border-white/15 bg-white/5 text-foreground hover:bg-white/10"
            >
              <a href="/dashboard">Dashboard</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
