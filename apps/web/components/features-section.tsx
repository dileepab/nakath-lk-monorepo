import { BadgeCheck, FileText, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

const pillars = [
  {
    icon: ShieldCheck,
    metric: "NIC + selfie review",
    title: "Verification before virality",
    description:
      "The product should feel curated, not noisy. Profiles earn trust before they get attention.",
    points: ["Reduce fake-profile anxiety", "Make trust visible in the very first screen"],
  },
  {
    icon: Sparkles,
    metric: "Instant 20-point Porondam",
    title: "Astrology with practical context",
    description:
      "Compatibility should sit beside real-life filters, not replace them. That feels more modern and more credible.",
    points: ["Fast initial signal", "Still leaves room for human judgment"],
  },
  {
    icon: LockKeyhole,
    metric: "Blur until approved",
    title: "Privacy that respects both families",
    description:
      "This is the strongest product differentiator. It should shape the UI more than decorative visuals do.",
    points: ["Controlled reveal of photos", "No instant dump of contact details"],
  },
]

const principles = [
  "Biodata export should feel like a polished deliverable, not a print stylesheet.",
  "The first screen should communicate trust faster than it communicates features.",
  "Parents and individuals should both understand the flow without extra explanation.",
  "Premium should come from clarity and discipline, not from stacking effects.",
]

export function FeaturesSection() {
  return (
    <section id="trust" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            Trust Architecture
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            The UI should make people feel safe before it tries to impress them
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            This version keeps the premium tone, but redirects attention toward the product’s actual differentiators:
            verification, Porondam, privacy controls, and biodata sharing.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.16)] backdrop-blur-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <pillar.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.28em] text-muted-foreground">{pillar.metric}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{pillar.description}</p>
              <ul className="mt-5 space-y-3 text-sm text-foreground">
                {pillar.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-primary/15 bg-primary/10 p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Direction for the actual app</p>
            <h3 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-foreground">
              Keep the landing page atmospheric. Make the product screens calmer and more structured.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/90">
              Cards, verification states, biodata summaries, filters, and Porondam results should feel organized and
              easy to trust. The celestial aesthetic belongs in the atmosphere, not in every component.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <p className="font-medium text-foreground">Bio-data is the hook</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  It should be visually polished enough to share on WhatsApp without editing.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-primary" />
                  <p className="font-medium text-foreground">Privacy is the moat</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The UI should repeatedly reinforce that people control who sees more.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-8 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Product principles</p>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-foreground">
              {principles.map((principle) => (
                <li key={principle} className="border-l border-primary/25 pl-4">
                  {principle}
                </li>
              ))}
            </ul>

            <Button
              asChild
              className="mt-8 h-12 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <a href="#process">See the launch flow</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
