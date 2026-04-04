"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, LoaderCircle, Sparkles, Video, PhoneOff, MessageSquareHeart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import { type MatchRequest, type ChatMessage, type ProfileDraft } from "@acme/core"
import { markMatchRead, subscribeToMatch, subscribeToMessages, sendMessage } from "@/lib/chat-api"
import { buildGuidedFollowUps, shouldShowGuidedFollowUps } from "@/lib/chat-followups"
import { buildGuidedStarters } from "@/lib/chat-starters"

/**
 * MOCK LiveKit components so the frontend compiles even if the full setup isn't done.
 * Real LiveKit usually imports from "@livekit/components-react"
 */
function FamilyVideoRoom({ matchId, onClose }: { matchId: string, onClose: () => void }) {
  const [invited, setInvited] = useState(false)

  return (
    <div className="w-full h-64 lg:h-full lg:w-96 border-l border-white/10 bg-[#121214]/90 flex flex-col pt-4">
      <div className="flex-1 px-4 flex flex-col gap-3 h-full mb-4 overflow-y-auto">
         <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <p className="text-sm font-semibold tracking-tight text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              WebRTC E-Meet Active
            </p>
         </div>

         {/* Simulated Grid */}
         <div className="flex-1 grid grid-cols-2 lg:grid-cols-1 gap-3">
             <div className="bg-black/40 rounded-xl border border-white/10 flex items-center justify-center relative shadow-inner overflow-hidden min-h-24">
                <p className="text-xs font-semibold text-muted-foreground z-10">You</p>
                <div className="absolute inset-0 bg-white/[0.02]"></div>
             </div>
             <div className="bg-black/40 rounded-xl border border-white/10 flex items-center justify-center relative shadow-inner overflow-hidden min-h-24">
                <p className="text-xs font-semibold text-muted-foreground z-10">Match</p>
                <div className="absolute inset-0 bg-white/[0.02]"></div>
             </div>
             {invited && (
               <>
                 <motion.div initial={{opacity:0, scale: 0.9}} animate={{opacity:1, scale:1}} className="bg-black/40 rounded-xl border border-yellow-500/20 flex items-center justify-center relative min-h-24">
                    <p className="text-xs font-semibold text-yellow-500/80 z-10">Your Parents</p>
                 </motion.div>
                 <motion.div initial={{opacity:0, scale: 0.9}} animate={{opacity:1, scale:1}} className="bg-black/40 rounded-xl border border-yellow-500/20 flex items-center justify-center relative min-h-24">
                    <p className="text-xs font-semibold text-yellow-500/80 z-10">Their Parents</p>
                 </motion.div>
               </>
             )}
         </div>

         <div className="shrink-0 flex gap-2">
            {!invited && (
              <Button onClick={() => setInvited(true)} variant="outline" className="flex-1 h-9 rounded-lg border-white/10 bg-white/[0.04] text-xs">
                Invite Parents Link
              </Button>
            )}
            <Button onClick={onClose} variant="destructive" className="flex-1 h-9 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs">
              <PhoneOff className="h-4 w-4 mr-2"/> Leave Room
            </Button>
         </div>
      </div>
    </div>
  )
}


export function ChatWindow({
  activeMatch,
  currentUserId,
  otherDisplayName,
  otherProfile,
}: {
  activeMatch: MatchRequest
  currentUserId: string
  otherDisplayName?: string
  otherProfile?: ProfileDraft | null
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [matchState, setMatchState] = useState<MatchRequest>(activeMatch)
  const [inputText, setInputText] = useState("")
  
  const [loadingIcebreakers, setLoadingIcebreakers] = useState(false)
  const [icebreakers, setIcebreakers] = useState<string[]>([])
  const [icebreakerError, setIcebreakerError] = useState<string | null>(null)
  const [videoActive, setVideoActive] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastReadRequestRef = useRef(0)
  const guidedStarters = useMemo(() => buildGuidedStarters(otherProfile), [otherProfile])
  const guidedFollowUps = useMemo(
    () => buildGuidedFollowUps(otherProfile, messages, currentUserId),
    [currentUserId, messages, otherProfile],
  )

  useEffect(() => {
    const unsubscribe = subscribeToMessages(activeMatch.id, (msgs) => {
      setMessages(msgs)
    })
    return () => unsubscribe()
  }, [activeMatch.id])

  useEffect(() => {
    setMatchState(activeMatch)
    const unsubscribe = subscribeToMatch(activeMatch.id, (match) => {
      if (match) {
        setMatchState(match)
      }
    })
    return () => unsubscribe()
  }, [activeMatch])

  useEffect(() => {
    setIcebreakers([])
    setIcebreakerError(null)
    setInputText("")
    lastReadRequestRef.current = 0
  }, [activeMatch.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const otherUserId = currentUserId === matchState.senderId ? matchState.receiverId : matchState.senderId
  const myReadAt = matchState.readStates?.[currentUserId]?.lastReadAt ?? 0
  const otherReadAt = matchState.readStates?.[otherUserId]?.lastReadAt ?? 0
  const latestOutgoingMessageId = [...messages].reverse().find((message) => message.senderId === currentUserId)?.id ?? null

  useEffect(() => {
    if (!user || messages.length === 0) return

    const latestIncomingAt =
      [...messages].reverse().find((message) => message.senderId !== currentUserId)?.createdAt ?? null

    if (!latestIncomingAt) return

    const effectiveReadAt = Math.max(myReadAt, lastReadRequestRef.current)
    if (latestIncomingAt <= effectiveReadAt) return

    lastReadRequestRef.current = latestIncomingAt

    void user
      .getIdToken()
      .then((idToken) => markMatchRead(idToken, activeMatch.id, latestIncomingAt))
      .catch(() => {
        lastReadRequestRef.current = myReadAt
      })
  }, [activeMatch.id, currentUserId, messages, myReadAt, user])

  const submitMessage = async (manualText?: string) => {
    const textToSend = manualText || inputText
    if (!textToSend.trim() || !user) return
    
    setInputText("")
    setIcebreakers([])
    const idToken = await user.getIdToken()
    await sendMessage(idToken, activeMatch.id, textToSend)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitMessage()
  }

  function handleUseStarter(text: string) {
    setInputText(text)
  }

  const generateIcebreakers = async () => {
    if (!user) return

    setLoadingIcebreakers(true)
    setIcebreakerError(null)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/chat/icebreakers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ matchId: activeMatch.id })
      })

      if (!res.ok) {
        throw new Error("Could not generate icebreakers.")
      }

      const data = await res.json()
      if (data.icebreakers) {
        setIcebreakers(data.icebreakers)
      }
    } catch (e) {
      console.error(e)
      setIcebreakerError("Tailored starters are unavailable right now. You can still use the guided starters below.")
    } finally {
      setLoadingIcebreakers(false)
    }
  }

  const chatTitle = otherDisplayName || "your match"
  const showGuidedStart = messages.length === 0
  const showGuidedFollowUps = shouldShowGuidedFollowUps(messages, currentUserId)

  return (
    <motion.div 
      key="chat-window"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 min-h-0 flex flex-col lg:flex-row shadow-[0_28px_90px_rgba(0,0,0,0.28)]"
    >
      <Card className="flex-1 flex flex-col border-white/10 bg-[#121214]/90 backdrop-blur-xl overflow-hidden rounded-r-none lg:rounded-r-2xl border-r-0 lg:border-r">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div>
            <h3 className="font-semibold text-foreground">
              Chatting with {chatTitle}
            </h3>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              Encrypted Connection
            </p>
          </div>
          {!videoActive && (
            <Button 
               variant="outline" 
               onClick={() => setVideoActive(true)}
               className="rounded-full h-9 px-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
            >
              <Video className="h-4 w-4 mr-2" /> Family E-Meet
            </Button>
          )}
        </div>
        
        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence>
            {messages.map(msg => {
              const isMe = msg.senderId === currentUserId
              const isLatestOutgoingMessage = msg.id === latestOutgoingMessageId
              const showSeenState = isMe && isLatestOutgoingMessage
              const isSeen = showSeenState && otherReadAt >= msg.createdAt
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div>
                    <div className={`max-w-[85%] lg:max-w-[75%] px-4 py-3 rounded-2xl ${
                      isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white/[0.08] text-foreground rounded-tl-sm border border-white/10"
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {showSeenState ? (
                      <p className="mt-2 px-2 text-right text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {isSeen ? "Seen" : "Delivered"}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
        
        {showGuidedStart ? (
          <div className="border-t border-white/10 bg-black/30 px-5 py-4">
            <div className="rounded-3xl border border-primary/15 bg-primary/8 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquareHeart className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Guided first message</p>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    A short, respectful hello usually works best for the first step. Pick a starter below and adjust it before you send.
                  </p>
                </div>

                <Button
                  onClick={generateIcebreakers}
                  variant="outline"
                  disabled={loadingIcebreakers}
                  className="rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {loadingIcebreakers ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate tailored starters
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {guidedStarters.map((starter) => (
                  <button
                    key={starter.id}
                    type="button"
                    onClick={() => handleUseStarter(starter.text)}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.07]"
                  >
                    <p className="text-sm font-semibold text-foreground">{starter.label}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-primary">{starter.description}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{starter.text}</p>
                  </button>
                ))}
              </div>

              {loadingIcebreakers ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  Analyzing both profiles for a few more tailored openers...
                </div>
              ) : null}

              {icebreakerError ? (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                  {icebreakerError}
                </div>
              ) : null}

              {icebreakers.length > 0 ? (
                <div className="mt-5 grid gap-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tailored suggestions</p>
                  {icebreakers.map((icebreaker, index) => (
                    <motion.button
                      key={`${icebreaker}-${index}`}
                      type="button"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => handleUseStarter(icebreaker)}
                      className="rounded-2xl border border-white/10 bg-black/20 p-3 text-left text-sm leading-relaxed text-foreground/90 transition-colors hover:bg-white/[0.06]"
                    >
                      {icebreaker}
                    </motion.button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showGuidedFollowUps ? (
          <div className="border-t border-white/10 bg-black/25 px-5 py-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">What to ask next</p>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                The conversation is moving. Here are a few gentle follow-ups you can use or edit before sending.
              </p>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {guidedFollowUps.map((followUp) => (
                  <button
                    key={followUp.id}
                    type="button"
                    onClick={() => handleUseStarter(followUp.text)}
                    className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <p className="text-sm font-semibold text-foreground">{followUp.label}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-primary">{followUp.description}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{followUp.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Input Box */}
        <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <Textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void submitMessage()
                }
              }}
              placeholder={showGuidedStart ? "Pick a starter above or write your own first message..." : "Type a message..."}
              className="min-h-12 rounded-3xl border-white/10 bg-white/[0.05] px-4 py-3 text-sm"
            />
            <Button type="submit" disabled={!inputText.trim()} className="h-12 w-12 rounded-full p-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="h-5 w-5 ml-1" />
            </Button>
          </form>
        </div>
      </Card>

      {/* WebRTC Expandable Matrix */}
      {videoActive && (
         <FamilyVideoRoom matchId={activeMatch.id} onClose={() => setVideoActive(false)} />
      )}
    </motion.div>
  )
}
