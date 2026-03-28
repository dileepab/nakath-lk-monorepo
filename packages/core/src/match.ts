export type MatchStatus = "pending" | "approved" | "rejected" | "withdrawn"

export interface MatchRequest {
  id: string
  senderId: string
  receiverId: string
  status: MatchStatus
  createdAt: number // Use Unix timestamp for easy cross-platform sorting
  updatedAt?: number
}
