"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TileRevealProps extends Omit<React.ComponentProps<"section">, "onProgress"> {
  /** Image URLs laid out row by row into the grid. */
  images: string[]
  /** Content that stays visible through the whole sequence, centred over the tiles. */
  headline?: React.ReactNode
  /** Number of grid columns. */
  columns?: number
  /** Gap between tiles in pixels. */
  gap?: number
  /** Maximum grid width in pixels; shrinks with the stage. */
  gridWidth?: number
  /** Width to height ratio of each tile. */
  tileAspect?: number
  /** Corner radius of each tile in pixels. */
  tileRadius?: number
  /** Render the images in grayscale. */
  grayscale?: boolean
  /** Which edge columns enter through. */
  direction?: "alternate" | "top" | "bottom"
  /** Delay between tiles in a column, relative to one tile's flight time. */
  stagger?: number
  /** How far the zoom phase overlaps the fly-in, as a fraction of one flight. */
  overlap?: number
  /** Scale the grid reaches before the tiles leave the stage. */
  zoom?: number
  /**
   * Minimum push, as a fraction of a tile, the columns and centre rows spread apart.
   * Tiles always travel at least far enough to clear the stage.
   */
  spread?: number
  /** Extra viewport heights of scroll that drive the sequence. */
  scrollLength?: number
  /** Seconds the motion lags behind the scroll position. Zero locks to it. */
  scrub?: number
  /** Gap between the headline and the revealed content in pixels. */
  contentGap?: number
  /** Stage background. */
  backgroundColor?: string
  /** Called with the sequence progress, 0 to 1. */
  onProgress?: (progress: number) => void
  /** Controlled progress (0 to 1) for virtual / wheel-driven sections. */
  progress?: number
}

interface TilePlan {
  /** Resting offset of the tile centre, measured against the stage centre. */
  x: number
  y: number
  /** Push applied while the grid zooms, in unscaled pixels. */
  pushX: number
  pushY: number
  /** -1 enters through the top edge, 1 through the bottom. */
  side: number
  /** Position in its column's launch order. */
  order: number
}

// Smallest margin kept either side of the grid when the stage is narrow.
const MIN_GUTTER = 16
// Centre-column rows part over the back half of the zoom.
const ROW_SPREAD_START = 0.5
// The revealed content fades in over the tail of the zoom, rising this far.
const REVEAL_START = 0.68
const REVEAL_RISE = 12

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2)
const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2

/** The sequence measured in flights: one flight is a single tile's trip into the grid. */
export function tileRevealTimeline(rows: number, stagger: number, overlap: number) {
  const flyEnd = 1 + Math.max(0, stagger) * Math.max(0, rows - 1)
  const zoomStart = Math.max(0, flyEnd - Math.max(0, overlap))
  return { flyEnd, zoomStart, duration: Math.max(flyEnd, zoomStart + 1) }
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

export function TileReveal({
  images,
  headline,
  children,
  columns = 3,
  gap = 28,
  gridWidth = 720,
  tileAspect = 1,
  tileRadius = 12,
  grayscale = true,
  direction = "alternate",
  stagger = 0.06,
  overlap = 0.6,
  zoom = 2.05,
  spread = 0.4,
  scrollLength = 3,
  scrub = 0.08,
  contentGap = 28,
  backgroundColor = "transparent",
  onProgress,
  progress: controlledProgress,
  className,
  style,
  ...props
}: TileRevealProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const tileRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const headlineRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const progressRef = React.useRef<number | null>(null)
  const reportedRef = React.useRef(-1)
  const onProgressRef = React.useRef(onProgress)

  React.useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])

  const count = images.length
  const hasContent = children != null && children !== false

  React.useEffect(() => {
    const stage = stageRef.current
    const section = stage?.parentElement
    if (!stage || !section) return

    const scroller = scrollParent(section)
    const fit = () => {
      if (scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
    }
    fit()

    const report = (prog: number) => {
      if (prog === reportedRef.current) return
      reportedRef.current = prog
      onProgressRef.current?.(prog)
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const content = contentRef.current
      if (content) {
        content.style.opacity = "1"
        content.style.visibility = "visible"
        content.style.pointerEvents = "auto"
      }
      report(1)
      return
    }

    const lag = Math.max(0, scrub)
    const cols = Math.max(1, Math.floor(columns))
    const rows = Math.ceil(count / cols)
    const peak = Math.max(0.01, zoom)
    const delay = Math.max(0, stagger)
    const { zoomStart, duration } = tileRevealTimeline(rows, stagger, overlap)

    let plans: TilePlan[] = []
    let travel = 0
    let lift = 0
    let target = 0
    let raf = 0
    let last = 0

    const layout = () => {
      const stageWidth = stage.clientWidth
      const stageHeight = stage.clientHeight
      const width = Math.max(0, Math.min(gridWidth, stageWidth - 2 * Math.max(gap, MIN_GUTTER)))
      const tileWidth = Math.max(0, (width - gap * (cols - 1)) / cols)
      const tileHeight = tileAspect > 0 ? tileWidth / tileAspect : tileWidth
      const pitchX = tileWidth + gap
      const pitchY = tileHeight + gap
      const gridHeight = rows * tileHeight + gap * Math.max(0, rows - 1)

      travel = (stageHeight + gridHeight) / 2 + 72

      const reachX = stageWidth / (2 * peak) + tileWidth / 2 + gap
      const reachY = stageHeight / (2 * peak) + tileHeight / 2 + gap
      const oddCols = cols % 2 === 1
      const pushX = Math.max(spread * tileWidth, reachX - (oddCols ? pitchX : pitchX / 2))

      plans = []
      for (let i = 0; i < count; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const centreCol = oddCols && col === (cols - 1) / 2
        const fromTop = direction === "top" || (direction === "alternate" && col % 2 === 0)
        const y = (row - (rows - 1) / 2) * pitchY
        const pushY = Math.max(spread * tileHeight, reachY - Math.abs(y))

        plans.push({
          x: (col - (cols - 1) / 2) * pitchX,
          y,
          pushX: centreCol ? 0 : col < (cols - 1) / 2 ? -pushX : pushX,
          pushY: !centreCol ? 0 : row * 2 <= rows - 1 ? -pushY : pushY,
          side: fromTop ? -1 : 1,
          order: fromTop ? rows - 1 - row : row,
        })

        const tile = tileRefs.current[i]
        if (tile) {
          tile.style.width = `${tileWidth}px`
          tile.style.height = `${tileHeight}px`
          tile.style.margin = `${-tileHeight / 2}px 0 0 ${-tileWidth / 2}px`
          tile.style.opacity = "0"
          tile.style.visibility = "hidden"
        }
      }

      const content = contentRef.current
      lift = content ? (content.offsetHeight + contentGap) / 2 : 0
    }

    const measure = () => {
      if (controlledProgress !== undefined) {
        target = clamp(controlledProgress, 0, 1)
        return
      }
      const origin = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0
      const scrolled = origin - section.getBoundingClientRect().top
      const runway = section.offsetHeight - stage.offsetHeight
      target = runway > 0 ? clamp(scrolled / runway, 0, 1) : 0
    }

    const render = (progressVal: number) => {
      const time = progressVal * duration
      const zoomTime = clamp(time - zoomStart, 0, 1)
      const zoomEase = easeInOutCubic(zoomTime)
      const scale = 1 + (peak - 1) * zoomEase
      const rowEase = clamp((zoomTime - ROW_SPREAD_START) / (1 - ROW_SPREAD_START), 0, 1)

      for (let i = 0; i < plans.length; i++) {
        const tile = tileRefs.current[i]
        if (!tile) continue
        const plan = plans[i]
        const flight = clamp(time - plan.order * delay, 0, 1)
        const x = scale * (plan.x + plan.pushX * zoomEase)
        const y = scale * (plan.y + plan.side * travel * (1 - flight) + plan.pushY * rowEase)
        tile.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        const tileOpacity = flight <= 0.02 ? 0 : clamp((flight - 0.02) / 0.14, 0, 1)
        const isVisible = tileOpacity > 0
        tile.style.opacity = `${tileOpacity}`
        tile.style.visibility = isVisible ? "visible" : "hidden"
      }

      const reveal = easeInOutSine(clamp((zoomTime - REVEAL_START) / (1 - REVEAL_START), 0, 1))
      const heading = headlineRef.current
      if (heading) heading.style.transform = `translate3d(0, ${(1 - reveal) * lift}px, 0)`

      const content = contentRef.current
      if (content) {
        content.style.opacity = `${reveal}`
        content.style.transform = `translate3d(0, ${(1 - reveal) * REVEAL_RISE}px, 0)`
        content.style.visibility = reveal > 0 ? "visible" : "hidden"
        content.style.pointerEvents = reveal > 0.5 ? "auto" : "none"
      }

      report(progressVal)
    }

    const tick = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 0.1)
      last = now

      let current = progressRef.current ?? target
      current = lag > 0 ? current + (target - current) * (1 - Math.exp(-dt / lag)) : target
      if (Math.abs(target - current) < 0.0002) current = target

      progressRef.current = current
      render(current)
      raf = current === target ? 0 : requestAnimationFrame(tick)
    }

    const update = () => {
      measure()
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const relayout = () => {
      fit()
      layout()
      measure()
      render(progressRef.current ?? target)
      update()
    }

    layout()
    measure()
    progressRef.current = progressRef.current ?? target
    render(progressRef.current)
    if (progressRef.current !== target) update()

    const observer = new ResizeObserver(relayout)
    observer.observe(stage)
    if (scroller) observer.observe(scroller)
    if (contentRef.current) observer.observe(contentRef.current)
    window.addEventListener("scroll", update, { passive: true, capture: true })
    window.addEventListener("resize", update)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("scroll", update, { capture: true })
      window.removeEventListener("resize", update)
    }
  }, [count, hasContent, columns, gap, gridWidth, tileAspect, direction, stagger, overlap, zoom, spread, scrollLength, scrub, contentGap, controlledProgress])

  return (
    <section
      data-slot="tile-reveal"
      className={cn(
        controlledProgress !== undefined
          ? "relative w-full h-full overflow-hidden"
          : "relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))] motion-reduce:h-[var(--mewo-viewport,100vh)]",
        className
      )}
      style={
        controlledProgress !== undefined
          ? style
          : ({ "--mewo-length": 1 + Math.max(0, scrollLength), ...style } as React.CSSProperties)
      }
      {...props}
    >
      <div
        ref={stageRef}
        className={cn(
          "w-full overflow-hidden",
          controlledProgress !== undefined ? "relative h-full" : "sticky top-0 h-[var(--mewo-viewport,100vh)]"
        )}
        style={{ background: backgroundColor }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            ref={(el) => {
              tileRefs.current[i] = el
            }}
            data-slot="tile-reveal-tile"
            aria-hidden
            className={cn(
              "absolute top-1/2 left-1/2 size-0 bg-contain bg-center bg-no-repeat will-change-transform motion-reduce:hidden drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)]",
              grayscale && "grayscale"
            )}
            style={{ backgroundImage: `url(${JSON.stringify(src)})`, borderRadius: tileRadius, opacity: 0, visibility: "hidden" }}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <div ref={headlineRef} data-slot="tile-reveal-headline" className="will-change-transform">
            {headline}
          </div>
          {hasContent && (
            <div
              ref={contentRef}
              data-slot="tile-reveal-content"
              className="invisible opacity-0"
              style={{ marginTop: contentGap }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default TileReveal;

