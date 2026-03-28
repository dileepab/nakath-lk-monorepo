"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Moon, Sun, Clock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  formatTime,
  getCurrentAuspiciousStatus,
  getRahuKaalayaForToday,
  type AuspiciousStatus,
} from "@acme/core"

export function AuspiciousClock() {
  const [time, setTime] = useState<Date | null>(null)
  
  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) {
    return (
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl animate-pulse h-48">
        <CardContent className="flex items-center justify-center pt-8 text-muted-foreground">
          Loading Nakath details...
        </CardContent>
      </Card>
    )
  }

  const { status, message, nextTransition } = getCurrentAuspiciousStatus()
  const currentKaalaya = getRahuKaalayaForToday()

  const statusTone = {
    auspicious: "border-emerald-400/25 bg-emerald-500/12 text-emerald-100",
    inauspicious: "border-rose-400/25 bg-rose-500/12 text-rose-100",
    neutral: "border-amber-400/25 bg-amber-500/12 text-amber-100",
  }[status]

  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Badge className={cn("px-4 py-1.5 font-medium rounded-full", statusTone)}>
            {status === "auspicious" ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" />
            ) : status === "inauspicious" ? (
              <AlertCircle className="mr-2 h-4 w-4 text-rose-300" />
            ) : (
              <Sun className="mr-2 h-4 w-4 text-amber-300" />
            )}
            {status === "auspicious" ? "Good times" : status === "inauspicious" ? "Rahu Kaalaya" : "Neutral period"}
          </Badge>
          <div className="flex items-center gap-2 text-foreground/80">
            <Clock className="h-4 w-4" />
            <span className="font-mono tabular-nums leading-none tracking-tight">
              {time.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div>
          <CardTitle className="text-2xl mt-4 text-foreground">Current Status</CardTitle>
          <CardDescription className="leading-6 text-muted-foreground mt-2 max-w-sm">
            {message}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">Today's Rahu Kaalaya</p>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Start: {formatTime(currentKaalaya.start)}</p>
            <p className="text-sm font-medium text-foreground">End: {formatTime(currentKaalaya.end)}</p>
          </div>
        </div>
        
        {nextTransition && (
           <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
             <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">Next shift</p>
             <p className="text-lg font-semibold text-primary">{formatTime(nextTransition)}</p>
           </div>
        )}
      </CardContent>
    </Card>
  )
}
