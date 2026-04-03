import {
  FileText,
  LayoutDashboard,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

export type AppNavKey = "dashboard" | "browse" | "messages" | "biodata" | "settings" | "review"

export type AppNavItem = {
  key: AppNavKey
  label: string
  href: string
  icon: LucideIcon
}

export const primaryAppNav: AppNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "browse",
    label: "Browse",
    href: "/profiles",
    icon: Search,
  },
  {
    key: "messages",
    label: "Messages",
    href: "/messages",
    icon: MessageCircle,
  },
  {
    key: "biodata",
    label: "My Biodata",
    href: "/biodata",
    icon: FileText,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export const reviewerNavItem: AppNavItem = {
  key: "review",
  label: "Review",
  href: "/review",
  icon: ShieldCheck,
}

const appRoutePrefixes = ["/dashboard", "/profiles", "/profile", "/saved", "/messages", "/biodata", "/settings", "/review"]

export function isAppChromeRoute(pathname: string) {
  return appRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function getActiveAppNavKey(pathname: string): AppNavKey | null {
  if (pathname === "/dashboard") return "dashboard"
  if (pathname === "/messages") return "messages"
  if (pathname === "/settings") return "settings"
  if (pathname === "/review") return "review"

  if (pathname === "/biodata" || pathname.startsWith("/biodata/")) {
    return "biodata"
  }

  if (pathname === "/saved") {
    return "browse"
  }

  if (pathname === "/profiles" || pathname.startsWith("/profiles/") || pathname === "/profile") {
    return "browse"
  }

  return null
}

export function getProtectedHref(path: string) {
  return `/auth?redirectTo=${encodeURIComponent(path)}`
}
