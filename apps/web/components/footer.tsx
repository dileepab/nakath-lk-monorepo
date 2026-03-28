import { Star } from "lucide-react"

const exploreLinks = [
  { label: "Start biodata builder", href: "/biodata" },
  { label: "Trust architecture", href: "#trust" },
  { label: "Product flow", href: "#process" },
  { label: "Privacy preview", href: "#privacy" },
]

const audienceTags = ["Individuals", "Parents", "Sri Lanka", "Diaspora"]

export function Footer() {
  return (
    <footer className="relative z-10 px-6 pb-10 pt-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-white/[0.035] p-8 backdrop-blur-xl">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                <Star className="h-5 w-5 fill-primary text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-foreground">Sanhinda</p>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Verified Sri Lankan Matrimony</p>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              The stronger direction for this landing page is simple: make the product feel credible, culturally aware,
              and calm enough for real introductions.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {audienceTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Explore</h4>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-foreground transition-colors hover:text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Launch focus</h4>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-foreground">
              <li>Professional biodata PDFs as the acquisition hook.</li>
              <li>Instant Porondam with cleaner product framing.</li>
              <li>Verification and privacy as the strongest trust signals.</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2026 Sanhinda. Prototype direction for the launch landing page.</p>
          <p>Premium in tone, disciplined in product behavior.</p>
        </div>
      </div>
    </footer>
  )
}
