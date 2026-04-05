export type MatchStatus = "pending" | "approved" | "rejected" | "withdrawn"

export interface MatchReadState {
  lastReadAt?: number
  seenAt?: number
  readMessageCount?: number
}

export interface MatchRequest {
  id: string
  senderId: string
  receiverId: string
  status: MatchStatus
  createdAt: number // Use Unix timestamp for easy cross-platform sorting
  updatedAt?: number
  lastMessageAt?: number
  lastMessageSenderId?: string
  lastMessagePreview?: string
  messageCounts?: Record<string, number | undefined>
  readStates?: Record<string, MatchReadState | undefined>
}
