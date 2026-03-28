"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged, signOut } from "firebase/auth"

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase-client"

type AuthContextValue = {
  user: User | null
  loading: boolean
  configured: boolean
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [configured])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      signOutUser: async () => {
        if (!configured) return
        await signOut(getFirebaseAuth())
      },
    }),
    [configured, loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
