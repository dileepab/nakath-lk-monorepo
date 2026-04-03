"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { requestNotificationPermission } from "@/lib/notifications"
import { motion, AnimatePresence } from "framer-motion"

export function NotificationPrompt({ userId }: { userId: string }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setShowPrompt(false)
      return
    }

    // Check if permission is already granted or denied
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        // Only show if the user hasn't made a choice yet and hasn't dismissed our custom prompt
        const dismissed = localStorage.getItem("notification-prompt-dismissed")
        if (!dismissed) {
          setShowPrompt(true)
        }
      }
    }
  }, [userId])

  const handleEnable = async () => {
    setLoading(true)
    const token = await requestNotificationPermission(userId)
    if (token) {
      setShowPrompt(false)
    }
    setLoading(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("notification-prompt-dismissed", "true")
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="mb-6"
      >
        <Card className="border-primary/20 bg-primary/5 shadow-lg backdrop-blur-xl relative overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-white/10 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-foreground">Enable Push Notifications</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Get match updates, Poya reminders, Avurudu nekath alerts, and optional Rahu kalaya starts even when
                you're offline.
              </p>
            </div>
            <Button 
              onClick={handleEnable} 
              disabled={loading}
              className="rounded-full bg-primary px-6 h-10 font-semibold text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {loading ? "Enabling..." : "Enable now"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
