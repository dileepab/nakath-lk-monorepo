const galaxyDust = [
  { x: 12, y: 18, size: 4, opacity: 0.5, accent: false },
  { x: 18, y: 23, size: 6, opacity: 0.9, accent: true },
  { x: 24, y: 14, size: 5, opacity: 0.55, accent: false },
  { x: 29, y: 26, size: 4, opacity: 0.45, accent: false },
  { x: 34, y: 19, size: 8, opacity: 0.95, accent: true },
  { x: 39, y: 24, size: 3, opacity: 0.4, accent: false },
  { x: 43, y: 16, size: 5, opacity: 0.65, accent: false },
  { x: 48, y: 22, size: 7, opacity: 0.85, accent: true },
  { x: 54, y: 17, size: 4, opacity: 0.45, accent: false },
  { x: 58, y: 25, size: 5, opacity: 0.5, accent: false },
  { x: 62, y: 20, size: 6, opacity: 0.7, accent: true },
  { x: 68, y: 15, size: 4, opacity: 0.42, accent: false },
]

const distantBodies = [
  { x: 72, y: 18, size: 12, color: "rgba(149, 126, 255, 0.22)" },
  { x: 84, y: 62, size: 10, color: "rgba(110, 192, 255, 0.16)" },
  { x: 18, y: 74, size: 8, color: "rgba(212, 175, 55, 0.12)" },
]

const planets = [
  {
    name: "Mercury",
    orbit: 68,
    size: 5,
    angle: 18,
    duration: 11,
    ellipseScale: 0.76,
    background:
      "radial-gradient(circle at 35% 35%, rgba(223, 210, 190, 0.95) 0%, rgba(154, 141, 125, 0.92) 58%, rgba(99, 91, 81, 0.9) 100%)",
    shadow: "0 0 10px rgba(191, 178, 160, 0.28)",
  },
  {
    name: "Venus",
    orbit: 98,
    size: 8,
    angle: 122,
    duration: 17,
    ellipseScale: 0.8,
    background:
      "radial-gradient(circle at 30% 30%, rgba(244, 214, 156, 0.98) 0%, rgba(219, 175, 104, 0.94) 62%, rgba(165, 118, 58, 0.88) 100%)",
    shadow: "0 0 14px rgba(218, 178, 117, 0.34)",
  },
  {
    name: "Earth",
    orbit: 132,
    size: 9,
    angle: 226,
    duration: 24,
    ellipseScale: 0.74,
    background:
      "radial-gradient(circle at 35% 32%, rgba(133, 197, 255, 0.98) 0%, rgba(77, 146, 214, 0.94) 46%, rgba(64, 140, 92, 0.9) 68%, rgba(34, 74, 130, 0.88) 100%)",
    shadow: "0 0 16px rgba(113, 177, 237, 0.34)",
  },
  {
    name: "Mars",
    orbit: 166,
    size: 6,
    angle: 300,
    duration: 32,
    ellipseScale: 0.79,
    background:
      "radial-gradient(circle at 30% 30%, rgba(244, 171, 124, 0.96) 0%, rgba(198, 92, 62, 0.94) 60%, rgba(120, 40, 32, 0.88) 100%)",
    shadow: "0 0 12px rgba(210, 106, 74, 0.28)",
  },
  {
    name: "Jupiter",
    orbit: 208,
    size: 20,
    angle: 74,
    duration: 54,
    ellipseScale: 0.72,
    background:
      "linear-gradient(180deg, rgba(232, 199, 152, 0.98) 0%, rgba(203, 153, 98, 0.94) 24%, rgba(168, 116, 77, 0.94) 44%, rgba(220, 184, 136, 0.96) 66%, rgba(145, 93, 67, 0.9) 100%)",
    shadow: "0 0 22px rgba(214, 170, 121, 0.34)",
  },
  {
    name: "Saturn",
    orbit: 250,
    size: 15,
    angle: 316,
    duration: 72,
    ellipseScale: 0.68,
    background:
      "linear-gradient(180deg, rgba(236, 215, 169, 0.98) 0%, rgba(203, 173, 117, 0.96) 52%, rgba(162, 130, 88, 0.9) 100%)",
    shadow: "0 0 18px rgba(214, 188, 137, 0.3)",
    ring: true,
  },
]

const orbitKeyframes = planets
  .map((planet, index) => {
    const frames = Array.from({ length: 25 }, (_, step) => {
      const progress = step / 24
      const angle = ((planet.angle + progress * 360) * Math.PI) / 180
      const x = Math.cos(angle) * planet.orbit
      const y = Math.sin(angle) * planet.orbit * planet.ellipseScale
      const percent = (progress * 100).toFixed(2)

      return `${percent}% { transform: translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px); }`
    }).join("\n")

    return `@keyframes orbit-${index} {\n${frames}\n}`
  })
  .join("\n")

export function AstrologyBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0B0B0C]">
      <style>{`
        @keyframes galaxy-drift {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-14deg) scale(1); }
          50% { transform: translate3d(10px, -6px, 0) rotate(-12deg) scale(1.03); }
        }
        @keyframes solar-breathe {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.78; }
          50% { transform: translate3d(-4px, 3px, 0) scale(1.02); opacity: 0.9; }
        }
        ${orbitKeyframes}
      `}</style>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 16% 18%, rgba(212, 175, 55, 0.18), transparent 26%), radial-gradient(circle at 78% 22%, rgba(93, 14, 17, 0.22), transparent 22%), radial-gradient(circle at 52% 108%, rgba(212, 175, 55, 0.08), transparent 34%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0.03), transparent 28%, transparent 72%, rgba(255, 255, 255, 0.015))",
        }}
      />

      <div className="absolute left-[-12rem] top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-primary/12 blur-[130px]" />
      <div className="absolute right-[-10rem] top-[2rem] h-[20rem] w-[20rem] rounded-full bg-accent/18 blur-[130px]" />
      <div className="absolute bottom-[-8rem] left-[35%] h-[18rem] w-[18rem] rounded-full bg-primary/8 blur-[120px]" />

      {distantBodies.map((body, index) => (
        <div
          key={index}
          className="absolute rounded-full blur-xl"
          style={{
            left: `${body.x}%`,
            top: `${body.y}%`,
            width: `${body.size}rem`,
            height: `${body.size}rem`,
            transform: "translate(-50%, -50%)",
            background: body.color,
          }}
        />
      ))}

      <div
        className="absolute left-[-2%] top-[7%] h-[23rem] w-[40rem] rounded-full opacity-75"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(250, 244, 220, 0.24) 0%, rgba(212, 175, 55, 0.16) 14%, rgba(110, 130, 255, 0.1) 32%, rgba(93, 14, 17, 0.06) 46%, transparent 72%)",
          filter: "blur(16px)",
          animation: "galaxy-drift 24s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-[9%] top-[13%] h-[15rem] w-[26rem] rounded-full opacity-65"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(248, 246, 236, 0.3) 0%, rgba(212, 175, 55, 0.12) 14%, rgba(93, 14, 17, 0.06) 30%, transparent 62%)",
          filter: "blur(12px)",
          animation: "galaxy-drift 18s ease-in-out infinite reverse",
        }}
      />
      <div className="absolute left-[23%] top-[17%] h-7 w-7 rounded-full bg-[#f7f0d5]/75 blur-md" />

      {galaxyDust.map((particle, index) => {
        const glow = particle.accent
          ? "0 0 14px rgba(212, 175, 55, 0.7)"
          : "0 0 12px rgba(249, 249, 247, 0.45)"

        return (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: "translate(-50%, -50%)",
              background: particle.accent ? "rgba(212, 175, 55, 0.92)" : "rgba(249, 249, 247, 0.74)",
              opacity: particle.opacity,
              boxShadow: glow,
            }}
          />
        )
      })}

      <div
        className="absolute right-[4%] top-[10%] h-[31rem] w-[31rem] opacity-80"
        style={{ animation: "solar-breathe 20s ease-in-out infinite" }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, rgba(255, 247, 207, 1) 0%, rgba(212, 175, 55, 0.96) 32%, rgba(191, 112, 42, 0.9) 62%, rgba(191, 112, 42, 0.1) 100%)",
            boxShadow: "0 0 30px rgba(212, 175, 55, 0.54), 0 0 68px rgba(212, 175, 55, 0.22)",
          }}
        />

        <div className="absolute left-1/2 top-1/2 h-[12rem] w-[12rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-3xl" />

        {planets.map((planet, index) => {
          const wrapperSize = planet.ring ? planet.size + 14 : planet.size

          return (
            <div
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{
                width: `${wrapperSize}px`,
                height: `${wrapperSize}px`,
                animation: `orbit-${index} ${planet.duration}s linear infinite`,
                willChange: "transform",
              }}
              aria-label={planet.name}
            >
              {planet.ring ? (
                <div
                  className="absolute left-1/2 top-1/2 h-[2px] rounded-full"
                  style={{
                    width: `${planet.size + 12}px`,
                    background: "rgba(207, 186, 147, 0.58)",
                    transform: "translate(-50%, -50%) rotate(18deg)",
                    boxShadow: "0 0 8px rgba(207, 186, 147, 0.2)",
                  }}
                />
              ) : null}
              <div
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: `${planet.size}px`,
                  height: `${planet.size}px`,
                  transform: "translate(-50%, -50%)",
                  background: planet.background,
                  boxShadow: planet.shadow,
                }}
              />
            </div>
          )
        })}

      </div>
    </div>
  )
}
