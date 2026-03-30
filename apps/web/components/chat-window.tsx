"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, LoaderCircle, Sparkles, Video, PhoneOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { type MatchRequest, type ChatMessage } from "@acme/core"
import { subscribeToMessages, sendMessage } from "@/lib/chat-api"

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
}: {
  activeMatch: MatchRequest
  currentUserId: string
  otherDisplayName?: string
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  
  const [loadingIcebreakers, setLoadingIcebreakers] = useState(false)
  const [icebreakers, setIcebreakers] = useState<string[]>([])
  const [videoActive, setVideoActive] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeToMessages(activeMatch.id, (msgs) => {
      setMessages(msgs)
    })
    return () => unsubscribe()
  }, [activeMatch.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent, manualText?: string) => {
    e?.preventDefault()
    const textToSend = manualText || inputText
    if (!textToSend.trim() || !user) return
    
    setInputText("")
    setIcebreakers([]) // clear suggestions once they speak
    const idToken = await user.getIdToken()
    await sendMessage(idToken, activeMatch.id, textToSend)
  }

  const generateIcebreakers = async () => {
    if (!user) return

    setLoadingIcebreakers(true)
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
    } finally {
      setLoadingIcebreakers(false)
    }
  }

  const isOtherUser = currentUserId === activeMatch.senderId ? activeMatch.receiverId : activeMatch.senderId
  const chatTitle = otherDisplayName || "your match"

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
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] lg:max-w-[75%] px-4 py-3 rounded-2xl ${
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
        
        {/* Icebreakers injection (Only if chat is absolutely empty) */}
        {messages.length === 0 && icebreakers.length === 0 && !loadingIcebreakers && (
           <div className="px-5 pb-2">
              <Button 
                onClick={generateIcebreakers} 
                variant="outline" 
                className="w-full rounded-2xl h-12 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary border-dashed font-medium"
              >
                 <Sparkles className="h-4 w-4 mr-2" /> Generate Auspicious Icebreakers
              </Button>
           </div>
        )}

        {loadingIcebreakers && (
           <div className="px-5 pb-4 flex justify-center">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                 <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                 Analyzing profiles for commonalities...
              </p>
           </div>
        )}

        {icebreakers.length > 0 && messages.length === 0 && (
           <div className="px-5 pb-4 grid gap-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 ml-1">AI Suggestions</p>
              {icebreakers.map((ib, i) => (
                <motion.button 
                  key={i} 
                  initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} transition={{delay: i * 0.1}}
                  onClick={() => handleSend(null as any, ib)}
                  className="text-left p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm text-foreground/90 leading-relaxed transition-all"
                >
                  {ib}
                </motion.button>
              ))}
           </div>
        )}

        {/* Input Box */}
        <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <Input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="bg-white/[0.05] border-white/10 h-12 rounded-full px-5"
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
