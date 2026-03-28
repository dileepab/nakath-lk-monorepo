"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { ArrowLeft, LoaderCircle, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useAuth } from "@/components/auth-provider"
import { AstrologyBackground } from "@/components/astrology-background"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { getReceivedMatches, getSentMatches } from "@/lib/match-api"
import { subscribeToMessages, sendMessage } from "@/lib/chat-api"
import { type MatchRequest, type ChatMessage } from "@acme/core"

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [matches, setMatches] = useState<MatchRequest[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  
  const [activeMatch, setActiveMatch] = useState<MatchRequest | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/auth?redirectTo=%2Fmessages")
      return
    }

    let cancelled = false
    Promise.all([
      getReceivedMatches(user.uid),
      getSentMatches(user.uid)
    ]).then(([received, sent]) => {
      if (cancelled) return
      const allApproved = [...received, ...sent].filter(m => m.status === "approved")
      setMatches(allApproved)
      setLoadingMatches(false)
    })

    return () => { cancelled = true }
  }, [authLoading, user, router])

  // Subscribe to active match messages
  useEffect(() => {
    if (!activeMatch) {
      setMessages([])
      return
    }
    const unsubscribe = subscribeToMessages(activeMatch.id, (msgs) => {
      setMessages(msgs)
    })
    return () => unsubscribe()
  }, [activeMatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !user || !activeMatch) return
    
    // Store locally to clear input instantly
    const textToSend = inputText
    setInputText("")
    
    await sendMessage(activeMatch.id, user.uid, textToSend)
  }

  if (authLoading || loadingMatches) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
        <AstrologyBackground />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading conversations...
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-[#F9F9F7]">
      <AstrologyBackground />

      <section className="relative z-10 px-6 pb-16 pt-10 md:px-12 lg:px-20 h-screen flex flex-col">
        <div className="mx-auto w-full max-w-7xl flex flex-col h-full">
          <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
            <Button variant="ghost" asChild className="w-fit rounded-full border border-white/10 bg-white/[0.04]">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">Private Messages</Badge>
          </div>

          <div className="mt-8 flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-8">
            {/* Conversations List */}
            <Card className="flex flex-col border-white/10 bg-[#121214]/90 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:w-1/3 shrink-0 h-[300px] lg:h-full overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h3 className="font-semibold text-lg text-foreground">Approved Matches</h3>
              </div>
              <div className="p-3 overflow-y-auto flex-1 space-y-2">
                {matches.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-3 text-center">No approved matches yet.</p>
                ) : (
                  matches.map(m => {
                    const isOtherUser = user?.uid === m.senderId ? m.receiverId : m.senderId
                    return (
                      <button 
                        key={m.id}
                        onClick={() => setActiveMatch(m)}
                        className={`w-full text-left p-4 rounded-2xl transition-all ${
                          activeMatch?.id === m.id 
                          ? "bg-primary/20 border-primary/30" 
                          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                        } border`}
                      >
                        <p className="font-semibold text-sm">User ({isOtherUser.slice(-4)})</p>
                        <p className="text-xs text-muted-foreground mt-1">Matched</p>
                      </button>
                    )
                  })
                )}
              </div>
            </Card>

            {/* Chat Interface */}
            {activeMatch ? (
              <motion.div 
                key="chat-window"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 min-h-0 flex flex-col"
              >
                <Card className="flex-1 flex flex-col border-white/10 bg-[#121214]/90 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Chatting with User ({(user?.uid === activeMatch.senderId ? activeMatch.receiverId : activeMatch.senderId).slice(-4)})
                      </h3>
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Encrypted Connection
                      </p>
                    </div>
                  </div>
                  
                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <AnimatePresence>
                      {messages.map(msg => {
                        const isMe = msg.senderId === user?.uid
                        return (
                          <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                              isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white/[0.08] text-foreground rounded-tl-sm border border-white/10"
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input Box */}
                  <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">
                    <form onSubmit={handleSend} className="flex items-center gap-3">
                      <Input 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-white/[0.05] border-white/10 h-12 rounded-full px-5"
                      />
                      <Button type="submit" disabled={!inputText.trim()} className="h-12 w-12 rounded-full p-0 shrink-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Send className="h-5 w-5 ml-1" />
                      </Button>
                    </form>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                 <div className="h-16 w-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                   <Send className="h-6 w-6 text-muted-foreground" />
                 </div>
                 <p className="text-muted-foreground font-medium">Select a match to start messaging</p>
                 <p className="text-xs text-muted-foreground/60 mt-2">Messages are secured and private</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
