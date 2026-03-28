import {
  ArrowRight,
  BadgeCheck,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Verification before visibility",
    body: "NIC and selfie review create a calmer first impression.",
  },
  {
    icon: Sparkles,
    title: "Instant Porondam context",
    body: "Compatibility is visible early, without making the page feel mystical or vague.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy that respects both sides",
    body: "Photos and contact details stay controlled until interest is mutual.",
  },
]

const biodataFields = [
  ["Age", "29"],
  ["Profession", "Architect"],
  ["Location", "Colombo"],
  ["Religion", "Buddhist"],
  ["Nakath", "Rohini"],
  ["Preferred age", "27-33"],
]

export function HeroSection() {
  return (
    <section id="start" className="relative overflow-hidden px-6 pb-20 pt-28 md:px-12 lg:px-20">
      <nav className="glass fixed left-0 right-0 top-0 z-50 border-b border-white/10 px-6 py-4 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Star className="h-5 w-5 fill-primary text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-foreground">Sanhinda</p>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Sri Lankan Matrimony</p>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#trust" className="transition-colors hover:text-foreground">
              Why it feels safer
            </a>
            <a href="#process" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#privacy" className="transition-colors hover:text-foreground">
              Privacy preview
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden text-muted-foreground hover:text-foreground sm:inline-flex">
              <a href="#privacy">Privacy</a>
            </Button>
            <Button asChild className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
              <a href="/biodata">
                Start Your Bio-Data
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <BadgeCheck className="h-4 w-4" />
            Trust-first launch direction
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            A modern Sri Lankan matrimony platform built for{" "}
            <span className="bg-gradient-to-r from-primary via-[#f0d27b] to-primary bg-clip-text text-transparent">
              verified profiles
            </span>
            , thoughtful privacy, and confident first introductions.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Sanhinda should feel premium, but serious. Start with a biodata people can actually share, review
            Porondam instantly, and keep photos and contact details protected until both sides are ready.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-12 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <a href="/biodata">
                Create Your Bio-Data
                <FileText className="h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-full border-white/15 bg-white/5 px-7 text-base text-foreground hover:bg-white/10"
            >
              <a href="/profiles">Browse profile preview</a>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              No public phone numbers
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Designed for families and individuals
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Sri Lanka first, diaspora ready
            </span>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {trustPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <point.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">{point.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div
            className="rounded-[32px] border border-white/10 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03))",
            }}
          >
            <div className="rounded-[28px] border border-primary/15 bg-[#141416]/90 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Real product preview</p>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">A calmer first introduction</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Less decorative astrology. More visible proof that the product is safe, modern, and useful.
                  </p>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Verified
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Nadeesha Fernando</p>
                    <p className="mt-1 text-sm text-muted-foreground">29 • Architect • Colombo • Family-intro ready</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Match score</p>
                    <p className="text-2xl font-semibold text-primary">18/20</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#0f0f10] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Verification</p>
                    <p className="mt-2 text-base font-medium text-foreground">NIC + selfie reviewed</p>
                    <p className="mt-1 text-sm text-muted-foreground">Identity checked before profile visibility expands.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0f0f10] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Privacy mode</p>
                    <p className="mt-2 text-base font-medium text-foreground">Blur until both sides agree</p>
                    <p className="mt-1 text-sm text-muted-foreground">More detail unlocks only after mutual interest.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-[#0f0f10] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Bio-data PDF</p>
                      <p className="mt-2 text-base font-medium text-foreground">Shareable on WhatsApp and with parents</p>
                    </div>
                    <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Ready
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {biodataFields.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                        <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-primary/15 bg-primary/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary">Why it looks better</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    The landing page now previews actual product behavior instead of a decorative concept card.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Launch message</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    “Verified Sri Lankan matrimony with biodata PDFs, instant Porondam, and privacy controls.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
