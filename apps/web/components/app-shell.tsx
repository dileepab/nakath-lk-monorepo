"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { LogOut, Star } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getActiveAppNavKey,
  getProtectedHref,
  isAppChromeRoute,
  primaryAppNav,
  reviewerNavItem,
  type AppNavItem,
} from "@/lib/app-navigation"

type ReviewSessionPayload = {
  access?: boolean
}

function displayNameFromUser(email: string | null | undefined, displayName: string | null | undefined) {
  if (displayName?.trim()) return displayName.trim()
  if (email?.trim()) return email.split("@")[0]
  return "Account"
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOutUser } = useAuth()
  const [hasReviewAccess, setHasReviewAccess] = useState(false)

  const showChrome = isAppChromeRoute(pathname)
  const activeKey = getActiveAppNavKey(pathname)

  useEffect(() => {
    if (!showChrome || loading || !user) {
      setHasReviewAccess(false)
      return
    }

    const currentUser = user
    let cancelled = false

    async function loadReviewAccess() {
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch("/api/review/session", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          if (!cancelled) setHasReviewAccess(false)
          return
        }

        const payload = (await response.json()) as ReviewSessionPayload
        if (!cancelled) {
          setHasReviewAccess(Boolean(payload.access))
        }
      } catch {
        if (!cancelled) {
          setHasReviewAccess(false)
        }
      }
    }

    void loadReviewAccess()

    return () => {
      cancelled = true
    }
  }, [loading, showChrome, user])

  const navItems = useMemo(() => {
    const nextItems = [...primaryAppNav]
    if (hasReviewAccess) {
      nextItems.push(reviewerNavItem)
    }
    return nextItems
  }, [hasReviewAccess])

  async function handleSignOut() {
    await signOutUser()
    router.push("/")
  }

  function resolvedHref(item: AppNavItem) {
    if (item.key === "review" && !user) return getProtectedHref(item.href)
    if ((item.key === "dashboard" || item.key === "messages" || item.key === "biodata" || item.key === "settings") && !user) {
      return getProtectedHref(item.href)
    }
    return item.href
  }

  if (!showChrome) {
    return <>{children}</>
  }

  const accountLabel = displayNameFromUser(user?.email, user?.displayName)

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0B0C]/88 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Star className="h-5 w-5 fill-primary text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">Nakath.lk</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Trust-first matrimony</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const isActive = activeKey === item.key
              const Icon = item.icon

              return (
                <Link
                  key={item.key}
                  href={resolvedHref(item)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
                    isActive
                      ? "border-primary/40 bg-primary/15 text-primary shadow-[0_14px_35px_rgba(212,175,55,0.12)]"
                      : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 md:block">
                  {accountLabel}
                </div>
                <Button
                  variant="outline"
                  onClick={() => void handleSignOut()}
                  className="rounded-full border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
              >
                <Link href={getProtectedHref("/dashboard")}>Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="pb-24 md:pb-0">{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0B0B0C]/92 px-3 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2">
          {primaryAppNav.map((item) => {
            const Icon = item.icon
            const isActive = activeKey === item.key

            return (
              <Link
                key={item.key}
                href={resolvedHref(item)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] transition-all",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-white/[0.03] text-white/65 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label.replace("My ", "")}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
