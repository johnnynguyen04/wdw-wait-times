"use client"

import { useState, useRef, useCallback, useEffect, memo } from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  useScroll,
  useInView,
  animate,
} from "framer-motion"
import {
  Clock,
  Brain,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Telescope,
  X,
} from "lucide-react"

// ================================================================
// DATA CONSTANTS
// ================================================================

const RIDES = [
  { id: "tsm",    name: "Toy Story Mania",          park: "Hollywood Studios", avg: 54,  median: 50,  std: 30 },
  { id: "rnr",    name: "Rock 'n' Roller Coaster",  park: "Hollywood Studios", avg: 59,  median: 55,  std: 32 },
  { id: "sdd",    name: "Slinky Dog Dash",           park: "Hollywood Studios", avg: 73,  median: 70,  std: 28 },
  { id: "ass",    name: "Alien Swirling Saucers",    park: "Hollywood Studios", avg: 30,  median: 30,  std: 16 },
  { id: "sdmt",   name: "Seven Dwarfs Mine Train",   park: "Magic Kingdom",    avg: 77,  median: 70,  std: 34 },
  { id: "potc",   name: "Pirates of the Caribbean",  park: "Magic Kingdom",    avg: 29,  median: 25,  std: 18 },
  { id: "splsh",  name: "Splash Mountain",            park: "Magic Kingdom",    avg: 44,  median: 40,  std: 30 },
  { id: "fop",    name: "Flight of Passage",         park: "Animal Kingdom",   avg: 115, median: 115, std: 54 },
  { id: "navi",   name: "Na'vi River Journey",        park: "Animal Kingdom",   avg: 63,  median: 60,  std: 32 },
  { id: "ee",     name: "Expedition Everest",          park: "Animal Kingdom",   avg: 32,  median: 30,  std: 23 },
  { id: "ks",     name: "Kilimanjaro Safaris",         park: "Animal Kingdom",   avg: 40,  median: 35,  std: 29 },
  { id: "dino",   name: "DINOSAUR",                    park: "Animal Kingdom",   avg: 27,  median: 20,  std: 20 },
  { id: "soarin", name: "Soarin'",                   park: "EPCOT",            avg: 46,  median: 40,  std: 27 },
  { id: "se",     name: "Spaceship Earth",             park: "EPCOT",            avg: 19,  median: 15,  std: 15 },
] as const

const PARK_META: Record<string, { color: string; bg: string; border: string; abbrev: string }> = {
  "Hollywood Studios": { color: "#C8922A", bg: "rgba(200,146,42,0.08)",  border: "rgba(200,146,42,0.28)", abbrev: "DHS" },
  "Magic Kingdom":     { color: "#4A7FC1", bg: "rgba(74,127,193,0.08)",  border: "rgba(74,127,193,0.28)", abbrev: "MK"  },
  "Animal Kingdom":    { color: "#5A9E6F", bg: "rgba(90,158,111,0.08)",  border: "rgba(90,158,111,0.28)", abbrev: "DAK" },
  "EPCOT":             { color: "#8B6BB5", bg: "rgba(139,107,181,0.08)", border: "rgba(139,107,181,0.28)", abbrev: "EP" },
}

const DAYS = [
  { day: "Mon", avg: 51.4 },
  { day: "Tue", avg: 48.2 },
  { day: "Wed", avg: 46.6 },
  { day: "Thu", avg: 47.1 },
  { day: "Fri", avg: 48.0 },
  { day: "Sat", avg: 51.8 },
  { day: "Sun", avg: 48.8 },
]

const HOLIDAYS = [
  { name: "Spring Break",           impact: 17, period: "March – April"         },
  { name: "Christmas / New Year's", impact: 13, period: "Dec 20 – Jan 5"       },
  { name: "Summer Peak",            impact: 4,  period: "June – August"         },
  { name: "Thanksgiving",           impact: 2,  period: "Late November"         },
]

const SEASONS = [
  { name: "Winter", avg: 53.8, months: "Dec–Feb", best: false },
  { name: "Spring", avg: 51.0, months: "Mar–May", best: false },
  { name: "Summer", avg: 49.0, months: "Jun–Aug", best: false },
  { name: "Fall",   avg: 42.3, months: "Sep–Nov", best: true  },
]

const PARK_HOURLY: Record<string, Record<string, number[]>> = {
  "Hollywood Studios": {
    "Toy Story Mania":         [30,46,61,63,62,62,66,63,60,56,52,45,34,28],
    "Rock 'n' Roller Coaster": [24,42,66,73,65,65,66,66,66,60,59,56,49,39],
    "Slinky Dog Dash":         [59,79,81,84,82,81,81,79,74,70,67,61,52,47],
    "Alien Swirling Saucers":  [18,26,39,41,38,36,35,33,29,27,26,22,15,15],
  },
  "Magic Kingdom": {
    "Seven Dwarfs Mine Train":  [44,62,75,85,89,93,93,92,91,89,82,76,69,58],
    "Pirates of the Caribbean": [8,13,28,38,40,41,39,36,38,34,29,24,19,12],
    "Splash Mountain":          [10,16,36,50,58,63,61,58,61,56,49,41,33,20],
  },
  "Animal Kingdom": {
    "Flight of Passage":   [99,129,136,129,119,113,112,113,111,111,109,115,116,105],
    "Na'vi River Journey":  [27,51,70,77,77,74,72,71,68,67,64,59,55,39],
    "Expedition Everest":   [9,19,36,43,44,43,42,39,35,33,27,23,20,16],
    "Kilimanjaro Safaris":  [14,28,48,58,52,47,44,42,39,38,32,30,26,20],
    "DINOSAUR":             [8,13,26,35,38,37,38,34,30,27,23,20,18,12],
  },
  "EPCOT": {
    "Soarin'":         [16,32,57,59,56,53,51,51,49,46,42,40,32,25],
    "Spaceship Earth": [6,13,28,36,32,23,19,18,17,15,13,12,9,8],
  },
}

const HOURS_LABELS = ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM","7PM","8PM","9PM"]

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

const MONTH_FACTORS = [1.07,1.09,1.16,1.01,0.94,1.05,1.03,0.93,0.67,0.87,1.01,1.13]

const FEATURE_IMPORTANCE_RF = [
  { feature: "Attraction",     pct: 64.6 },
  { feature: "Hour of Day",    pct: 20.4 },
  { feature: "Month",          pct:  9.0 },
  { feature: "Day of Week",    pct:  4.6 },
  { feature: "Holiday Status", pct:  0.9 },
  { feature: "Weekend",        pct:  0.5 },
]

const FEATURE_IMPORTANCE_GB = [
  { feature: "Attraction",     pct: 70.7 },
  { feature: "Hour of Day",    pct: 18.9 },
  { feature: "Month",          pct:  7.6 },
  { feature: "Day of Week",    pct:  1.6 },
  { feature: "Holiday Status", pct:  0.9 },
  { feature: "Weekend",        pct:  0.3 },
]

const MODEL_COMPARISON = [
  { name: "Random Forest",     r2: 0.567, mae: 17.2, color: "#4A7FC1" },
  { name: "Gradient Boosting", r2: 0.573, mae: 17.2, color: "#D4A857" },
]

const PER_RIDE_MODELS = [
  { ride: "Splash Mountain",          r2: 0.500, mae: 15.8, topFeature: "Hour of Day",  topPct: 66.8 },
  { ride: "Pirates of the Caribbean", r2: 0.490, mae:  9.8, topFeature: "Hour of Day",  topPct: 76.8 },
  { ride: "Spaceship Earth",          r2: 0.430, mae:  7.7, topFeature: "Hour of Day",  topPct: 77.7 },
  { ride: "Na'vi River Journey",      r2: 0.347, mae: 20.2, topFeature: "Hour of Day",  topPct: 66.7 },
  { ride: "Expedition Everest",       r2: 0.343, mae: 13.5, topFeature: "Hour of Day",  topPct: 65.6 },
  { ride: "DINOSAUR",                 r2: 0.342, mae: 11.7, topFeature: "Hour of Day",  topPct: 71.4 },
  { ride: "Seven Dwarfs Mine Train",  r2: 0.341, mae: 21.3, topFeature: "Hour of Day",  topPct: 64.1 },
  { ride: "Alien Swirling Saucers",   r2: 0.333, mae:  9.5, topFeature: "Hour of Day",  topPct: 73.1 },
  { ride: "Slinky Dog Dash",          r2: 0.314, mae: 16.9, topFeature: "Hour of Day",  topPct: 56.2 },
  { ride: "Kilimanjaro Safaris",      r2: 0.287, mae: 18.7, topFeature: "Hour of Day",  topPct: 57.8 },
  { ride: "Soarin'",                  r2: 0.264, mae: 17.2, topFeature: "Hour of Day",  topPct: 55.3 },
  { ride: "Toy Story Mania",          r2: 0.243, mae: 19.9, topFeature: "Hour of Day",  topPct: 60.8 },
  { ride: "Rock 'n' Roller Coaster",  r2: 0.238, mae: 21.1, topFeature: "Hour of Day",  topPct: 56.5 },
  { ride: "Flight of Passage",        r2: 0.199, mae: 37.6, topFeature: "Month",        topPct: 40.1 },
]

const NAV_ITEMS = [
  { id: "overview", label: "Overview"   },
  { id: "rides",    label: "By Ride"    },
  { id: "predict",  label: "Predict"    },
  { id: "timing",   label: "When to Go" },
  { id: "models",   label: "Models"     },
  { id: "parks",    label: "Parks"      },
]

// ================================================================
// UTILITIES
// ================================================================

function getHeatColor(value: number): string {
  const ratio = Math.max(0, Math.min(1, (value - 10) / 82))
  if (ratio < 0.4) {
    const t = ratio / 0.4
    return `rgba(${Math.round(42 + 138 * t)}, ${Math.round(150 - 10 * t)}, ${Math.round(68 - 20 * t)}, 0.88)`
  } else if (ratio < 0.7) {
    const t = (ratio - 0.4) / 0.3
    return `rgba(${Math.round(180 + 20 * t)}, ${Math.round(140 - 60 * t)}, ${Math.round(48 - 20 * t)}, 0.88)`
  } else {
    const t = (ratio - 0.7) / 0.3
    return `rgba(${Math.round(200 - 40 * t)}, ${Math.round(80 - 50 * t)}, ${Math.round(28 - 10 * t)}, 0.88)`
  }
}

function predictWait(
  rideName: string, month: number, dayOfWeek: number, isHoliday: boolean,
): { prediction: number; range: [number, number]; confidence: number } {
  const ride       = RIDES.find((r) => r.name === rideName) ?? RIDES[0]
  const dayFactors = [0.88,0.84,0.80,0.85,0.93,1.03,1.01]
  const prediction = Math.round(ride.avg * MONTH_FACTORS[month] * dayFactors[dayOfWeek] * (isHoliday ? 1.30 : 1.0))
  const margin     = Math.round(ride.std * 0.55)
  const confidence = Math.round(Math.max(55, Math.min(91, 72 - (ride.std / ride.avg) * 30)))
  return { prediction, range: [Math.max(5, prediction - margin), prediction + margin], confidence }
}

function getWaitCategory(min: number): { label: string; color: string; icon: React.ReactNode } {
  if (min < 30) return { label: "Short Wait",    color: "#5A9E6F", icon: <CheckCircle2 size={13} /> }
  if (min < 60) return { label: "Moderate Wait", color: "#D4A857", icon: <Clock size={13} /> }
  if (min < 90) return { label: "Long Wait",     color: "#C8602A", icon: <AlertTriangle size={13} /> }
  return              { label: "Very Long",      color: "#C83A2A", icon: <AlertTriangle size={13} /> }
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

// ================================================================
// MAGIC CANVAS  (canvas-based — stars, aurora, shooting stars)
// ================================================================

const MagicCanvas = memo(function MagicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf: number
    let W = 0, H = 0

    interface StarP  { x: number; y: number; r: number; phase: number; speed: number; maxOp: number }
    interface ShootP { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }

    let stars:  StarP[]  = []
    let shoots: ShootP[] = []
    let t = 0
    let shootFired = false
    let firstInit = true

    const init = () => {
      const newW = window.innerWidth
      const newH = window.innerHeight

      if (firstInit) {
        W = newW
        H = newH
        canvas.width = W
        canvas.height = H
        stars = Array.from({ length: 320 }, () => ({
          x:     Math.random() * W,
          y:     Math.random() * H * 0.95,
          r:     Math.random() * 1.5 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.016 + 0.004,
          maxOp: Math.random() * 0.6 + 0.2,
        }))
        firstInit = false
        return
      }

      // Subsequent resizes (incl. iOS Safari address-bar toggle): scale
      // existing stars proportionally instead of regenerating. Prevents
      // the "stars teleporting during scroll" bug on mobile.
      const scaleX = newW / W || 1
      const scaleY = newH / H || 1
      for (const s of stars) {
        s.x *= scaleX
        s.y *= scaleY
      }
      W = newW
      H = newH
      canvas.width = W
      canvas.height = H
    }

    // Fire the signature shooting star ONCE, ~800ms after mount.
    const fireSignatureShoot = () => {
      if (shootFired) return
      shootFired = true
      const ang = (22 + Math.random() * 18) * (Math.PI / 180)
      shoots.push({
        x: W * 0.1,
        y: H * 0.18,
        vx: Math.cos(ang) * 11,
        vy: Math.sin(ang) * 11,
        life: 0,
        maxLife: 42,
      })
    }

    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      t++

      // ── Twinkling stars ──────────────────────────────────────
      for (const s of stars) {
        const raw = (Math.sin(t * s.speed + s.phase) + 1) / 2
        const op  = Math.pow(raw, 1.6) * s.maxOp
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(230,235,255,${op})`
        ctx.fill()
        if (s.r > 1.0) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5)
          g.addColorStop(0, `rgba(210,225,255,${op * 0.28})`); g.addColorStop(1, "transparent")
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2); ctx.fill()
        }
        if (s.r > 1.3 && op > 0.45) {
          const spike = s.r * 10
          const bri   = `rgba(235,240,255,${op * 0.65})`
          for (const [x1, y1, x2, y2] of [
            [s.x - spike, s.y, s.x + spike, s.y],
            [s.x, s.y - spike, s.x, s.y + spike],
          ]) {
            const sg = ctx.createLinearGradient(x1, y1, x2, y2)
            sg.addColorStop(0, "transparent"); sg.addColorStop(0.5, bri); sg.addColorStop(1, "transparent")
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
            ctx.strokeStyle = sg; ctx.lineWidth = 0.9; ctx.stroke()
          }
        }
      }

      // ── Signature shooting star (fires once ~800ms in, then never again) ──
      shoots = shoots.filter(ss => {
        ss.x += ss.vx; ss.y += ss.vy; ss.life++
        const op   = Math.sin((ss.life / ss.maxLife) * Math.PI) * 0.9
        const tail = 10
        const g = ctx.createLinearGradient(ss.x - ss.vx * tail, ss.y - ss.vy * tail, ss.x, ss.y)
        g.addColorStop(0, "rgba(255,252,220,0)"); g.addColorStop(1, `rgba(255,252,220,${op})`)
        ctx.beginPath(); ctx.moveTo(ss.x - ss.vx * tail, ss.y - ss.vy * tail)
        ctx.lineTo(ss.x, ss.y); ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke()
        const hg = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 5)
        hg.addColorStop(0, `rgba(255,252,220,${op})`); hg.addColorStop(1, "transparent")
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(ss.x, ss.y, 5, 0, Math.PI * 2); ctx.fill()
        return ss.life < ss.maxLife
      })

      raf = requestAnimationFrame(tick)
    }

    init(); tick()
    const shootTimer = window.setTimeout(fireSignatureShoot, 800)

    // iOS Safari fires a resize event every time its address bar toggles
    // during scroll. We only want to re-init for meaningful changes
    // (device rotation, window resize on desktop) — which always change
    // the WIDTH. Pure-height changes are always iOS address-bar noise
    // and we ignore them entirely.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const onResize = () => {
      if (window.innerWidth === W) return // height-only change — skip
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(init, 150)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(shootTimer)
      if (resizeTimer) clearTimeout(resizeTimer)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        // Promote to its own compositor layer so iOS doesn't repaint
        // the canvas on every scroll frame.
        transform: "translateZ(0)",
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    />
  )
})

// ================================================================
// CURSOR SPOTLIGHT  (direct DOM — zero React re-renders)
// ================================================================

const CursorSpotlight = memo(function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.background = `radial-gradient(700px circle at ${e.clientX}px ${e.clientY}px, rgba(212,168,87,0.035), transparent 65%)`
      }
    }
    window.addEventListener("mousemove", move, { passive: true })
    return () => window.removeEventListener("mousemove", move)
  }, [])
  return <div ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }} />
})

// ================================================================
// TILT CARD  (useMotionValue only — no useState)
// ================================================================

const TiltCard = memo(function TiltCard({
  children, className = "", intensity = 7,
}: { children: React.ReactNode; className?: string; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const mx  = useMotionValue(0)
  const my  = useMotionValue(0)
  const rx  = useSpring(useTransform(my, [-0.5, 0.5], [ intensity, -intensity]), { stiffness: 220, damping: 28 })
  const ry  = useSpring(useTransform(mx, [-0.5, 0.5], [-intensity,  intensity]), { stiffness: 220, damping: 28 })

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width  - 0.5)
    my.set((e.clientY - r.top)  / r.height - 0.5)
  }, [mx, my])
  const onLeave = useCallback(() => { mx.set(0); my.set(0) }, [mx, my])

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
})

// ================================================================
// ANIMATED COUNTER
// ================================================================

const AnimatedCounter = memo(function AnimatedCounter({
  value, format = (n: number) => n.toLocaleString(), className = "",
}: { value: number; format?: (n: number) => string; className?: string }) {
  const ref      = useRef<HTMLSpanElement>(null)
  const mv       = useMotionValue(0)
  const displayed = useTransform(mv, (v) => format(Math.round(v)))
  const inView   = useInView(ref, { once: true, margin: "-80px" })

  useEffect(() => {
    if (!inView) return
    const ctrl = animate(mv, value, { duration: 1.8, ease: [0.16, 1, 0.3, 1] })
    return ctrl.stop
  }, [inView, value, mv])

  return <motion.span ref={ref} className={className}>{displayed}</motion.span>
})

// ================================================================
// PARK BADGE
// ================================================================

function ParkBadge({ park }: { park: string }) {
  const m = PARK_META[park]
  // Stitch spec: park colors are micro-accents only — used as 8px dots,
  // never as background fills. Label sits in Moonglow for clean editorial feel.
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-mono font-semibold tracking-[0.22em] uppercase">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: m?.color ?? "#D4A857" }}
        aria-hidden="true"
      />
      <span style={{ color: "#A8B2D1" }}>{m?.abbrev ?? park}</span>
    </span>
  )
}

// ================================================================
// SECTION HEADER
// ================================================================

function SectionHeader({
  num,
  label,
  title,
  subtitle,
}: {
  num?: string
  label: string
  title: string
  subtitle?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      className="mb-12"
    >
      {/* Editorial eyebrow — "§ 01 · The scope" style research-paper marker */}
      <div className="flex items-center gap-3 mb-5">
        {num && (
          <>
            <span
              className="font-mono tabular-nums text-[11px] tracking-[0.2em]"
              style={{ color: "#D4A857" }}
            >
              § {num}
            </span>
            <span
              className="h-px flex-shrink-0"
              style={{ width: 24, background: "rgba(212,168,87,0.35)" }}
              aria-hidden="true"
            />
          </>
        )}
        <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#D4A857]">
          {label}
        </span>
      </div>
      <h2 className="font-display text-5xl md:text-[3.75rem] font-light text-[var(--text-primary)] leading-[0.95] mb-5">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-[58ch] leading-relaxed">{subtitle}</p>
      )}
    </motion.div>
  )
}


// ================================================================
// NAVIGATION
// ================================================================

function Navigation({ activeSection }: { activeSection: string }) {
  const { scrollY } = useScroll()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Scroll 0→40px: bg opacity 0 → 0.85, border opacity 0 → 1 (Stitch spec).
  const navBg = useTransform(scrollY, [0, 40], ["rgba(11,16,39,0)", "rgba(11,16,39,0.85)"])
  const navBorder = useTransform(scrollY, [0, 40], ["rgba(164,182,215,0)", "rgba(164,182,215,0.12)"])

  // Close drawer on resize up to desktop, and on escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false) }
    document.body.style.overflow = "hidden"
    window.addEventListener("resize", onResize)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("resize", onResize)
      window.removeEventListener("keydown", onKey)
    }
  }, [mobileOpen])

  const handleNavClick = (id: string) => {
    setMobileOpen(false)
    scrollTo(id)
  }

  return (
    <>
      <motion.header
        style={{ backgroundColor: navBg, borderBottomColor: navBorder, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
      >
        <div className="max-w-[1360px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* LEFT — Brand */}
          <button
            onClick={() => scrollTo("hero")}
            className="flex items-center gap-3 focus:outline-none focus-visible:[outline:2px_solid_rgba(212,168,87,0.6)] focus-visible:outline-offset-4 rounded-sm"
          >
            <Telescope
              size={24}
              strokeWidth={1.25}
              style={{ color: "#F4F0E6" }}
            />
            <span
              className="font-display text-[var(--text-primary)] hidden sm:inline"
              style={{
                fontWeight: 400,
                fontSize: "1.125rem",
                letterSpacing: "-0.01em",
                fontVariationSettings: '"opsz" 24',
              }}
            >
              Disney Wait Times
            </span>
          </button>

          {/* CENTER — Desktop nav */}
          <nav
            className="hidden lg:flex items-center gap-1 flex-1 justify-center"
            aria-label="Sections"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="relative px-4 py-2 rounded-full transition-colors duration-[160ms] ease-out focus:outline-none focus-visible:[outline:2px_solid_rgba(212,168,87,0.6)] focus-visible:outline-offset-4"
                  style={{
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    fontWeight: 450,
                    fontSize: "0.8125rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: active ? "#D4A857" : "#A8B2D1",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#F4F0E6"
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#A8B2D1"
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "rgba(212,168,87,0.08)",
                        border: "1px solid rgba(212,168,87,0.2)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* RIGHT — Live-data pill (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-4 min-w-0 lg:min-w-[200px] justify-end">
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "#1E2547" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#5A9E6F] breathe" />
              <span
                className="font-mono tabular-nums"
                style={{ fontWeight: 500, fontSize: "0.75rem", color: "#A8B2D1" }}
              >
                3,146,086 records
              </span>
            </div>

            {/* Hamburger — shows < 1024px */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden flex flex-col items-end justify-center gap-[4px] w-8 h-8 focus:outline-none focus-visible:[outline:2px_solid_rgba(212,168,87,0.6)] focus-visible:outline-offset-4 rounded-sm"
            >
              <span className="block h-[1.5px] bg-[#F4F0E6]" style={{ width: "20px" }} />
              <span className="block h-[1.5px] bg-[#F4F0E6]" style={{ width: "16px" }} />
              <span className="block h-[1.5px] bg-[#F4F0E6]" style={{ width: "18px" }} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer — slide from right */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="nav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-[rgba(11,16,39,0.6)] backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="nav-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
              className="fixed top-0 right-0 bottom-0 z-[61] w-full max-w-sm lg:hidden overflow-hidden"
              style={{ background: "#0B1027" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <div className="relative h-full flex flex-col px-8 pt-6 pb-10">
                <div className="flex items-center justify-between mb-14">
                  <div className="flex items-center gap-3">
                    <Telescope size={24} strokeWidth={1.25} style={{ color: "#F4F0E6" }} />
                    <span
                      className="font-display"
                      style={{
                        fontWeight: 400,
                        fontSize: "1.125rem",
                        letterSpacing: "-0.01em",
                        color: "#F4F0E6",
                      }}
                    >
                      Disney Wait Times
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                    className="w-8 h-8 flex items-center justify-center rounded-sm focus:outline-none focus-visible:[outline:2px_solid_rgba(212,168,87,0.6)] focus-visible:outline-offset-4"
                    style={{ color: "#F4F0E6" }}
                  >
                    <X size={20} strokeWidth={1.25} />
                  </button>
                </div>
                <nav className="flex flex-col gap-1" aria-label="Sections">
                  {NAV_ITEMS.map((item, i) => {
                    const active = activeSection === item.id
                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        onClick={() => handleNavClick(item.id)}
                        className="text-left py-4 transition-colors duration-[160ms] ease-out focus:outline-none focus-visible:[outline:2px_solid_rgba(212,168,87,0.6)] focus-visible:outline-offset-4 rounded-sm"
                        style={{
                          fontFamily: "var(--font-display), serif",
                          fontWeight: 400,
                          fontSize: "1.75rem",
                          letterSpacing: "-0.015em",
                          color: active ? "#D4A857" : "#F4F0E6",
                          fontVariationSettings: '"opsz" 48',
                        }}
                      >
                        {item.label}
                      </motion.button>
                    )
                  })}
                </nav>
                <div className="mt-auto pt-10 border-t border-[rgba(164,182,215,0.12)]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5A9E6F] breathe" />
                    <span
                      className="font-mono tabular-nums"
                      style={{ fontWeight: 500, fontSize: "0.75rem", color: "#A8B2D1" }}
                    >
                      3,146,086 records
                    </span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ================================================================
// HERO SECTION
// ================================================================

function HeroSection() {
  const { scrollY } = useScroll()
  const contentY = useTransform(scrollY, [0, 400], [0, -24])

  // Rotating live prediction — cycles to a random ride every 6s.
  const [livePrediction, setLivePrediction] = useState<{
    ride: string
    park: string
    value: number
    confidence: number
  } | null>(null)

  useEffect(() => {
    const now = new Date()
    const month = now.getMonth()
    const day = (now.getDay() + 6) % 7
    let lastIndex = -1

    const computeFor = (idx: number) => {
      const ride = RIDES[idx]
      const p = predictWait(ride.name, month, day, false)
      setLivePrediction({ ride: ride.name, park: ride.park, value: p.prediction, confidence: p.confidence })
    }

    // Seed with a random ride on mount
    lastIndex = Math.floor(Math.random() * RIDES.length)
    computeFor(lastIndex)

    const interval = setInterval(() => {
      let next = Math.floor(Math.random() * RIDES.length)
      if (next === lastIndex) next = (next + 1) % RIDES.length
      lastIndex = next
      computeFor(next)
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }
  const itemV = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 85, damping: 22 } },
  }

  return (
    <section id="hero" className="relative min-h-[100dvh] flex items-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 70% 40%, rgba(74,127,193,0.09) 0%, transparent 65%), radial-gradient(ellipse 45% 45% at 22% 70%, rgba(212,168,87,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 w-full pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-16 items-center">
          {/* LEFT — Editorial headline */}
          <motion.div
            style={{ y: contentY }}
            variants={containerV}
            initial="hidden"
            animate="visible"
            className="relative z-10"
          >
            <motion.div variants={itemV} className="mb-7">
              <span
                className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase px-3.5 py-1.5 rounded-full"
                style={{
                  background: "rgba(212,168,87,0.08)",
                  border: "1px solid rgba(212,168,87,0.22)",
                  color: "#D4A857",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#5A9E6F] breathe" />
                Live Data · 3,146,086 records
              </span>
            </motion.div>

            <motion.h1
              variants={itemV}
              className="font-display text-[var(--text-primary)] mb-8"
              style={{
                fontSize: "clamp(2.75rem, 6.5vw, 5.25rem)",
                lineHeight: 1.02,
                fontWeight: 300,
                letterSpacing: "-0.02em",
                fontVariationSettings: '"opsz" 144',
              }}
            >
              <span className="block">Seven years of</span>
              <span className="block">Disney wait times,</span>
              <span className="block">
                <span className="font-serif-italic text-[#D4A857]" style={{ fontWeight: 400 }}>modeled.</span>
              </span>
            </motion.h1>

            <motion.p
              variants={itemV}
              className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed max-w-[52ch] mb-10"
            >
              A Gradient Boosting analysis of 3.15 million wait-time records
              across 14 attractions and 4 parks. It predicts when lines are shortest
              and what drives the crowds.
            </motion.p>

            <motion.div variants={itemV} className="flex flex-wrap items-center gap-5">
              <motion.button
                onClick={() => scrollTo("models")}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg,#D4A857 0%,#E5B967 100%)",
                  color: "#0B1027",
                  boxShadow: "0 10px 36px -10px rgba(212,168,87,0.45)",
                }}
              >
                See the model
                <ArrowRight size={14} strokeWidth={1.5} />
              </motion.button>
              <button
                onClick={() => scrollTo("predict")}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[160ms]"
              >
                <span className="underline underline-offset-4 decoration-[rgba(212,168,87,0.35)] group-hover:decoration-[#D4A857]">
                  Or run your own prediction
                </span>
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-[200ms] group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          </motion.div>

          {/* RIGHT — Live observatory panel */}
          <motion.div
            initial={{ opacity: 0, y: 36, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Orbit rings — bigger, extend beyond panel */}
            <svg
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              viewBox="0 0 400 400"
              preserveAspectRatio="xMidYMid meet"
              style={{ transform: "translate(-28%, -22%)", width: "156%", height: "148%", zIndex: 0 }}
            >
              <defs>
                <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(164,182,215,0.38)" />
                  <stop offset="100%" stopColor="rgba(164,182,215,0)" />
                </linearGradient>
                <linearGradient id="orbitGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(212,168,87,0.25)" />
                  <stop offset="100%" stopColor="rgba(212,168,87,0)" />
                </linearGradient>
              </defs>
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 240, ease: "linear" }}
                style={{ transformOrigin: "200px 200px" }}
              >
                <ellipse cx="200" cy="200" rx="196" ry="78" fill="none" stroke="url(#orbitGrad)" strokeWidth="0.8" />
                <ellipse
                  cx="200"
                  cy="200"
                  rx="166"
                  ry="62"
                  fill="none"
                  stroke="url(#orbitGradGold)"
                  strokeWidth="0.7"
                  transform="rotate(-28 200 200)"
                />
                <ellipse
                  cx="200"
                  cy="200"
                  rx="134"
                  ry="48"
                  fill="none"
                  stroke="url(#orbitGrad)"
                  strokeWidth="0.55"
                  transform="rotate(22 200 200)"
                />
                <ellipse
                  cx="200"
                  cy="200"
                  rx="102"
                  ry="34"
                  fill="none"
                  stroke="url(#orbitGrad)"
                  strokeWidth="0.45"
                  transform="rotate(-52 200 200)"
                />
              </motion.g>
            </svg>

            <div
              className="relative p-8 md:p-10 rounded-3xl backdrop-blur-2xl"
              style={{
                background: "linear-gradient(155deg, rgba(21,27,58,0.32) 0%, rgba(11,16,39,0.4) 100%)",
                border: "1px solid rgba(164,182,215,0.16)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 80px -24px rgba(11,16,39,0.65), 0 0 60px -12px rgba(74,127,193,0.18)",
                zIndex: 1,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Telescope size={15} style={{ color: "#D4A857" }} />
                  <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)]">
                    Observatory · Right now
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#5A9E6F] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A9E6F] breathe" />
                  LIVE
                </span>
              </div>

              <div className="text-[13px] text-[var(--text-secondary)] mb-3 font-display italic min-h-[3rem]" style={{ fontWeight: 400 }}>
                Predicted wait for
                <AnimatePresence mode="wait">
                  <motion.span
                    key={livePrediction?.ride ?? "loading"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="block text-[var(--text-primary)] not-italic font-sans font-semibold text-[15px] mt-0.5"
                  >
                    {livePrediction?.ride ?? "—"}
                    {livePrediction?.park && (
                      <span className="text-[var(--text-muted)] font-normal ml-2 text-[11px]">
                        · {PARK_META[livePrediction.park]?.abbrev}
                      </span>
                    )}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div
                className="font-mono tabular-nums text-[var(--text-primary)] leading-none mb-5"
                style={{ fontSize: "clamp(4.5rem, 9vw, 7rem)", fontWeight: 500, letterSpacing: "-0.04em" }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={livePrediction?.value ?? "loading"}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                    className="inline-block"
                  >
                    {livePrediction?.value ?? "—"}
                  </motion.span>
                </AnimatePresence>
                <span className="font-display text-[0.3em] font-light text-[var(--text-secondary)] ml-3 align-middle">
                  min
                </span>
              </div>

              <div className="flex items-end justify-between gap-4 pt-5 border-t border-[rgba(164,182,215,0.1)]">
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-1.5">
                    Model confidence
                  </div>
                  <div className="text-[var(--text-primary)] font-mono tabular-nums text-xl" style={{ fontWeight: 500 }}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={livePrediction?.confidence ?? "loading"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {livePrediction?.confidence ?? "—"}%
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-1.5">
                    Algorithm
                  </div>
                  <div className="text-[var(--text-primary)] text-sm font-medium">Gradient Boosting</div>
                </div>
              </div>

              {/* Sparkline */}
              <div className="mt-6 h-10 w-full">
                <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(212,168,87,0.45)" />
                      <stop offset="100%" stopColor="rgba(212,168,87,0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 28 L12 24 L24 26 L36 18 L48 22 L60 14 L72 17 L84 12 L96 18 L108 10 L120 16 L132 8 L144 14 L156 11 L168 18 L180 14 L192 20 L200 18"
                    fill="none"
                    stroke="#D4A857"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0 28 L12 24 L24 26 L36 18 L48 22 L60 14 L72 17 L84 12 L96 18 L108 10 L120 16 L132 8 L144 14 L156 11 L168 18 L180 14 L192 20 L200 18 L200 40 L0 40 Z"
                    fill="url(#sparkGrad)"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ================================================================
// OVERVIEW SECTION
// ================================================================

function OverviewSection() {
  const stats = [
    { value: "3.15M", label: "Wait-time records" },
    { value: "14",    label: "Attractions" },
    { value: "4",     label: "Parks" },
    { value: "7",     label: "Years of data" },
  ]

  return (
    <section id="overview" className="section-ambient relative py-32 px-6">
      <div className="section-divider mb-28" />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          num="01"
          label="The scope"
          title="Seven years. Four parks. Fourteen rides."
          subtitle="Posted wait-time data from January 2015 through December 2021, aggregated by hour, day, month, and season."
        />

        {/* Asymmetric stats — 3.15M is the headline figure, other three cluster
            tight beside it. Breaks the 4-up symmetry (Stitch: Variance 8). */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-y-12 md:gap-x-16 items-end">
          {/* Featured stat — 3.15M, dramatically larger */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          >
            <div
              className="font-display tabular-nums text-[var(--text-primary)] leading-[0.92] mb-3"
              style={{ fontSize: "clamp(5rem, 11vw, 9rem)", fontWeight: 300, letterSpacing: "-0.035em" }}
            >
              3.15M
            </div>
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)]">
              Wait-time records
            </div>
          </motion.div>

          {/* Cluster of three — smaller, offset right */}
          <div className="grid grid-cols-3 gap-6 md:gap-8 md:pb-2">
            {stats.slice(1).map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              >
                <div
                  className="font-display tabular-nums text-[var(--text-primary)] leading-none mb-2"
                  style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 400, letterSpacing: "-0.02em" }}
                >
                  {s.value}
                </div>
                <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)]">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Park list as text, not chips (less card-like) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-16 pt-8 border-t border-[rgba(164,182,215,0.1)] flex flex-wrap gap-x-10 gap-y-3"
        >
          {Object.entries(PARK_META).map(([park, m]) => (
            <div key={park} className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
              <span className="text-[13px] text-[var(--text-secondary)]">
                <span className="font-mono text-[var(--text-muted)] mr-1.5">{m.abbrev}</span>
                {park}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ================================================================
// RIDES SECTION
// ================================================================

function RidesSection() {
  const [filter, setFilter] = useState("All")
  const parks   = ["All", ...Array.from(new Set(RIDES.map((r) => r.park)))]
  const filtered = filter === "All" ? [...RIDES] : RIDES.filter((r) => r.park === filter)
  const maxAvg   = Math.max(...RIDES.map((r) => r.avg))

  return (
    <section id="rides" className="section-ambient relative py-36 px-6">
      <div className="section-divider mb-32" />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          num="02"
          label="Attraction analysis"
          title="Every ride, compared."
          subtitle="Average, median, and standard deviation for every attraction. What you're actually likely to wait, not just the headline number."
        />

        {/* Park filter — ghost chips. Active gets the 8% gold fill (Stitch spec).
            Park color never appears as a background fill here. */}
        <div className="flex flex-wrap gap-2 mb-10">
          {parks.map((p) => {
            const m = PARK_META[p]
            const active = filter === p
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className="text-xs font-medium px-4 py-2 rounded-full transition-colors duration-[160ms] ease-out inline-flex items-center gap-2"
                style={{
                  background: active ? "rgba(212,168,87,0.08)" : "transparent",
                  color: active ? "#D4A857" : "#A8B2D1",
                  border: `1px solid ${active ? "rgba(212,168,87,0.28)" : "rgba(164,182,215,0.14)"}`,
                }}
              >
                {p !== "All" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: m?.color }}
                    aria-hidden="true"
                  />
                )}
                {p === "All" ? "All parks" : `${PARK_META[p]?.abbrev} · ${p}`}
              </button>
            )
          })}
        </div>

        {/* Research-paper table — responsive.
            Desktop (md+): 6-column grid. Mobile: stacked editorial block. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card-airy overflow-hidden"
        >
          {/* Desktop header — hidden on mobile */}
          <div
            className="hidden md:grid items-center px-6 py-4 text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)] border-b border-[rgba(164,182,215,0.12)]"
            style={{ gridTemplateColumns: "minmax(0, 3fr) 72px 1fr 1fr 1fr 96px" }}
          >
            <span>Attraction</span>
            <span className="text-center">Park</span>
            <span className="text-right">Avg wait</span>
            <span className="text-right">Median</span>
            <span className="text-right">Std dev</span>
            <span className="text-right pr-2">Demand</span>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((ride, i) => {
              const m = PARK_META[ride.park]
              const barW = (ride.avg / maxAvg) * 100
              const isHigh = ride.avg >= 70
              // Stochastic stagger — deterministic pseudo-random between 60–120ms
              // per row so the table "flutters" in like a mechanical flip-board
              // (Stitch spec) rather than a linear waterfall.
              const jitter = ((i * 2654435761) % 60) / 1000 // 0–59 ms
              const staggerDelay = 0.06 + jitter + i * 0.015
              return (
                <motion.div
                  key={ride.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: staggerDelay, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="border-b border-[rgba(164,182,215,0.08)] last:border-b-0 ride-row group"
                >
                  {/* ── Desktop (md+): single-row grid ── */}
                  <div
                    className="hidden md:grid items-center px-6 py-5"
                    style={{ gridTemplateColumns: "minmax(0, 3fr) 72px 1fr 1fr 1fr 96px" }}
                  >
                    {/* Name + bar */}
                    <div className="min-w-0 pr-6">
                      <div
                        className="font-display text-[var(--text-primary)] text-base md:text-lg truncate"
                        style={{ fontWeight: 500, letterSpacing: "-0.005em" }}
                      >
                        {ride.name}
                      </div>
                      <div className="mt-2 h-[3px] bg-[rgba(164,182,215,0.08)] rounded-full overflow-hidden max-w-[260px]">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${barW}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1], delay: i * 0.03 + 0.15 }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg,${m?.color}55,${m?.color})` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-center items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: m?.color }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[10px] font-mono font-semibold tracking-[0.22em] uppercase"
                        style={{ color: "#A8B2D1" }}
                      >
                        {m?.abbrev}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className="font-display tabular-nums"
                        style={{ color: m?.color, fontSize: "1.65rem", fontWeight: 400, letterSpacing: "-0.02em" }}
                      >
                        {ride.avg}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-1">min</span>
                    </div>

                    <div className="text-right font-mono tabular-nums text-sm text-[var(--text-secondary)]">
                      {ride.median}<span className="text-[var(--text-muted)] ml-1">min</span>
                    </div>

                    <div className="text-right font-mono tabular-nums text-sm text-[var(--text-secondary)]">
                      ±{ride.std}<span className="text-[var(--text-muted)] ml-1">min</span>
                    </div>

                    <div className="flex justify-end pr-2">
                      {isHigh ? (
                        <span
                          className="text-[9px] font-semibold tracking-[0.18em] uppercase px-2 py-1 rounded"
                          style={{ background: "rgba(200,74,42,0.12)", color: "#E07A5F", border: "1px solid rgba(200,74,42,0.28)" }}
                        >
                          High
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">—</span>
                      )}
                    </div>
                  </div>

                  {/* ── Mobile (<md): stacked editorial block ── */}
                  <div className="md:hidden px-5 py-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: m?.color }}
                              aria-hidden="true"
                            />
                            <span
                              className="text-[10px] font-mono font-semibold tracking-[0.22em] uppercase"
                              style={{ color: "#A8B2D1" }}
                            >
                              {m?.abbrev}
                            </span>
                          </span>
                          {isHigh && (
                            <span
                              className="text-[9px] font-semibold tracking-[0.18em] uppercase px-2 py-0.5 rounded"
                              style={{ background: "rgba(200,74,42,0.12)", color: "#E07A5F", border: "1px solid rgba(200,74,42,0.28)" }}
                            >
                              High
                            </span>
                          )}
                        </div>
                        <div
                          className="font-display text-[var(--text-primary)] text-[1.15rem] leading-[1.2]"
                          style={{ fontWeight: 500, letterSpacing: "-0.005em" }}
                        >
                          {ride.name}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="font-display tabular-nums leading-none"
                          style={{ color: m?.color, fontSize: "1.9rem", fontWeight: 400, letterSpacing: "-0.02em" }}
                        >
                          {ride.avg}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] tracking-[0.22em] uppercase mt-1">avg min</div>
                      </div>
                    </div>

                    <div className="h-[3px] bg-[rgba(164,182,215,0.08)] rounded-full overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${barW}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1], delay: i * 0.03 + 0.15 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg,${m?.color}55,${m?.color})` }}
                      />
                    </div>

                    <div className="flex gap-6 text-xs font-mono tabular-nums text-[var(--text-muted)]">
                      <span>
                        Median <span className="text-[var(--text-secondary)] ml-1">{ride.median}</span>
                        <span className="ml-1">min</span>
                      </span>
                      <span>
                        Std <span className="text-[var(--text-secondary)] ml-1">±{ride.std}</span>
                        <span className="ml-1">min</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          <div className="px-6 py-3 text-[10px] font-mono text-[var(--text-muted)] tracking-wide border-t border-[rgba(164,182,215,0.12)]">
            {filtered.length} {filtered.length === 1 ? "attraction" : "attractions"}
            {filter !== "All" && <span> · filtered to {PARK_META[filter]?.abbrev ?? filter}</span>}
          </div>
        </motion.div>

      </div>
    </section>
  )
}

// ================================================================
// PREDICT SECTION
// ================================================================

function PredictSection() {
  const [form, setForm] = useState<{ ride: string; month: number; day: number; holiday: boolean }>(
    { ride: RIDES[2].name, month: 6, day: 5, holiday: false },
  )
  const [result, setResult] = useState<ReturnType<typeof predictWait> | null>(null)
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)

  const handlePredict = useCallback(async () => {
    setLoading(true); setResult(null)
    await new Promise((r) => setTimeout(r, 680))
    setResult(predictWait(form.ride, form.month, form.day, form.holiday))
    setLoading(false); setRan(true)
  }, [form])

  const category = result ? getWaitCategory(result.prediction) : null

  return (
    <section id="predict" className="section-ambient relative py-36 px-6">
      <div className="section-divider mb-32" />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          num="03"
          label="Machine learning model"
          title="Predict your wait."
          subtitle="A Gradient Boosting model trained on all 3.15M records. Pick a ride, a day, and a month to see what it predicts."
        />

        {/* Editorial two-panel: form + result sit directly on canvas,
            separated by a single vertical Constellation hairline (Stitch spec). */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[rgba(164,182,215,0.12)]">
          {/* Form */}
          <div className="space-y-5 md:pr-10">
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)] mb-2">Attraction</label>
              <select className="themed-select" value={form.ride}
                onChange={(e) => setForm((f) => ({ ...f, ride: e.target.value }))}>
                {RIDES.map((r) => (
                  <option key={r.id} value={r.name}>{r.name} ({PARK_META[r.park]?.abbrev})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)] mb-2">Month</label>
                <select className="themed-select" value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: +e.target.value }))}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)] mb-2">Day</label>
                <select className="themed-select" value={form.day}
                  onChange={(e) => setForm((f) => ({ ...f, day: +e.target.value }))}>
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)] mb-3">Holiday period</label>
              <div className="flex gap-3">
                {[{ val: false, label: "Regular day" }, { val: true, label: "Holiday period" }].map((opt) => (
                  <button key={String(opt.val)} onClick={() => setForm((f) => ({ ...f, holiday: opt.val }))}
                    className="flex-1 py-2.5 rounded-full text-sm font-medium transition-colors duration-[160ms]"
                    style={{
                      background: form.holiday === opt.val ? "rgba(212,168,87,0.08)" : "transparent",
                      border: `1px solid ${form.holiday === opt.val ? "rgba(212,168,87,0.28)" : "rgba(164,182,215,0.14)"}`,
                      color: form.holiday === opt.val ? "#D4A857" : "#A8B2D1",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handlePredict}
              disabled={loading}
              className="w-full py-3.5 rounded-full font-semibold text-sm transition-transform duration-150 active:translate-y-[1px]"
              style={{
                background: loading ? "rgba(212,168,87,0.18)" : "#D4A857",
                color: loading ? "#D4A857" : "#0B1027",
              }}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: [0.32, 0.72, 0, 1] }}
                    className="w-4 h-4 rounded-full border-2 border-[#D4A857] border-t-transparent" />
                  Calculating
                </span>
              ) : (
                ran ? "Recalculate" : "Calculate wait time"
              )}
            </button>
          </div>

          {/* Result — no outer card, sits on canvas; left padding on md+ to match divider */}
          <div className="flex flex-col justify-center min-h-[380px] mt-10 md:mt-0 md:pl-10">
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[var(--text-muted)]">
                  <div className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-3">Awaiting input</div>
                  <p className="text-sm max-w-[32ch] leading-relaxed">
                    Configure trip details <span className="md:hidden">above</span><span className="hidden md:inline">on the left</span> to see what the model predicts.
                  </p>
                </motion.div>
              )}
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col gap-5">
                  <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)]">
                    Running Gradient Boosting model
                  </div>
                  <div className="w-full h-[2px] rounded-full bg-[rgba(164,182,215,0.1)] overflow-hidden">
                    <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
                      className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#D4A857] to-transparent" />
                  </div>
                </motion.div>
              )}
              {result && !loading && (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  className="space-y-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)] mb-2">Predicted wait</div>
                      <div
                        className="font-mono tabular-nums text-[var(--text-primary)] leading-none"
                        style={{ fontSize: "clamp(4.5rem, 9vw, 6.5rem)", fontWeight: 500, letterSpacing: "-0.04em" }}
                      >
                        {result.prediction}
                        <span className="font-display text-[0.28em] font-light text-[var(--text-secondary)] ml-3 align-middle" style={{ fontWeight: 300 }}>
                          min
                        </span>
                      </div>
                    </div>
                    {category && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full mt-2 flex-shrink-0"
                        style={{ background: `${category.color}14`, color: category.color, border: `1px solid ${category.color}30` }}>
                        {category.icon} {category.label}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-2 font-mono tabular-nums">
                      <span>Range {result.range[0]}–{result.range[1]} min</span>
                      <span>{result.confidence}% confidence</span>
                    </div>
                    {/* 2px hairline confidence bar — gold rare, not a block */}
                    <div className="h-[2px] rounded-full bg-[rgba(164,182,215,0.1)] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full" style={{ background: "#D4A857", boxShadow: "0 0 12px rgba(212,168,87,0.35)" }} />
                    </div>
                  </div>
                  <div className="pt-5 border-t border-[rgba(164,182,215,0.1)]">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      On a <span className="text-[var(--text-primary)]">
                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][form.day]}
                      </span> in <span className="text-[var(--text-primary)]">{MONTHS[form.month]}</span>
                      {form.holiday ? <span className="text-[#C8602A]"> (holiday period)</span> : ""}, the model
                      estimates <span className="text-[#D4A857]" style={{ fontWeight: 500 }}>{result.prediction} minutes</span> for {form.ride}.
                    </p>
                  </div>
                  {result.prediction > 60 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start gap-2 text-xs text-[#5A9E6F]">
                      <Zap size={13} className="flex-shrink-0 mt-0.5" />
                      <span>Arrive at rope drop. Waits are typically 40–60% lower in the first 90 minutes of operation.</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

// ================================================================
// TIMING SECTION
// ================================================================

function TimingSection() {
  const maxDay = Math.max(...DAYS.map((d) => d.avg))
  const minDay = Math.min(...DAYS.map((d) => d.avg))
  const maxSeason = Math.max(...SEASONS.map((s) => s.avg))

  return (
    <section id="timing" className="section-ambient relative py-36 px-6">
      <div className="section-divider mb-32" />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          num="04"
          label="Visit planning"
          title="When to go."
          subtitle="Midweek visits consistently have shorter waits, about 10% less than Saturday peaks. Fall is the quietest season of the year."
        />

        {/* Row: Seasonal + Holiday (absorbed from old Overview) */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mb-6">
          <TiltCard className="glass-card glass-card-hover p-8" intensity={3}>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D4A857] mb-1">Seasonal average</div>
            <p className="text-[var(--text-muted)] text-xs mb-8">Average wait across all 14 attractions, by season.</p>
            <div className="flex items-end gap-4" style={{ height: 220 }}>
              {SEASONS.map((s, i) => {
                const barH = Math.round((s.avg / maxSeason) * 140)
                return (
                  <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">{s.avg}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: barH }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full rounded-t-sm flex-shrink-0"
                      style={{
                        background: s.best
                          ? "linear-gradient(180deg,#5A9E6F,rgba(90,158,111,0.55))"
                          : "linear-gradient(180deg,#D4A857,rgba(212,168,87,0.5))",
                      }}
                    />
                    <div className="text-center">
                      <div className="text-xs font-medium text-[var(--text-primary)]">{s.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{s.months}</div>
                      {s.best && <div className="text-[9px] text-[#5A9E6F] font-semibold tracking-widest uppercase mt-0.5">Best</div>}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </TiltCard>

          <TiltCard className="glass-card glass-card-hover p-8" intensity={3}>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D4A857] mb-1">Holiday impact</div>
            <p className="text-[var(--text-muted)] text-xs mb-6">Average wait increase during peak periods.</p>
            <div className="space-y-4">
              {HOLIDAYS.map((h, i) => (
                <motion.div key={h.name} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-[var(--text-primary)] font-medium truncate pr-2">{h.name}</span>
                    <span className="text-xs font-mono font-semibold flex-shrink-0 text-[#D4A857]">+{h.impact}%</span>
                  </div>
                  <div className="h-1 bg-[var(--bar-track)] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${(h.impact / 17) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-[#D4A857]" />
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">{h.period}</div>
                </motion.div>
              ))}
            </div>
          </TiltCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mb-6">
          {/* Day chart */}
          <TiltCard className="glass-card glass-card-hover p-8" intensity={3}>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D4A857] mb-1">Avg Wait by Day</div>
            <p className="text-[var(--text-muted)] text-xs mb-8">Across all 14 attractions · minutes</p>
            <div className="flex items-end gap-3" style={{ height: 220 }}>
              {DAYS.map((d, i) => {
                const barH = Math.round((d.avg / maxDay) * 160)
                const best = d.avg === minDay
                const worst= d.avg === maxDay
                return (
                  <motion.div key={d.day} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">{d.avg}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: barH }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 + 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full rounded-t-md"
                      style={{
                        background: best ? "linear-gradient(180deg,#5A9E6F,rgba(90,158,111,0.55))"
                          : worst ? "linear-gradient(180deg,#C84A2A,rgba(200,74,42,0.55))"
                          : "linear-gradient(180deg,#D4A857,rgba(212,168,87,0.45))",
                      }}
                    />
                    <span className="text-xs font-medium"
                      style={{ color: best ? "#5A9E6F" : worst ? "#C84A2A" : "var(--text-secondary)" }}>{d.day}</span>
                    {best  && <span className="text-[9px] text-[#5A9E6F] font-semibold tracking-widest uppercase">Best</span>}
                    {worst && <span className="text-[9px] text-[#C84A2A] font-semibold tracking-widest uppercase">Peak</span>}
                  </motion.div>
                )
              })}
            </div>
          </TiltCard>

          {/* Editorial insight callouts — numbered, hairline-separated, no cards */}
          <div className="flex flex-col justify-center">
            {[
              {
                num: "01",
                kicker: "Best window",
                title: "Go in the fall",
                body: "Sep–Nov averages 42.3 min, the lowest of any season. September alone drops to 32.9 min, the single quietest month in the dataset.",
              },
              {
                num: "02",
                kicker: "Worst windows",
                title: "Skip holiday weeks",
                body: "Spring Break (+17%) and Christmas / New Year's (+13%) are the sharpest crowd spikes. Summer Peak and Thanksgiving move the needle far less.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 14, filter: "blur(3px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="py-6 first:pt-0 border-t border-[rgba(164,182,215,0.12)] first:border-t-0"
              >
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-mono text-[11px] text-[#D4A857] tabular-nums">{card.num}</span>
                  <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)]">
                    {card.kicker}
                  </span>
                </div>
                <h4
                  className="font-display text-[var(--text-primary)] text-xl md:text-2xl mb-2"
                  style={{ fontWeight: 400, letterSpacing: "-0.01em" }}
                >
                  {card.title}
                </h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[52ch]">
                  {card.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Month crowd heatmap */}
        <TiltCard className="glass-card glass-card-hover p-8" intensity={2}>
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D4A857] mb-1">Month-by-Month Crowd Level</div>
          <p className="text-[var(--text-muted)] text-xs mb-6">Relative wait-time multiplier. Green means low crowds, red means high.</p>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {MONTH_FACTORS.map((factor, i) => {
              const intensity = Math.max(0, Math.min(1, (factor - 0.78) / 0.57))
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="heat-cell aspect-square flex flex-col items-center justify-center gap-0.5"
                  style={{ background: getHeatColor(10 + intensity * 82) }}
                  title={`${MONTHS[i]}: ${factor}× multiplier`}>
                  <span className="text-[9px] font-semibold text-white/90">{MONTHS[i].slice(0,3)}</span>
                  <span className="text-[8px] font-mono text-white/70">{factor}×</span>
                </motion.div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-5 text-[10px] text-[var(--text-muted)]">
            {[["rgba(42,150,68,0.88)","Low crowds"],["rgba(212,168,87,0.88)","Moderate"],["rgba(180,50,28,0.88)","High crowds"]].map(([bg,label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: bg }} />
                {label}
              </div>
            ))}
          </div>
        </TiltCard>
      </div>
    </section>
  )
}

// ================================================================
// MODELS SECTION
// ================================================================

function ModelsSection() {
  const [showPerRide, setShowPerRide] = useState(false)
  const maxR2 = Math.max(...MODEL_COMPARISON.map((m) => m.r2))

  return (
    <section id="models" className="section-ambient relative py-36 px-6">
      <div className="section-divider mb-32" />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          num="05"
          label="Model iteration"
          title="RF vs Gradient Boosting."
          subtitle="Both models trained on 3.15M records. Gradient Boosting edges out Random Forest. Per-ride models show what drives waits once you control for attraction identity."
        />

        {/* Model comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {MODEL_COMPARISON.map((model, i) => {
            const isWinner = model.r2 === Math.max(...MODEL_COMPARISON.map((m) => m.r2))
            return (
              <motion.div key={model.name} initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}>
                <TiltCard className="glass-card-airy p-8 h-full relative" intensity={5}>
                  {isWinner && (
                    <div className="absolute top-0 left-6 right-6 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${model.color}, transparent)` }} />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)]">
                      Model
                    </div>
                    {isWinner && (
                      <span className="text-[9px] font-semibold tracking-[0.18em] uppercase px-2 py-1 rounded-md"
                        style={{ background: "rgba(90,158,111,0.12)", color: "#5A9E6F", border: "1px solid rgba(90,158,111,0.25)" }}>
                        Winner
                      </span>
                    )}
                  </div>
                  <div className="mb-8" style={{ color: model.color }}>
                    <span className="font-display text-xl md:text-2xl" style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>
                      {model.name}
                    </span>
                  </div>

                  <div className="text-center py-4">
                    <div
                      className={`font-display tabular-nums text-[var(--text-primary)] leading-none mb-2 ${isWinner ? "intelligence-pulse" : ""}`}
                      style={{ fontSize: "clamp(3.75rem, 8vw, 5.5rem)", fontWeight: 400, letterSpacing: "-0.03em" }}
                    >
                      {model.r2.toFixed(3)}
                      <span className="font-display italic text-[0.32em] text-[var(--text-secondary)] ml-2 align-baseline" style={{ fontWeight: 400 }}>
                        R²
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--text-muted)]">
                      Coefficient of determination
                    </div>
                  </div>

                  <div className="my-6">
                    <div className="h-1 bg-[var(--bar-track)] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${(model.r2 / maxR2) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1], delay: i * 0.1 + 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${model.color}55, ${model.color})` }} />
                    </div>
                  </div>
                  <div className="flex gap-8 justify-center pt-2">
                    <div className="text-center">
                      <div className="font-mono tabular-nums text-[var(--text-primary)] text-lg" style={{ fontWeight: 500 }}>±{model.mae}</div>
                      <div className="text-[9px] font-medium tracking-[0.22em] uppercase text-[var(--text-muted)] mt-1">MAE · min</div>
                    </div>
                    <div className="w-px" style={{ background: "rgba(164,182,215,0.14)" }} />
                    <div className="text-center">
                      <div className="font-mono tabular-nums text-[var(--text-primary)] text-lg" style={{ fontWeight: 500 }}>{(model.r2 * 100).toFixed(1)}%</div>
                      <div className="text-[9px] font-medium tracking-[0.22em] uppercase text-[var(--text-muted)] mt-1">Variance</div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>

        {/* Feature importance — winner only (Gradient Boosting) */}
        <motion.div initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card-airy p-8 md:p-10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-center">
            <div className="max-w-[28ch]">
              <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#D4A857] mb-3">
                Feature importance
              </div>
              <h3 className="font-display text-[var(--text-primary)] text-2xl md:text-3xl mb-3" style={{ fontWeight: 400, letterSpacing: "-0.01em" }}>
                What drives the Gradient Boosting predictions.
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                Attraction identity dominates — rides are simply busier or quieter than each other. Once you strip that out with per-ride models, Hour of Day takes over.
              </p>
            </div>
            <div className="space-y-4">
              {FEATURE_IMPORTANCE_GB.map((f, i) => (
                <div key={f.feature} className="flex items-center gap-4">
                  <span className="text-xs text-[var(--text-secondary)] w-28 flex-shrink-0 text-right">{f.feature}</span>
                  <div className="flex-1 h-1.5 bg-[var(--bar-track)] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${f.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: i === 0 ? "linear-gradient(90deg,#D4A857 0%,#E5B967 100%)" : "rgba(212,168,87,0.42)" }} />
                  </div>
                  <span className="text-xs font-mono font-semibold text-[var(--text-primary)] w-12 flex-shrink-0 tabular-nums">{f.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Insight callout */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card glass-card-hover p-7 mb-8">
          <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(212,168,87,0.12)", border: "1px solid rgba(212,168,87,0.25)" }}>
              <Brain size={16} strokeWidth={1.5} style={{ color: "#D4A857" }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">Why per-ride models?</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[64ch]">
                Attraction identity accounts for 65–71% of feature importance in the combined model — it's basically
                saying "some rides are busier than others." Training per-ride models removes that and lets the temporal
                features do the work. Result: <span className="text-[var(--text-primary)] font-semibold">Hour of Day</span> is
                the top predictor for 13 of 14 rides.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Per-ride model toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D4A857] mb-1">Per-Ride Gradient Boosting</div>
            <p className="text-[var(--text-muted)] text-xs">Individual models trained without the Attraction feature</p>
          </div>
          <motion.button onClick={() => setShowPerRide(!showPerRide)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="text-xs font-semibold px-4 py-2 rounded-lg"
            style={{
              background: showPerRide ? "rgba(212,168,87,0.14)" : "rgba(255,255,255,0.04)",
              color: showPerRide ? "#D4A857" : "var(--text-secondary)",
              border: `1px solid ${showPerRide ? "rgba(212,168,87,0.35)" : "rgba(255,255,255,0.08)"}`,
            }}>
            {showPerRide ? "Hide Details" : "Show All 14 Rides"}
          </motion.button>
        </div>

        <AnimatePresence>
          {showPerRide && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PER_RIDE_MODELS.map((m, i) => {
                  const parkName = RIDES.find((r) => r.name === m.ride)?.park ?? ""
                  const pm = PARK_META[parkName]
                  return (
                    <motion.div key={m.ride} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                      className="glass-card glass-card-hover p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <ParkBadge park={parkName} />
                          <div className="text-sm font-semibold text-[var(--text-primary)] mt-2">{m.ride}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-semibold font-mono tabular-nums" style={{ color: pm?.color ?? "#D4A857" }}>
                            {m.r2.toFixed(3)}
                          </div>
                          <div className="text-[9px] text-[var(--text-muted)] tracking-wide uppercase">R²</div>
                        </div>
                      </div>
                      <div className="h-1 bg-[var(--bar-track)] rounded-full overflow-hidden mb-3">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${m.r2 * 100}%` }}
                          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: i * 0.04 + 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${pm?.color ?? "#D4A857"}55, ${pm?.color ?? "#D4A857"})` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--text-muted)]">MAE: <span className="font-mono font-semibold text-[var(--text-secondary)]">±{m.mae} min</span></span>
                        <span className="text-[var(--text-muted)]">Top: <span className="font-semibold text-[var(--text-secondary)]">{m.topFeature}</span> <span className="font-mono">({m.topPct}%)</span></span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

// ================================================================
// PARK STRATEGIES
// ================================================================

const PARK_STRATEGIES: Record<string, { ride: string; color: string; best: string; tip: string }[]> = {
  "Hollywood Studios": [
    { ride: "Slinky Dog Dash",         color: "#D4A857", best: "9 PM",     tip: "High all day (59–84 min). Peaks at 84 min by 11 AM, lowest at 47 min by 9 PM. Lightning Lane recommended." },
    { ride: "Rock 'n' Roller Coaster", color: "#4A7FC1", best: "8 AM",     tip: "24 min at rope drop, surges to 73 min by 11 AM. Evening after 8 PM drops to ~39 min." },
    { ride: "Toy Story Mania",          color: "#5A9E6F", best: "9 PM",     tip: "30 min at rope drop, peaks at 66 min by 2 PM. Late evening (28 min at 9 PM) is best." },
    { ride: "Alien Swirling Saucers",   color: "#8B6BB5", best: "8 AM",     tip: "18 min at rope drop, peaks at 41 min by 11 AM. Lowest waits in DHS — drops to 15 min by close." },
  ],
  "Magic Kingdom": [
    { ride: "Seven Dwarfs Mine Train",   color: "#4A7FC1", best: "8 AM",     tip: "44 min at rope drop, climbs to 93 min by 1 PM and stays high all day. Rope drop is critical." },
    { ride: "Splash Mountain",            color: "#5A9E6F", best: "8–9 AM",  tip: "10–16 min early morning, peaks at 63 min by 1 PM. Huge morning advantage — ride first." },
    { ride: "Pirates of the Caribbean",   color: "#8B6BB5", best: "8–9 AM",  tip: "8–13 min early morning. Peaks at 41 min by 1 PM. High capacity keeps waits manageable." },
  ],
  "Animal Kingdom": [
    { ride: "Flight of Passage",   color: "#D4A857", best: "8 AM",     tip: "The longest waits in all of WDW — 99–136 min all day. Lowest at rope drop (99 min). Lightning Lane essential." },
    { ride: "Na'vi River Journey",  color: "#5A9E6F", best: "8 AM",     tip: "27 min at rope drop, surges to 77 min by 11 AM. Morning Pandora visit is critical." },
    { ride: "Kilimanjaro Safaris",  color: "#4A7FC1", best: "8 AM",     tip: "14 min at rope drop, peaks at 58 min by 11 AM. Animals are also most active in morning." },
    { ride: "Expedition Everest",   color: "#8B6BB5", best: "8 AM",     tip: "9 min at rope drop, peaks at 44 min by noon. Drops to 16 min by 9 PM — great bookend option." },
    { ride: "DINOSAUR",             color: "#C84A2A", best: "8 AM",     tip: "8 min at rope drop, peaks at 38 min midday. Low waits all day — ride whenever convenient." },
  ],
  "EPCOT": [
    { ride: "Soarin'",         color: "#8B6BB5", best: "8 AM",     tip: "16 min at rope drop, peaks at 59 min by 11 AM. Evening (25 min at 9 PM) is also good." },
    { ride: "Spaceship Earth",  color: "#4A7FC1", best: "8–9 PM",  tip: "6 min at rope drop, peaks at 36 min by 11 AM. Drops to single digits by evening — walk-on after 7 PM." },
  ],
}

// ================================================================
// PARKS SECTION
// ================================================================

function ParksSection() {
  const parkNames = Object.keys(PARK_HOURLY)
  const [activePark, setActivePark] = useState(parkNames[0])
  const [hovered, setHovered] = useState<{ ride: string; hour: string; val: number } | null>(null)

  const hourlyData = PARK_HOURLY[activePark]
  const rides = Object.keys(hourlyData)
  const allVals = rides.flatMap((r) => hourlyData[r])
  const maxVal = Math.max(...allVals)
  const minVal = Math.min(...allVals)
  const parkMeta = PARK_META[activePark]
  const strategies = PARK_STRATEGIES[activePark] ?? []

  return (
    <section id="parks" className="section-ambient relative py-36 px-6">
      <div className="section-divider mb-32" />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          num="06"
          label="Park deep dive"
          title="Hour by hour."
          subtitle="Hourly wait-time heatmaps for every attraction across all four parks. Where the lines are, and when they aren't."
        />

        {/* Park tabs — ghost style, park color as small dot only */}
        <div className="flex flex-wrap gap-2 mb-10">
          {parkNames.map((park) => {
            const m = PARK_META[park]
            const active = activePark === park
            return (
              <button
                key={park}
                onClick={() => { setActivePark(park); setHovered(null) }}
                className="text-xs font-medium px-4 py-2 rounded-full transition-colors duration-[160ms] ease-out inline-flex items-center gap-2"
                style={{
                  background: active ? "rgba(212,168,87,0.08)" : "transparent",
                  color: active ? "#D4A857" : "#A8B2D1",
                  border: `1px solid ${active ? "rgba(212,168,87,0.28)" : "rgba(164,182,215,0.14)"}`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: m?.color }}
                  aria-hidden="true"
                />
                {`${m?.abbrev} · ${park}`}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activePark}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}>

            <TiltCard className="glass-card p-4 sm:p-8 mb-6" intensity={2}>
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: parkMeta?.color ?? "#D4A857" }}>
                Avg Wait (min) · {activePark} · Hourly
              </div>

              {/* Scrollable zone — only the heatmap grid scrolls horizontally.
                  Negative margin + matching padding extends the scroll area
                  to the card's inner edges on mobile while preserving card padding. */}
              <div className="overflow-x-auto -mx-4 sm:-mx-8 px-4 sm:px-8 pb-1">
                <div className="min-w-max">
                  {/* Hour header */}
                  <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `clamp(110px, 22vw, 150px) repeat(${HOURS_LABELS.length}, minmax(34px, 1fr))` }}>
                    <div />
                    {HOURS_LABELS.map((h) => (
                      <div key={h} className="text-[9px] font-mono text-[var(--text-muted)] text-center">{h}</div>
                    ))}
                  </div>
                  {/* Data rows */}
                  {rides.map((ride, ri) => (
                    <motion.div key={ride} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: ri * 0.08 }}
                      className="grid gap-1 mb-1 items-center"
                      style={{ gridTemplateColumns: `clamp(110px, 22vw, 150px) repeat(${HOURS_LABELS.length}, minmax(34px, 1fr))` }}>
                      <div className="text-[11px] text-[var(--text-secondary)] font-medium pr-3 truncate text-right">{ride}</div>
                      {hourlyData[ride].map((val, hi) => (
                        <motion.div key={hi} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: ri * 0.05 + hi * 0.02 }}
                          className="heat-cell aspect-square flex items-center justify-center"
                          style={{ background: getHeatColor(val) }}
                          onMouseEnter={() => setHovered({ ride, hour: HOURS_LABELS[hi], val })}
                          onMouseLeave={() => setHovered(null)}>
                          <span className="text-[9px] font-mono font-semibold text-white/85">{val}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Legend — stays static within the card, never scrolls */}
              <div className="flex items-center gap-3 mt-5 text-[10px] text-[var(--text-muted)]">
                <span>Wait:</span>
                <div className="flex-1 max-w-[180px] h-2 rounded-full"
                  style={{ background: "linear-gradient(90deg,rgba(42,150,68,0.88),rgba(200,146,42,0.88),rgba(180,50,28,0.88))" }} />
                <span>{minVal} min → {maxVal} min</span>
              </div>
              <AnimatePresence>
                {hovered && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-3 text-sm text-[var(--text-primary)]">
                    <span style={{ color: parkMeta?.color ?? "#D4A857" }} className="font-semibold">{hovered.ride}</span>
                    {" · "}{hovered.hour}{" → "}
                    <span className="font-mono font-semibold">{hovered.val} min</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </TiltCard>

            {/* Strategy cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {strategies.map((s, i) => (
                <motion.div key={s.ride} initial={{ opacity: 0, y: 20, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: i * 0.09, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  className="glass-card glass-card-hover p-6 flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: `${s.color}14`, border: `1px solid ${s.color}30` }}>
                    <Clock size={16} style={{ color: s.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{s.ride}</span>
                      <span className="text-[10px] font-semibold font-mono tabular-nums px-2 py-0.5 rounded-md"
                        style={{ background: "rgba(90,158,111,0.12)", color: "#5A9E6F", border: "1px solid rgba(90,158,111,0.25)" }}>
                        {s.best}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.tip}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

// ================================================================
// FOOTER
// ================================================================

function Footer() {
  return (
    <footer className="relative mt-24 pt-20 pb-14 px-6 border-t border-[rgba(164,182,215,0.12)]">
      <div className="max-w-[1360px] mx-auto">
        {/* Editorial masthead — large wordmark + tagline, like a research journal cover */}
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-12 md:gap-16 mb-16">
          {/* Masthead */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Telescope size={22} strokeWidth={1.25} style={{ color: "#F4F0E6" }} />
              <span
                className="font-display text-[var(--text-primary)]"
                style={{
                  fontWeight: 400,
                  fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                  letterSpacing: "-0.015em",
                  fontVariationSettings: '"opsz" 36',
                }}
              >
                Disney Wait Times
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-[46ch]">
              A machine-learning study of <span className="text-[var(--text-primary)]">3,146,086</span> posted wait-time records, across <span className="text-[var(--text-primary)]">14 attractions</span> and <span className="text-[var(--text-primary)]">4 parks</span>, from 2015 through 2021.
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-4">
              By <span className="text-[var(--text-secondary)]">Johnny Nguyen</span>. Independent analysis.
            </p>
          </div>

          {/* Dataset colophon */}
          <div>
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-5" style={{ color: "#D4A857" }}>
              Dataset
            </div>
            <dl className="space-y-3 text-[13px]">
              {[
                ["Source", "TouringPlans.com"],
                ["Records", "3,146,086"],
                ["Range", "2015 – 2021"],
                ["Parks", "MK · EP · DHS · DAK"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[rgba(164,182,215,0.08)] pb-3 last:border-b-0">
                  <dt className="text-[var(--text-muted)]">{k}</dt>
                  <dd className="font-mono tabular-nums text-[var(--text-secondary)] text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Model colophon */}
          <div>
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-5" style={{ color: "#D4A857" }}>
              Model
            </div>
            <dl className="space-y-3 text-[13px]">
              {[
                ["Algorithm", "Gradient Boosting"],
                ["R²", "0.573"],
                ["MAE", "± 17 min"],
                ["Top feature", "Attraction"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[rgba(164,182,215,0.08)] pb-3 last:border-b-0">
                  <dt className="text-[var(--text-muted)]">{k}</dt>
                  <dd className="font-mono tabular-nums text-[var(--text-secondary)] text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Colophon rule */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-[rgba(164,182,215,0.1)] text-[11px] text-[var(--text-muted)]">
          <span className="max-w-[58ch] leading-relaxed">
            Walt Disney World® is a registered trademark of The Walt Disney Company. This is an independent academic analysis; no affiliation or endorsement implied.
          </span>
          <span className="font-mono tabular-nums flex-shrink-0">
            © 2026 · Portfolio
          </span>
        </div>
      </div>
    </footer>
  )
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function Page() {
  const [activeSection, setActiveSection] = useState("hero")

  useEffect(() => {
    const ids = ["hero", "overview", "rides", "predict", "timing", "models", "parks"]
    const observers: IntersectionObserver[] = []
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.3 },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <main className="relative min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="noise-overlay" aria-hidden="true" />
      <div className="ambient-bg-dark" aria-hidden="true" />
      <div className="nebula" aria-hidden="true" />
      <MagicCanvas />
      <CursorSpotlight />
      <Navigation activeSection={activeSection} />
      <HeroSection />
      <OverviewSection />
      <RidesSection />
      <PredictSection />
      <TimingSection />
      <ModelsSection />
      <ParksSection />
      <Footer />
    </main>
  )
}
