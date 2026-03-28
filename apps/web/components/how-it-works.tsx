import { FileText, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: ShieldCheck,
    eyebrow: "Verify identity first",
    title: "Confirm who you are before your profile opens up",
    description:
      "A modern matrimony product needs a cleaner trust layer than open social browsing. NIC and selfie checks should happen early, not after people have already invested time.",
    proof: "NIC upload, selfie match, review status",
  },
  {
    number: "02",
    icon: FileText,
    eyebrow: "Build a real biodata",
    title: "Create a profile families can actually share",
    description:
      "The biodata should be a first-class part of the product, not an afterthought. It needs to look good on screen, export cleanly to PDF, and work for both individuals and parents.",
    proof: "Professional PDF, not a plain form dump",
  },
  {
    number: "03",
    icon: Sparkles,
    eyebrow: "Review fit early",
    title: "See Porondam and preferences before awkward back-and-forth",
    description:
      "Astrology should provide quick context alongside age, location, profession, migration preferences, and other practical filters. It should help people decide whether to continue.",
    proof: "Instant compatibility, values, and practical fit",
  },
  {
    number: "04",
    icon: MessageCircleMore,
    eyebrow: "Unlock gradually",
    title: "Reveal more only when both sides are ready",
    description:
      "Privacy is not just a feature card. It should shape the whole flow: softened photos by default, controlled details, and a clear next step from interest request to family introduction.",
    proof: "Blur until approved, then open the introduction",
  },
]

export function HowItWorks() {
  return (
    <section id="process" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            Product Flow
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            From first profile view to a family-safe introduction
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            This section should make the product feel organized and credible. It explains how trust, astrology,
            biodata sharing, and privacy fit into one clean flow.
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">What this fixes</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
              <li className="border-l border-primary/30 pl-4">Moves the landing page away from “luxury template” energy.</li>
              <li className="border-l border-primary/30 pl-4">Shows that privacy and verification are product behaviors, not marketing words.</li>
              <li className="border-l border-primary/30 pl-4">Makes the roadmap feel visible in the UI: biodata, Porondam, verification, and controlled introductions.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-primary">{step.number}</span>
                    <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{step.eyebrow}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                  <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-medium text-foreground">
                    {step.proof}
                  </div>
                </div>
              </div>
            </article>
          ))}

          <div className="rounded-[28px] border border-primary/15 bg-primary/10 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Positioning note</p>
            <p className="mt-3 text-sm leading-7 text-foreground">
              Keep the celestial cues in the atmosphere, not in the product logic. The app should feel trustworthy first,
              cultural second, and decorative third.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
