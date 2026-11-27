/**
 * IllustratedHero: a full-screen landing hero on a cream paper card. A giant headline sits over a paper-textured
 * meadow scene that sways on its own: the sun's eyes follow the cursor, leaves, flowers, the star and the bird
 * react to hover, and a phone showing a creator page leans on the centre rock (hover it for a new inquiry).
 *
 * Adapted from the "Brusha illustration studio" hero: same artwork and motion, with the studio's image-based
 * wordmark intro and figure replaced by a `logo` node and the drawn phone, and the accent taken from the
 * site's --primary. Styles live in src/styles/illustrated-hero.css.
 *
 * Dependencies: motion (motion/react), lucide-react. Fonts: Archivo (variable width) for the headline, the
 * site's sans for everything else (both loaded in src/index.css).
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ComponentType, CSSProperties, ReactNode, RefObject, SVGProps } from 'react'
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from 'motion/react'
import type { MotionStyle, TargetAndTransition, Transition, Variants } from 'motion/react'
import { ArrowRight, Menu, X } from 'lucide-react'

// Joins the truthy class names
const cn = (...classes: Array<string | false | null | undefined | Array<string | false | undefined>>): string =>
  classes.flat().filter(Boolean).join(' ')

/* ------------------------------ Props ------------------------------ */

export interface IllustratedHeroCta {
  /** Visible label */
  label: string
  /** Link target */
  href: string
}

export interface IllustratedHeroProps {
  /** Brand name, used for the home link's accessible name and as the logo fallback */
  brand?: string
  /** Logo shown in the navbar's home link. Default: the brand name as text */
  logo?: ReactNode
  /** Where the logo links to. Default: '/' */
  homeHref?: string
  /** Navigation links; they sit before the call-to-action on desktop and in a menu on phones. Default: none */
  navLinks?: Array<{ label: string; href: string }>
  /** Hero copy: headline lines, description lines (broken where they break on desktop) and the three buttons */
  copy?: {
    headline: string[]
    description: string[]
    navCta: IllustratedHeroCta
    primaryCta: IllustratedHeroCta
    secondaryCta: IllustratedHeroCta
  }
  /** Forces reduced motion on or off; by default the visitor's prefers-reduced-motion setting is used */
  reducedMotion?: boolean
  /** Extra classes for the outer wrapper */
  className?: string
}

/* ----------------------------- Timing ----------------------------- */

/** Navbar entrance, in seconds: logo, then the links one by one, then the call-to-action */
const NAV_INTRO = {
  logo: 0,
  links: { start: 0.1, stagger: 0.06 },
  cta: 0.3
}

// The hero copy and artwork start right after the navbar
const INTRO_START = 0.15

// One easing for the whole intro, no springs that overshoot: the hero should settle, never bounce
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Load sequence after INTRO_START: headline → description → CTA → background artwork → small details.
 * The last item lands about 1.3s in
 */
const INTRO = {
  duration: 0.75,
  headline: [INTRO_START + 0.08, INTRO_START + 0.15, INTRO_START + 0.22],
  description: INTRO_START + 0.26,
  cta: INTRO_START + 0.34,

  // Background pieces, staggered from here
  artworkStart: INTRO_START + 0.36,
  artworkStagger: 0.02,

  // The phone, a beat after the plants around it
  figure: INTRO_START + 0.6,

  // The sun comes down from above into place
  sun: { delay: INTRO_START + 0.3, duration: 1.3, from: -260 },

  // Bird, trail, star
  detailStart: INTRO_START + 0.68,
  detailStagger: 0.06
}

// Cursor follow for the sun's eyes (mouse/trackpad only)
const GAZE = {
  // Max travel of the sun's eyes, in its own SVG units
  sunEyeX: 7,
  sunEyeY: 4,

  // Overdamped: no overshoot
  eyeSpring: { stiffness: 170, damping: 26, mass: 0.6 }
}

/**
 * Every object sits in one shared 1424 × 457 frame: x / y are its top-left corner and w its width in frame
 * units, its height follows the SVG's proportions and rotate is in degrees. The frame scales with the card
 */
const ILLUSTRATION_FRAME = { width: 1424, height: 457 }

// flip mirrors the piece horizontally (e.g. the left plant cluster reused on the right)
type IllustrationSlotType = { x: number; y: number; w: number; rotate?: number; flip?: boolean }

const ILLUSTRATION_LAYOUT = {
  // Back
  groundBack: { x: 0, y: 0, w: 1424 },
  waves: { x: 0, y: 0, w: 1424 },
  ground: { x: 0, y: 0, w: 1424 },
  yellowCircle: { x: 1206, y: 96, w: 104 },
  star: { x: 1144, y: 56, w: 66 },
  rightPlant: { x: 1276, y: -4, w: 150 },
  leftPlants: { x: 180, y: 156, w: 300 },

  // Middle
  centerLeaves: { x: 728, y: 250, w: 160 },
  bird: { x: 866, y: 50, w: 190 },
  birdTrail: { x: 982, y: 110, w: 206 },

  // Front, right side: the left plant cluster mirrored, a grass band across the front, and flowers
  rightPlants: { x: 1000, y: 146, w: 300, flip: true },

  // The phone, leaning on the centre rock (its base sits on the rock top, ~y 270)
  phone: { x: 560, y: 38, w: 220 },
  grass: { x: 430, y: 310, w: 1710 },

  // Flowers at the stone's right foot, balancing the coral flower and daisies on its left
  pinkFlowerStone: { x: 653, y: 318, w: 142 },
  whiteFlowersStone: { x: 766, y: 316, w: 164 },
  whiteFlowersRight: { x: 1078, y: 258, w: 150 },
  pinkFlowerRight: { x: 1186, y: 302, w: 132 },

  // Scattered gap-fillers, drawn in frame units across x −240…1664
  meadowFlowers: { x: -240, y: 0, w: 1904 },
  sun: { x: -24, y: 160, w: 248 },
  eyeCard: { x: 12, y: 304, w: 184, rotate: -11 },
  whiteFlowers: { x: 260, y: 252, w: 164 },

  // Gap-fillers at the foot of the left plants
  smallFlowers: { x: 210, y: 396, w: 190 },
  pinkFlower: { x: 402, y: 306, w: 142 }
} satisfies Record<string, IllustrationSlotType>

interface HeroContextValue {
  BRAND: string
  LOGO: ReactNode
  HOME_HREF: string
  NAV_LINKS: Array<{ label: string; href: string }>
  COPY: NonNullable<IllustratedHeroProps['copy']>
  REDUCED: boolean | undefined
}

const HeroContext = createContext<HeroContextValue | null>(null)

const useHero = () => {
  const value = useContext(HeroContext)

  if (!value) throw new Error('IllustratedHero parts must render inside <IllustratedHero>')

  return value
}

// The visitor's reduced-motion setting, unless the reducedMotion prop forces it
const useReduce = () => {
  const { REDUCED } = useHero()
  const system = useReducedMotion()

  return REDUCED ?? system
}

/* ----------------------------- Motion ----------------------------- */

/**
 * An idle loop as `run`, `rest` and `still` variants, played by the illustration's `animate` label:
 * `run` loops, `rest` holds the loop's first pose (off screen or tab hidden), and `still` (reduced motion)
 * leaves the element untransformed. Each loop is one `transform` string, so Motion runs it on the compositor
 */
type LoopType = { variants: Variants; initial: TargetAndTransition }

const LOOPS_RUN = 'run'
const LOOPS_REST = 'rest'
const LOOPS_STILL = 'still'

// `initial` gives Motion a starting value: without one it writes transform="undefined" on SVG elements
const idleLoop = (frames: string[], transition: Transition): LoopType => ({
  initial: { transform: frames[0] },
  variants: {
    [LOOPS_RUN]: { transform: frames, transition },
    [LOOPS_REST]: { transform: frames[0], transition: { duration: 0 } },
    [LOOPS_STILL]: { transform: frames[0].replace(/-?\d+(\.\d+)?(?=px|deg)/g, '0'), transition: { duration: 0 } }
  }
})

// Back-and-forth loop: out and back as one keyframe run, so it stays native
const mirrorLoop = (from: string, to: string, transition: Transition): LoopType =>
  idleLoop([from, to, from], {
    ...transition,
    duration: (transition.duration ?? 0) * 2,
    repeat: Infinity,
    ease: ['easeInOut', 'easeInOut']
  })

// The pivot for an SVG element's rotate / scale: its own box, at origin x / y (0 to 1)
const fillBox = (x: number, y: number) =>
  ({ transformBox: 'fill-box', transformOrigin: `${+(x * 100).toFixed(2)}% ${+(y * 100).toFixed(2)}%` }) as const

// Return to rest when the hover ends: a soft ease, never a spring overshoot
const SETTLE: Transition = { duration: 0.45, ease: EASE }

// A single leaf, as if lightly brushed: left → right → small rebound → centre. Pivots at the leaf's base
const LEAF_SWAY: TargetAndTransition = {
  rotate: [0, 6, -5, 2, 0],
  transition: { duration: 1.1, ease: 'easeInOut' }
}

const LEAF_ORIGIN = { originX: 0.5, originY: 1 }

// A flower head grows a little and holds while hovered
const FLOWER_POP: TargetAndTransition = {
  scale: 1.1,
  transition: { duration: 0.35, ease: EASE }
}

// Both suns grow a little while hovered
const SUN_POP: TargetAndTransition = {
  scale: 1.12,
  transition: { duration: 0.4, ease: EASE }
}

// The spiky sun's rays turn slowly, a full circle every minute
const SUN_SPIN = idleLoop(['rotate(0deg)', 'rotate(360deg)'], { duration: 60, repeat: Infinity, ease: 'linear' })

// The eye card blinks when hovered (a quick blink, then a softer second one)
const EYE_BLINK: TargetAndTransition = {
  scaleY: [1, 0.06, 1, 1, 0.06, 1],
  transition: { duration: 0.75, times: [0, 0.14, 0.32, 0.6, 0.74, 1], ease: 'easeInOut' }
}

// The star grows a little while hovered
const STAR_POP: TargetAndTransition = {
  scale: 1.2,
  transition: { duration: 0.35, ease: EASE }
}

/**
 * Idle sway, left ↔ right, each plant on its own tempo, direction and start (from `seed`) so the garden never
 * moves in lockstep. `amp` is the lean each way in degrees
 */
const plantSway = (amp: number, seed: number): LoopType => {
  const lean = (deg: number) => `rotate(${deg}deg)`

  return mirrorLoop(seed % 2 ? lean(amp) : lean(-amp), seed % 2 ? lean(-amp) : lean(amp), {
    duration: 1 + (seed % 5) * 0.35,
    delay: (seed % 4) * 0.25
  })
}

// Idle float for the star
const STAR_FLOAT = mirrorLoop('translateY(-4px)', 'translateY(4px)', { duration: 2.6 })

// Bluebird in flight, holding its position: the body hovers, the wing beats, the tail flutters
const BIRD_HOVER = mirrorLoop('translateY(-5px)', 'translateY(5px)', { duration: 2.6 })
const WING_FLAP = mirrorLoop('rotate(26deg)', 'rotate(-18deg)', { duration: 1.4 })
const WING_ORIGIN = fillBox(0.09, 0.9)
const TAIL_FLUTTER = mirrorLoop('rotate(-3deg)', 'rotate(3deg)', { duration: 0.9 })
const TAIL_ORIGIN = fillBox(0, 0.12)

// A sway pivots at its base, as LEAF_ORIGIN does for the hover
const LEAF_BOX = fillBox(0.5, 1)

// Hover: the bird bobs once, like a stronger wingbeat
const BIRD_BOB: TargetAndTransition = {
  y: [0, -12, 3, -5, 0],
  transition: { duration: 1.3, ease: 'easeInOut' }
}

// The phone rocks very gently on the rock, as if it was just propped there
const PHONE_ROCK = mirrorLoop('rotate(-1.2deg)', 'rotate(1.2deg)', { duration: 3.2 })

/* ----------------------------- Artwork ----------------------------- */

const { PaperGroundShapes, BLUE_HILLS } = (() => {
  // Blue hill outlines, shared with PaperBlueWaves, which draws the drifting ripples clipped to them
  const BLUE_HILLS = [
    {
      id: 'lumora-waves-left-edge',
      clip: 'M-720 457 L -720 300 C -560 286, -380 298, -240 290 C -180 270, -80 258, -10 276 C 50 292, 100 318, 120 360 L 130 457 Z',
      x0: -720,
      x1: 130,
      y0: 258,
      y1: 457
    },
    {
      id: 'lumora-waves-left',
      clip: 'M92 457 C 96 360, 128 282, 196 258 C 236 244, 268 262, 300 250 C 352 230, 392 214, 446 228 C 508 244, 548 290, 556 352 C 562 400, 560 430, 560 457 Z',
      x0: 92,
      x1: 560,
      y0: 214,
      y1: 457
    },
    {
      id: 'lumora-waves-right',
      clip: 'M700 457 C 706 360, 760 300, 840 284 C 900 272, 950 262, 1010 250 C 1060 240, 1100 238, 1140 238 C 1200 236, 1300 220, 1350 226 C 1400 232, 1424 250, 1440 262 L 2140 262 L 2140 457 Z',
      x0: 700,
      x1: 2140,
      y0: 220,
      y1: 457
    },
    {
      id: 'lumora-waves-right-edge',
      clip: 'M1288 457 C 1292 380, 1330 330, 1384 322 C 1404 320, 1418 324, 1424 328 L 2140 330 V457 Z',
      x0: 1288,
      x1: 2140,
      y0: 320,
      y1: 457
    }
  ]

  const CORNER_LEAVES = [
    { x: -150, y: 470, angle: -18, len: 170, half: 46, fill: '#428458', vein: '#8fbb84' },
    { x: -70, y: 470, angle: 8, len: 196, half: 50, fill: '#28633c', vein: '#6f9f6a' },
    { x: -10, y: 470, angle: 34, len: 150, half: 44, fill: '#428458', vein: '#8fbb84' },
    { x: -210, y: 470, angle: -46, len: 130, half: 42, fill: '#28633c', vein: '#6f9f6a' },
    { x: 176, y: 470, angle: -34, len: 132, half: 50, fill: '#28633c', vein: '#4f9466' },
    { x: 250, y: 470, angle: 18, len: 124, half: 48, fill: '#2f6b44', vein: '#6f9f6a' },
    { x: 120, y: 470, angle: -70, len: 96, half: 40, fill: '#2f6b44', vein: '#6f9f6a' },
    { x: 1352, y: 470, angle: -28, len: 120, half: 48, fill: '#28633c', vein: '#4f9466' },
    { x: 1420, y: 470, angle: 22, len: 116, half: 46, fill: '#2f6b44', vein: '#6f9f6a' }
  ]

  // Broad leaf with a rounded tip
  const roundLeaf = (len: number, half: number) =>
    `M0 0 C ${half * 1.25} ${-len * 0.2} ${half * 1.1} ${-len * 0.95} 0 ${-len} C ${-half * 1.1} ${-len * 0.95} ${-half * 1.25} ${-len * 0.2} 0 0 Z`

  type PaperGroundShapesProps = SVGProps<SVGSVGElement> & {
    // 'back': the blue hills only; 'front': rock, bushes and leaves. The ripples go between. Omitted: everything
    layer?: 'back' | 'front'
  }

  /**
   * The ground the composition grows from: blue and green paper hills, the sandy centre rock and broad leaves in
   * both bottom corners. Its edges run out to x −720…2140, so very wide, short screens never see where they end
   */
  const PaperGroundShapes = ({ layer, ...props }: PaperGroundShapesProps) => {
    return (
      <svg viewBox='0 0 1424 457' aria-hidden {...props}>
        {layer !== 'front' && (
          <>
            <g id='left-edge-fill'>
              <path
                d='M-720 457 L -720 300 C -560 286, -380 298, -240 290 C -180 270, -80 258, -10 276 C 50 292, 100 318, 120 360 L 130 457 Z'
                fill='#7fc9f0'
              />
              <path d='M-200 300 C -150 282, -80 278, -30 290 C -70 306, -140 312, -200 300 Z' fill='#b6daed' />
              <path
                d='M-560 296 C -500 284, -420 284, -370 292 C -420 304, -500 306, -560 296 Z'
                fill='#b6daed'
                opacity='0.8'
              />
              <path
                d='M-720 457 L -720 392 C -560 380, -400 374, -260 384 C -200 362, -160 352, -110 352 C -40 350, 30 380, 70 457 Z'
                fill='#2f6b44'
              />
              <path d='M-190 392 C -150 372, -96 370, -60 386 C -100 402, -150 404, -190 392 Z' fill='#4f9466' />
            </g>

            <g id='left-blue-hill'>
              <path
                d='M92 457 C 96 360, 128 282, 196 258 C 236 244, 268 262, 300 250 C 352 230, 392 214, 446 228 C 508 244, 548 290, 556 352 C 562 400, 560 430, 560 457 Z'
                fill='#7fc9f0'
              />
              <path
                d='M300 252 C 352 232, 400 220, 450 232 C 470 250, 446 280, 404 286 C 360 292, 316 280, 300 252 Z'
                fill='#b6daed'
              />
              <path
                d='M120 360 C 140 320, 190 300, 230 316 C 250 340, 220 372, 180 380 C 150 386, 124 380, 120 360 Z'
                fill='#b6daed'
                opacity='0.8'
              />
              <path
                d='M470 300 C 500 296, 534 318, 546 352 C 520 362, 486 350, 470 300 Z'
                fill='#5fb3ea'
                opacity='0.45'
              />
              <path
                id='left-edge-blue'
                d='M-40 352 C -30 300, 10 270, 50 282 C 80 292, 84 330, 60 350 C 30 368, -10 366, -40 352 Z'
                fill='#7fc9f0'
              />
            </g>

            <g id='right-meadow-hill'>
              <path
                d='M700 457 C 706 360, 760 300, 840 284 C 900 272, 950 262, 1010 250 C 1060 240, 1100 238, 1140 238 C 1200 236, 1300 220, 1350 226 C 1400 232, 1424 250, 1440 262 L 2140 262 L 2140 457 Z'
                fill='#7fc9f0'
              />
              <path d='M1090 250 C 1140 232, 1210 236, 1250 250 C 1210 266, 1140 268, 1090 250 Z' fill='#b6daed' />
              <path
                d='M1290 238 C 1330 226, 1380 230, 1410 244 C 1374 254, 1326 252, 1290 238 Z'
                fill='#b6daed'
                opacity='0.8'
              />
              <path d='M880 300 C 910 282, 950 276, 980 284 C 950 300, 914 308, 880 300 Z' fill='#b6daed' opacity='0.8' />
              <path
                d='M760 360 C 780 330, 810 318, 834 326 C 814 348, 786 362, 760 360 Z'
                fill='#5fb3ea'
                opacity='0.45'
              />
            </g>

            <g id='right-blue-hill'>
              <path
                d='M1288 457 C 1292 380, 1330 330, 1384 322 C 1404 320, 1418 324, 1424 328 L 2140 330 V457 Z'
                fill='#7fc9f0'
              />
              <path
                d='M1336 360 C 1360 340, 1396 338, 1424 348 V392 C 1394 396, 1356 384, 1336 360 Z'
                fill='#7fc9f0'
                opacity='0.7'
              />
              <path
                id='right-sky-patch'
                d='M1330 300 C 1334 252, 1372 222, 1424 218 L 2140 216 V 336 L 1330 336 Z'
                fill='#b6daed'
              />
            </g>
          </>
        )}

        {layer !== 'back' && (
          <>
            <g id='centre-rock'>
              <path
                d='M420 457 C 424 378, 470 302, 560 280 C 620 266, 720 264, 792 280 C 872 300, 914 372, 922 457 Z'
                fill='#eedfcd'
              />
              <path d='M486 326 C 540 296, 630 282, 724 286 C 650 304, 566 318, 486 326 Z' fill='#f6ecde' />
              <path
                d='M860 360 C 884 390, 900 420, 906 452'
                fill='none'
                stroke='#dccbb3'
                strokeWidth='4'
                strokeLinecap='round'
                opacity='0.6'
              />
              <g fill='#dccbb3' opacity='0.7'>
                <circle cx='560' cy='420' r='2.2' />
                <circle cx='610' cy='398' r='1.8' />
                <circle cx='680' cy='432' r='2.4' />
                <circle cx='742' cy='404' r='1.6' />
                <circle cx='800' cy='436' r='2' />
                <circle cx='640' cy='446' r='1.6' />
                <circle cx='716' cy='330' r='1.8' />
                <circle cx='600' cy='350' r='2' />
                <circle cx='800' cy='340' r='1.6' />
                <circle cx='536' cy='440' r='1.4' />
              </g>
            </g>

            <g id='front-bushes'>
              <path
                d='M128 457 C 132 412, 176 372, 232 368 C 270 366, 296 384, 320 380 C 360 372, 420 368, 460 396 C 484 414, 490 440, 488 457 Z'
                fill='#2f6b44'
              />
              <path d='M180 400 C 216 382, 268 384, 296 404 C 260 418, 210 418, 180 400 Z' fill='#4f9466' />
              <path
                d='M1290 457 C 1296 420, 1330 392, 1376 388 C 1400 386, 1416 390, 1424 394 L 2140 396 V457 Z'
                fill='#2f6b44'
              />
              <path d='M1318 420 C 1346 404, 1388 402, 1414 414 C 1390 428, 1346 432, 1318 420 Z' fill='#4f9466' />
              <path
                id='bush-under-flower'
                d='M1150 457 C 1168 418, 1218 400, 1268 406 C 1300 412, 1312 438, 1314 457 Z'
                fill='#28633c'
              />
            </g>

            <g id='corner-leaves'>
              {CORNER_LEAVES.map((leaf, i) => (
                <g key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
                  {/* idle: sways on its own tempo; hover: this leaf alone sways harder. Both pivot at its base */}
                  <m.g {...plantSway(2.5, i + 3)} style={LEAF_BOX}>
                    <m.g whileHover={LEAF_SWAY} transition={SETTLE} style={LEAF_ORIGIN}>
                      <path d={roundLeaf(leaf.len, leaf.half)} fill={leaf.fill} />
                      <g fill='none' stroke={leaf.vein} strokeWidth='2' strokeLinecap='round'>
                        <path d={`M0 -4 L0 ${-leaf.len * 0.9}`} />
                        <path
                          d={`M0 ${-leaf.len * 0.35} L ${leaf.half * 0.6} ${-leaf.len * 0.55} M0 ${-leaf.len * 0.35} L ${-leaf.half * 0.6} ${-leaf.len * 0.55}`}
                        />
                        <path
                          d={`M0 ${-leaf.len * 0.6} L ${leaf.half * 0.5} ${-leaf.len * 0.78} M0 ${-leaf.len * 0.6} L ${-leaf.half * 0.5} ${-leaf.len * 0.78}`}
                        />
                      </g>
                    </m.g>
                  </m.g>
                </g>
              ))}
            </g>
          </>
        )}
      </svg>
    )
  }

  return { PaperGroundShapes, BLUE_HILLS }
})()

const { PaperBlueWaves } = (() => {
  // One period of a wave, in frame units; travelling exactly one period loops seamlessly
  const PERIOD = 80

  const wavePath = (x: number, y: number, cycles: number) =>
    `M${x} ${y} q ${PERIOD / 4} -5 ${PERIOD / 2} 0 ` +
    Array.from({ length: cycles * 2 - 1 }, () => `t ${PERIOD / 2} 0`).join(' ')

  // Water-like ripples clipped to the blue hills, drifting sideways forever (alternate rows in opposite directions)
  const PaperBlueWaves = (props: SVGProps<SVGSVGElement>) => {
    return (
      <svg viewBox='0 0 1424 457' aria-hidden {...props}>
        {BLUE_HILLS.map(({ id, clip, x0, x1, y0, y1 }) => {
          const rows = Array.from({ length: Math.floor((y1 - y0) / 30) }, (_, i) => y0 + 18 + i * 30)
          const start = x0 - PERIOD * 2
          const cycles = Math.ceil((x1 - start) / PERIOD) + 2

          return (
            <g key={id}>
              <clipPath id={id}>
                <path d={clip} />
              </clipPath>
              <g
                clipPath={`url(#${id})`}
                fill='none'
                stroke='#dcf1fc'
                strokeWidth='2.4'
                strokeLinecap='round'
                opacity='0.6'
              >
                {rows.map((y, i) => (
                  <m.g
                    key={y}
                    {...idleLoop(['translateX(0px)', `translateX(${i % 2 ? PERIOD : -PERIOD}px)`], {
                      duration: 5 + (i % 3) * 1.5,
                      repeat: Infinity,
                      ease: 'linear'
                    })}
                  >
                    <path d={wavePath(start + (i % 2) * (PERIOD / 2), y, cycles)} />
                  </m.g>
                ))}
              </g>
            </g>
          )
        })}
      </svg>
    )
  }

  return { PaperBlueWaves }
})()

// Looping ink line trailing behind the bird
const PaperBirdTrail = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 206 96' fill='none' aria-hidden {...props}>
      <path
        d='M2 46 C 30 30, 60 14, 92 8 C 118 4, 128 14, 108 22 C 84 32, 82 46, 110 40 C 140 34, 132 54, 112 58 C 96 62, 108 72, 136 68 C 168 64, 196 66, 200 80 C 202 90, 190 93, 186 85'
        stroke='#141414'
        strokeWidth='2.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Paper-cut bluebird flying left: the body hovers, the wing flaps from the shoulder, the tail flutters
const PaperBlueBird = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 190 168' aria-hidden {...props}>
      <m.g id='bird-flight' {...BIRD_HOVER}>
        <m.g id='bird' whileHover={BIRD_BOB} transition={SETTLE}>
          <m.g id='tail' {...TAIL_FLUTTER} style={TAIL_ORIGIN}>
            <path
              d='M100 112 C 130 110, 160 104, 186 108 C 172 116, 162 120, 154 124 C 168 132, 174 140, 176 148 C 158 146, 146 142, 138 140 C 142 150, 140 160, 136 168 C 120 152, 108 134, 100 112 Z'
              fill='#3a98e8'
            />
            <path
              d='M120 120 L 170 112 M122 128 L 160 140 M118 132 L 134 158'
              stroke='#2e86d6'
              strokeWidth='1.5'
              opacity='0.7'
            />
          </m.g>

          <g id='body'>
            <ellipse cx='94' cy='98' rx='52' ry='30' transform='rotate(-12 94 98)' fill='#57acfa' />
            <path d='M50 104 C 70 122, 104 128, 130 116 C 108 136, 70 132, 50 104 Z' fill='#8cc4fb' />
          </g>

          <m.g id='wing' {...WING_FLAP} style={WING_ORIGIN}>
            <path
              d='M70 80 C 80 50, 110 20, 160 4 C 150 20, 150 30, 142 38 C 160 34, 172 36, 178 40 C 162 52, 152 58, 142 64 C 152 66, 158 72, 160 76 C 130 88, 100 92, 70 80 Z'
              fill='#68b2f8'
            />
            <path
              d='M84 74 L 150 14 M96 80 L 166 42 M108 84 L 152 72'
              stroke='#3a98e8'
              strokeWidth='1.5'
              opacity='0.7'
            />
          </m.g>

          <g id='head'>
            <circle cx='48' cy='80' r='25' fill='#57acfa' />
            <path id='beak' d='M26 75 L 1 85 L 26 91 Z' fill='#fd744a' />
            <circle id='eye' cx='42' cy='74' r='3.2' fill='#141414' />
          </g>
        </m.g>
      </m.g>
    </svg>
  )
}

type LeafType = { x: number; y: number; angle: number; len: number; half: number; tone: 'dark' | 'mid' }

const LEAF_TONES = {
  dark: { fill: '#28633c', light: '#336f45', vein: '#6f9f6a' },
  mid: { fill: '#428458', light: '#4f9466', vein: '#8fbb84' }
}

const leafPath = (len: number, half: number) =>
  `M0 0 C ${half} ${-len * 0.22} ${half * 0.8} ${-len * 0.7} 0 ${-len} C ${-half * 0.8} ${-len * 0.7} ${-half} ${-len * 0.22} 0 0 Z`

const halfLeafPath = (len: number, half: number) =>
  `M0 0 C ${half} ${-len * 0.22} ${half * 0.8} ${-len * 0.7} 0 ${-len} Z`

// One lance leaf: idle sway on its own tempo, and a harder sway when hovered. Both pivot at its base
const SwayingLeaf = ({ leaf, seed }: { leaf: LeafType; seed: number }) => {
  const tone = LEAF_TONES[leaf.tone]

  return (
    <g transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
      <m.g {...plantSway(4, seed)} style={LEAF_BOX}>
        <m.g whileHover={LEAF_SWAY} transition={SETTLE} style={LEAF_ORIGIN}>
          <path d={leafPath(leaf.len, leaf.half)} fill={tone.fill} />
          <path d={halfLeafPath(leaf.len, leaf.half)} fill={tone.light} />
          <path d={`M0 0 L0 ${-leaf.len * 0.9}`} stroke={tone.vein} strokeWidth='1.5' strokeLinecap='round' />
        </m.g>
      </m.g>
    </g>
  )
}

// A clump of leaves just right of the centre rock
const CENTER_LEAVES: LeafType[] = [
  { x: 40, y: 207, angle: -6, len: 168, half: 30, tone: 'mid' },
  { x: 58, y: 207, angle: 14, len: 120, half: 24, tone: 'dark' },
  { x: 118, y: 207, angle: 22, len: 104, half: 24, tone: 'dark' },
  { x: 128, y: 207, angle: -18, len: 84, half: 20, tone: 'mid' }
]

const PaperCenterLeaves = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 160 207' aria-hidden {...props}>
      <m.g {...plantSway(2.5, 4)} style={fillBox(0.45, 1)}>
        {CENTER_LEAVES.map((leaf, i) => (
          <SwayingLeaf key={i} leaf={leaf} seed={i + 2} />
        ))}
      </m.g>
    </svg>
  )
}

// Taped paper card with an ink-drawn eye that blinks when the card is hovered
const PaperEyeCard = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 200 176' aria-hidden {...props}>
      <m.g id='eye-card' whileHover='blink'>
        <g id='card'>
          <rect x='6' y='14' width='188' height='162' rx='3' fill='#f8ede0' />
          <rect x='6' y='14' width='188' height='162' rx='3' fill='none' stroke='#ece0cf' strokeWidth='1.5' />
        </g>

        <g id='tape'>
          <rect x='16' y='2' width='30' height='42' rx='2' fill='#fdd15f' opacity='0.92' transform='rotate(-14 31 23)' />
        </g>

        <g id='eye-drawing' fill='none' stroke='#141414' strokeLinecap='round' strokeLinejoin='round'>
          <path id='brow' d='M56 60 C 80 44, 118 42, 146 56' strokeWidth='6' />
          <path id='lower-lid' d='M50 104 C 80 122, 124 122, 152 102' strokeWidth='2.5' />
          <m.g
            id='eye-open'
            variants={{ blink: EYE_BLINK }}
            style={{ transformBox: 'view-box', transformOrigin: '104px 114px' }}
          >
            <path id='lid' d='M46 104 C 72 74, 124 70, 156 100' strokeWidth='4' />
            <circle id='iris' cx='104' cy='98' r='18' fill='#141414' stroke='none' />
            <circle cx='110' cy='92' r='4' fill='#f8ede0' stroke='none' />
          </m.g>
          <g id='lashes' strokeWidth='2.2'>
            <path d='M64 114 L 58 126' />
            <path d='M78 119 L 74 132' />
            <path d='M94 121 L 92 134' />
            <path d='M110 121 L 111 134' />
            <path d='M126 118 L 129 130' />
            <path d='M140 112 L 145 123' />
          </g>
        </g>
      </m.g>
    </svg>
  )
}

const { PaperGrass } = (() => {
  // A band of grass from the front of the centre rock to the right edge (viewBox x 430…2140, y 310…457)
  const GREENS = ['#28633c', '#428458', '#2f6b44', '#4f9466']
  const GROUND = 457

  const heightAt = (x: number, i: number) => {
    const wobble = [0, 14, -8, 20, -4, 10, -12][i % 7]

    // Low in front of the stone, so it shows above
    if (x < 930) return 44 + wobble * 0.6

    return 62 + wobble
  }

  const blade = (x: number, h: number, lean: number, w: number) =>
    `M${x - w} ${GROUND} C ${x - w * 0.4} ${GROUND - h * 0.5}, ${x + lean * 0.6} ${GROUND - h * 0.85}, ${x + lean} ${GROUND - h} C ${x + lean * 0.4} ${GROUND - h * 0.6}, ${x + w * 0.6} ${GROUND - h * 0.3}, ${x + w} ${GROUND} Z`

  // Blades per swaying clump
  const CLUMP = 6

  const BLADES = Array.from({ length: 122 }, (_, i) => {
    const x = 440 + i * 14 + ((i * 7) % 5)
    const lean = [-10, 8, -4, 12, -7, 5, -12, 9][i % 8]

    return { x, h: heightAt(x, i), lean, w: (x < 820 ? 7 : 5) + (i % 3), fill: GREENS[i % GREENS.length] }
  })

  const CLUMPS = Array.from({ length: Math.ceil(BLADES.length / CLUMP) }, (_, c) =>
    BLADES.slice(c * CLUMP, c * CLUMP + CLUMP)
  )

  const PaperGrass = (props: SVGProps<SVGSVGElement>) => {
    return (
      <svg viewBox='430 310 1710 147' aria-hidden {...props}>
        <path
          id='grass-mound'
          d='M432 457 C 436 432, 460 422, 500 420 C 640 416, 800 416, 920 414 C 1000 414, 1300 410, 2140 412 L 2140 457 Z'
          fill='#2f6b44'
        />
        {CLUMPS.map((clump, c) => (
          <m.g key={c} id={`grass-clump-${c}`} {...plantSway(2.5, c + 20)} style={fillBox(0.5, 1)}>
            {clump.map(b => (
              <path key={b.x} d={blade(b.x, b.h, b.lean, b.w)} fill={b.fill} />
            ))}
          </m.g>
        ))}
      </svg>
    )
  }

  return { PaperGrass }
})()

// Cluster of tall cut-paper leaves behind the white and pink flowers
const LEFT_PLANT_LEAVES: LeafType[] = [
  // far left, leaning out
  { x: 46, y: 304, angle: -40, len: 128, half: 22, tone: 'dark' },
  { x: 66, y: 304, angle: -16, len: 176, half: 26, tone: 'mid' },
  { x: 92, y: 304, angle: -28, len: 150, half: 24, tone: 'dark' },

  // tall centre leaf, with a broad lighter one beside it
  { x: 116, y: 304, angle: -3, len: 262, half: 34, tone: 'dark' },
  { x: 142, y: 304, angle: 12, len: 206, half: 32, tone: 'mid' },
  { x: 200, y: 304, angle: 26, len: 150, half: 24, tone: 'dark' },

  // pair reaching up and right
  { x: 176, y: 112, angle: 36, len: 112, half: 20, tone: 'dark' },
  { x: 182, y: 140, angle: 64, len: 104, half: 19, tone: 'mid' },

  // low leaves at the pink flower's foot
  { x: 232, y: 304, angle: -14, len: 96, half: 20, tone: 'mid' },
  { x: 262, y: 304, angle: 34, len: 98, half: 20, tone: 'dark' }
]

const PaperLeftPlants = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 300 304' aria-hidden {...props}>
      <m.g {...plantSway(2.5, 1)} style={fillBox(0.4, 1)}>
        <g id='stems' fill='none' stroke='#28633c' strokeWidth='4' strokeLinecap='round'>
          <path d='M168 304 C 168 240, 172 180, 178 120' />
        </g>
        <g id='leaves'>
          {LEFT_PLANT_LEAVES.map((leaf, i) => (
            <SwayingLeaf key={i} leaf={leaf} seed={i} />
          ))}
        </g>
      </m.g>
    </svg>
  )
}

const { PaperMeadowFlowers } = (() => {
  type FlowerType = {
    id: string
    x: number
    y: number
    petals: number
    len: number
    half: number
    fill: string
    stroke?: string
    core: number
    leaf?: 'left' | 'right'
    sway: number
    seed: number
  }

  const FLOWERS: FlowerType[] = [
    // far left, beside the sun (wide screens)
    { id: 'meadow-flower-left-high', x: -97, y: 376, petals: 5, len: 14, half: 7, fill: '#ffffff', stroke: '#e6e3da', core: 4, leaf: 'right', sway: 4, seed: 10 },
    { id: 'meadow-flower-left-low', x: -28, y: 431, petals: 6, len: 11, half: 5.5, fill: '#fec430', core: 3.5, leaf: 'left', sway: 4.5, seed: 11 },

    // in the grass over the front of the centre rock
    { id: 'meadow-flower-rock-coral', x: 548, y: 418, petals: 6, len: 12, half: 6, fill: '#fd9d82', core: 3.8, leaf: 'right', sway: 4.5, seed: 16 },
    { id: 'meadow-flower-rock-white', x: 618, y: 424, petals: 5, len: 13, half: 6.5, fill: '#ffffff', stroke: '#e6e3da', core: 4, leaf: 'left', sway: 4, seed: 17 },

    // between the centre leaves
    { id: 'meadow-flower-centre', x: 822, y: 408, petals: 6, len: 17, half: 8, fill: '#fd9d82', core: 5, leaf: 'left', sway: 4, seed: 12 },

    // in the right-hand meadow
    { id: 'meadow-flower-purple-foot', x: 1224, y: 417, petals: 5, len: 18, half: 8.5, fill: '#ffffff', stroke: '#e6e3da', core: 5.5, leaf: 'right', sway: 4, seed: 13 },

    // on the right hill, a tall-stemmed bloom (wide screens)
    { id: 'meadow-flower-right-tall', x: 1456, y: 282, petals: 5, len: 22, half: 10, fill: '#c39cf0', core: 6, leaf: 'left', sway: 3, seed: 14 },

    // far right foot (wide screens)
    { id: 'meadow-flower-right-low', x: 1489, y: 411, petals: 6, len: 14, half: 6.5, fill: '#fd9d82', core: 4, leaf: 'right', sway: 4.5, seed: 15 }
  ]

  // Stems run down to the frame's bottom edge
  const GROUND = 457

  const petal = (len: number, half: number) =>
    `M0 0 C ${half} ${-len * 0.3} ${half} ${-len * 0.85} 0 ${-len} C ${-half} ${-len * 0.85} ${-half} ${-len * 0.3} 0 0 Z`

  const stemLeaf = (f: FlowerType) => {
    const y = f.y + (GROUND - f.y) * 0.55
    const dir = f.leaf === 'left' ? -1 : 1

    return `M${f.x} ${y} C ${f.x + dir * 10} ${y - 9}, ${f.x + dir * 22} ${y - 8}, ${f.x + dir * 26} ${y - 2} C ${f.x + dir * 18} ${y + 4}, ${f.x + dir * 8} ${y + 4}, ${f.x} ${y} Z`
  }

  // Extra flowers filling the meadow's gaps (viewBox x −240…1664, so the ones past the edges show on wide screens)
  const PaperMeadowFlowers = (props: SVGProps<SVGSVGElement>) => {
    return (
      <svg viewBox='-240 0 1904 457' aria-hidden {...props}>
        {FLOWERS.map(f => (
          <m.g key={f.id} id={f.id} {...plantSway(f.sway, f.seed)} style={fillBox(0.5, 1)}>
            <path
              d={`M${f.x} ${f.y + 4} C ${f.x - 1} ${f.y + (GROUND - f.y) * 0.4}, ${f.x + 2} ${f.y + (GROUND - f.y) * 0.7}, ${f.x + 1} ${GROUND}`}
              fill='none'
              stroke='#2f6b44'
              strokeWidth='3'
              strokeLinecap='round'
            />
            {f.leaf && <path d={stemLeaf(f)} fill='#428458' />}
            <m.g whileHover={FLOWER_POP} transition={SETTLE}>
              <g transform={`translate(${f.x} ${f.y})`}>
                {Array.from({ length: f.petals }, (_, i) => (
                  <path
                    key={i}
                    d={petal(f.len, f.half)}
                    transform={`rotate(${(360 / f.petals) * i + 18})`}
                    fill={f.fill}
                    stroke={f.stroke ?? 'none'}
                    strokeWidth='1.2'
                  />
                ))}
                <circle r={f.core} fill='#fec108' />
                <circle r={f.core * 0.45} cx={-f.core * 0.2} cy={-f.core * 0.2} fill='#fed659' />
              </g>
            </m.g>
          </m.g>
        ))}
      </svg>
    )
  }

  return { PaperMeadowFlowers }
})()

/**
 * Filter definitions only: each piece (.lm-piece) gets a mottled watercolour / cut-paper texture clipped to its
 * outline. Brightness-neutral: each noise layer lightens and darkens around the true colour
 */
const PaperTextureFilter = ({ id, x, width }: { id: string; x: string; width: string }) => (
  <filter id={id} x={x} y='-20%' width={width} height='140%' colorInterpolationFilters='sRGB'>
    {/* soft blotches, like pigment pooling in watercolor paper */}
    <feTurbulence type='fractalNoise' baseFrequency='0.018 0.024' numOctaves='3' seed='7' result='blotNoise' />
    <feColorMatrix in='blotNoise' type='matrix' values='1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1' result='blot' />
    <feComposite in='SourceGraphic' in2='blot' operator='arithmetic' k1='0.22' k2='0.89' k3='0' k4='0' result='blotted' />

    {/* fine fibre grain */}
    <feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='3' result='grainNoise' />
    <feColorMatrix in='grainNoise' type='matrix' values='1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1' result='grain' />
    <feComposite in='blotted' in2='grain' operator='arithmetic' k1='0.12' k2='0.94' k3='0' k4='0' result='textured' />

    <feComposite in='textured' in2='SourceGraphic' operator='in' />
  </filter>
)

const PaperTexture = () => (
  <svg width='0' height='0' aria-hidden focusable='false' style={{ position: 'absolute' }}>
    <PaperTextureFilter id='lumora-paper' x='-20%' width='140%' />
    {/* same texture, for the ground and grass that reach far past the frame */}
    <PaperTextureFilter id='lumora-paper-wide' x='-55%' width='210%' />
  </svg>
)

const { PaperPinkFlower } = (() => {
  // Coral layered bloom: a back row of broad petals fanned upward and a paler front row, in a cup of leaves
  const BACK = [-78, -54, -30, -8, 14, 36, 58, 80].map((angle, i) => ({
    angle,
    len: [56, 70, 80, 84, 84, 78, 68, 54][i],
    half: 17,
    fill: i % 2 ? '#fd8b70' : '#fd9d82'
  }))

  const FRONT = [-56, -24, 6, 34, 62].map((angle, i) => ({
    angle,
    len: [44, 54, 58, 52, 42][i],
    half: 16,
    fill: i % 2 ? '#fcaf93' : '#fdbba0'
  }))

  const petal = (len: number, half: number) =>
    `M0 0 C ${half * 1.3} ${-len * 0.25} ${half * 1.2} ${-len} 0 ${-len} C ${-half * 1.2} ${-len} ${-half * 1.3} ${-len * 0.25} 0 0 Z`

  const PaperPinkFlower = (props: SVGProps<SVGSVGElement>) => {
    return (
      <svg viewBox='0 0 142 160' aria-hidden {...props}>
        <m.g {...plantSway(5, 6)} style={fillBox(0.5, 1)}>
          <g id='stem' fill='none' stroke='#28633c' strokeWidth='4' strokeLinecap='round'>
            <path d='M70 110 C 70 130, 72 146, 74 160' />
          </g>

          <m.g id='bloom' whileHover={FLOWER_POP} transition={SETTLE} style={{ originX: 0.5, originY: 0.9 }}>
            <g id='back-petals' transform='translate(71 108)'>
              {BACK.map((p, i) => (
                <g key={i} transform={`rotate(${p.angle})`}>
                  <path d={petal(p.len, p.half)} fill={p.fill} />
                  <path d={`M0 -8 L0 ${-p.len * 0.82}`} stroke='#f2705a' strokeWidth='1.3' opacity='0.55' />
                </g>
              ))}
            </g>

            <g id='front-petals' transform='translate(71 110)'>
              {FRONT.map((p, i) => (
                <g key={i} transform={`rotate(${p.angle})`}>
                  <path d={petal(p.len, p.half)} fill={p.fill} />
                  <path d={`M0 -6 L0 ${-p.len * 0.78}`} stroke='#f58e76' strokeWidth='1.2' opacity='0.6' />
                </g>
              ))}
            </g>
          </m.g>

          <g id='base-leaves'>
            <path d='M70 126 C 50 110, 20 108, 6 118 C 22 136, 52 140, 70 126 Z' fill='#428458' />
            <path d='M72 128 C 92 112, 124 110, 138 120 C 122 138, 92 142, 72 128 Z' fill='#2f6b44' />
          </g>
        </m.g>
      </svg>
    )
  }

  return { PaperPinkFlower }
})()

// Tall leafy stalk on the card's right edge: broad leaves alternating up one stem, tiny yellow buds at its foot
const RIGHT_PLANT_LEAVES: LeafType[] = [
  { x: 86, y: 96, angle: -10, len: 96, half: 26, tone: 'dark' },
  { x: 98, y: 122, angle: 34, len: 98, half: 25, tone: 'mid' },
  { x: 82, y: 190, angle: -38, len: 102, half: 27, tone: 'mid' },
  { x: 96, y: 212, angle: 44, len: 100, half: 26, tone: 'dark' },
  { x: 82, y: 280, angle: -50, len: 96, half: 25, tone: 'dark' },
  { x: 98, y: 302, angle: 50, len: 90, half: 24, tone: 'mid' },
  { x: 86, y: 362, angle: -60, len: 80, half: 22, tone: 'mid' }
]

const PaperRightPlant = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 150 452' aria-hidden {...props}>
      <m.g {...plantSway(2.5, 7)} style={fillBox(0.65, 1)}>
        <g id='stem' fill='none' stroke='#28633c' strokeWidth='4.5' strokeLinecap='round'>
          <path d='M100 452 C 96 330, 90 200, 86 90' />
        </g>
        <g id='leaves'>
          {RIGHT_PLANT_LEAVES.map((leaf, i) => (
            <SwayingLeaf key={i} leaf={leaf} seed={i + 5} />
          ))}
        </g>
        <g id='buds' fill='#f8c630'>
          <circle cx='126' cy='402' r='5' />
          <circle cx='138' cy='396' r='4' />
          <circle cx='144' cy='410' r='4.5' />
        </g>
      </m.g>
    </svg>
  )
}

const { PaperSmallFlowers } = (() => {
  // Two small flowers at the foot of the left plants: a white daisy and a coral bloom
  const petal = (len: number, half: number) =>
    `M0 0 C ${half} ${-len * 0.3} ${half} ${-len * 0.85} 0 ${-len} C ${-half} ${-len * 0.85} ${-half} ${-len * 0.3} 0 0 Z`

  type BloomProps = {
    cx: number
    cy: number
    petals: number
    len: number
    half: number
    fill: string
    stroke?: string
    core: number
  }

  const Bloom = ({ cx, cy, petals, len, half, fill, stroke, core }: BloomProps) => (
    <g transform={`translate(${cx} ${cy})`}>
      {Array.from({ length: petals }, (_, i) => (
        <path
          key={i}
          d={petal(len, half)}
          transform={`rotate(${(360 / petals) * i + 18})`}
          fill={fill}
          stroke={stroke ?? 'none'}
          strokeWidth='1.2'
        />
      ))}
      <circle r={core} fill='#fec108' />
      <circle r={core * 0.45} cx={-core * 0.2} cy={-core * 0.2} fill='#fed659' />
    </g>
  )

  const PaperSmallFlowers = (props: SVGProps<SVGSVGElement>) => {
    return (
      <svg viewBox='0 0 190 61' aria-hidden {...props}>
        <m.g id='small-flower-daisy' {...plantSway(4, 8)} style={fillBox(0.5, 1)}>
          <g fill='none' stroke='#2f6b44' strokeWidth='3' strokeLinecap='round'>
            <path d='M32 46 C 32 52, 33 57, 34 61' />
          </g>
          <path d='M33 56 C 24 50, 14 50, 10 54 C 16 59, 26 60, 33 56 Z' fill='#428458' />
          <m.g whileHover={FLOWER_POP} transition={SETTLE}>
            <Bloom cx={32} cy={38} petals={5} len={17} half={8} fill='#ffffff' stroke='#e6e3da' core={5} />
          </m.g>
        </m.g>

        <m.g id='small-flower-coral' {...plantSway(4, 9)} style={fillBox(0.5, 1)}>
          <g fill='none' stroke='#2f6b44' strokeWidth='3' strokeLinecap='round'>
            <path d='M154 44 C 155 51, 155 56, 156 61' />
          </g>
          <path d='M155 54 C 164 47, 175 47, 180 51 C 173 57, 162 58, 155 54 Z' fill='#2f6b44' />
          <m.g whileHover={FLOWER_POP} transition={SETTLE}>
            <Bloom cx={154} cy={36} petals={6} len={15} half={7} fill='#fd9d82' core={4.5} />
          </m.g>
        </m.g>
      </svg>
    )
  }

  return { PaperSmallFlowers }
})()

// Small five-point paper star above the right plant: floats up and down, grows a little on hover
const PaperStar = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 66 64' aria-hidden {...props}>
      <m.g {...STAR_FLOAT}>
        <m.g whileHover={STAR_POP} transition={SETTLE}>
          <path
            d='M33 2 L41.5 22.5 L63 24 L46.5 38.5 L52 61 L33 49 L13.5 61.5 L19.5 38.5 L3 24.5 L24.5 22 Z'
            fill='#fec405'
            strokeLinejoin='round'
            stroke='#fec405'
            strokeWidth='3'
          />
          <path d='M33 10 L38 23.5 L33 40 Z' fill='#fed659' />
        </m.g>
      </m.g>
    </svg>
  )
}

const { PaperSunCharacter } = (() => {
  // Spiky paper-cut sun with two oval eyes; its rays turn slowly and the whole sun grows a little on hover
  const CENTER = { x: 118, y: 96 }
  const SPIKES = 9
  const OUTER = [104, 92, 108, 96, 102, 90, 106, 98, 94]
  const INNER = 54

  const spikePoints = Array.from({ length: SPIKES * 2 }, (_, i) => {
    const angle = (i / (SPIKES * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? OUTER[i / 2] : INNER

    return `${(CENTER.x + Math.cos(angle) * r).toFixed(1)},${(CENTER.y + Math.sin(angle) * r).toFixed(1)}`
  }).join(' ')

  type PaperSunCharacterProps = SVGProps<SVGSVGElement> & {
    // Cursor-follow for the eyes (from the gaze hook); static without it
    eyesStyle?: MotionStyle
  }

  const PaperSunCharacter = ({ eyesStyle, ...props }: PaperSunCharacterProps) => {
    return (
      <svg viewBox='0 0 232 196' aria-hidden {...props}>
        <m.g
          id='sun'
          whileHover={SUN_POP}
          transition={SETTLE}
          style={{ transformBox: 'view-box', transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
        >
          <g id='sun-body'>
            <m.g
              id='sun-rays'
              {...SUN_SPIN}
              style={{ transformBox: 'view-box', transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
            >
              <polygon points={spikePoints} fill='#fec405' stroke='#fec405' strokeWidth='4' strokeLinejoin='round' />
            </m.g>
            <circle cx={CENTER.x} cy={CENTER.y} r='58' fill='#fec405' />
            <path d='M78 70 C 90 50, 118 42, 140 48 C 116 54, 96 62, 78 70 Z' fill='#fed659' />
          </g>

          {/* eyes follow the cursor */}
          <m.g id='sun-eyes' fill='#141414' style={eyesStyle}>
            <ellipse cx='102' cy='106' rx='6.5' ry='13' />
            <ellipse cx='132' cy='106' rx='6.5' ry='13' />
          </m.g>
        </m.g>
      </svg>
    )
  }

  return { PaperSunCharacter }
})()

const { PaperWhiteFlowers } = (() => {
  // One large and one small white daisy on green stems
  const petal = (len: number, half: number) =>
    `M0 0 C ${half} ${-len * 0.3} ${half} ${-len * 0.85} 0 ${-len} C ${-half} ${-len * 0.85} ${-half} ${-len * 0.3} 0 0 Z`

  const Daisy = ({
    cx,
    cy,
    petals,
    len,
    half,
    core
  }: {
    cx: number
    cy: number
    petals: number
    len: number
    half: number
    core: number
  }) => (
    <g transform={`translate(${cx} ${cy})`}>
      {Array.from({ length: petals }, (_, i) => (
        <path
          key={i}
          d={petal(len, half)}
          transform={`rotate(${(360 / petals) * i + 12})`}
          fill='#ffffff'
          stroke='#e6e3da'
          strokeWidth='1.5'
        />
      ))}
      <circle r={core} fill='#fec108' />
      <circle r={core * 0.45} cx={-core * 0.2} cy={-core * 0.2} fill='#fed659' />
    </g>
  )

  const PaperWhiteFlowers = (props: SVGProps<SVGSVGElement>) => {
    return (
      <svg viewBox='0 0 164 210' aria-hidden {...props}>
        <m.g {...plantSway(3, 2)} style={fillBox(0.5, 1)}>
          <g id='stems' fill='none' stroke='#2f6b44' strokeWidth='4' strokeLinecap='round'>
            <path d='M107 70 C 104 120, 98 160, 94 210' />
            <path d='M37 128 C 40 160, 46 186, 50 210' />
          </g>
          <g id='stem-leaves'>
            <path d='M100 150 C 116 130, 140 128, 150 134 C 138 150, 116 156, 100 150 Z' fill='#428458' />
            <path d='M44 176 C 30 160, 12 158, 4 164 C 14 178, 32 182, 44 176 Z' fill='#28633c' />
          </g>

          <m.g id='large-daisy' whileHover={FLOWER_POP} transition={SETTLE}>
            <Daisy cx={107} cy={56} petals={6} len={48} half={20} core={11} />
          </m.g>
          <m.g id='small-daisy' whileHover={FLOWER_POP} transition={SETTLE}>
            <Daisy cx={37} cy={116} petals={5} len={30} half={13} core={7} />
          </m.g>
        </m.g>
      </svg>
    )
  }

  return { PaperWhiteFlowers }
})()

// A hand-cut yellow sun disc, slightly out of round, that grows a little on hover
const PaperYellowCircle = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox='0 0 104 104' aria-hidden {...props}>
      <m.g whileHover={SUN_POP} transition={SETTLE}>
        <path
          d='M52 3 C 80 2, 102 24, 101 53 C 100 80, 78 102, 50 101 C 23 100, 2 78, 3 51 C 4 24, 25 4, 52 3 Z'
          fill='#fec430'
        />
        <path d='M20 30 C 30 14, 52 8, 70 12 C 52 18, 34 26, 20 30 Z' fill='#fdd15f' />
      </m.g>
    </svg>
  )
}

/**
 * A paper-cut phone propped on the centre rock, showing a creator's public page: cover, avatar, @handle,
 * a short bio and a grid of project tiles. It rocks gently; hovering it pops up a "New inquiry" bubble
 */
const PHONE_BUBBLE: Variants = {
  pop: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: EASE } }
}

const PHONE_BUBBLE_HIDDEN = { opacity: 0, scale: 0.7, y: 8 }

const PHONE_LIFT: Variants = {
  pop: { y: -4, transition: { duration: 0.35, ease: EASE } }
}

const PaperProfilePhone = (props: SVGProps<SVGSVGElement>) => {
  const ink = '#1d2a31'
  const screen = '#f8ede0'

  return (
    <svg viewBox='0 0 220 240' aria-hidden {...props}>
      {/* soft contact shadow on the rock */}
      <ellipse cx='98' cy='233' rx='62' ry='5' fill='#8a7660' opacity='0.22' />

      {/* idle: rocks gently from its base */}
      <m.g {...PHONE_ROCK} style={fillBox(0.45, 1)}>
        <m.g id='phone' whileHover='pop' transition={SETTLE}>
          <m.g variants={PHONE_LIFT}>
            <g transform='rotate(-6 95 232)'>
              {/* paper stand behind the phone */}
              <path d='M118 120 L 168 232 L 112 232 Z' fill='#cdb89b' />
              <path d='M118 120 L 140 232 L 112 232 Z' fill='#bea78a' />

              {/* body and screen */}
              <rect x='40' y='30' width='110' height='202' rx='18' fill={ink} />
              <rect x='47' y='38' width='96' height='186' rx='12' fill={screen} />

              {/* cover band, with a little sun in it */}
              <path d='M47 50 Q 47 38 59 38 H 131 Q 143 38 143 50 V 78 H 47 Z' fill='#7fc9f0' />
              <path d='M47 70 C 70 60, 100 74, 143 62 V 78 H 47 Z' fill='#b6daed' />
              <circle cx='126' cy='52' r='6' fill='#fec430' />
              <rect x='82' y='42' width='26' height='5' rx='2.5' fill={ink} />

              {/* avatar */}
              <circle cx='95' cy='82' r='16' fill={screen} />
              <circle cx='95' cy='82' r='13' fill='#fd9d82' />
              <circle cx='95' cy='78' r='5' fill='#fdbba0' />
              <path d='M85.5 90.5 C 88 85, 102 85, 104.5 90.5 C 99 94, 91 94, 85.5 90.5 Z' fill='#fdbba0' />

              {/* name, @handle pill, bio */}
              <rect x='72' y='102' width='46' height='6' rx='3' fill={ink} opacity='0.85' />
              <rect x='62' y='112' width='66' height='14' rx='7' fill='#009485' />
              <text
                x='95'
                y='122'
                textAnchor='middle'
                fontSize='8.5'
                fontWeight='700'
                fill='#ffffff'
                style={{ fontFamily: 'var(--font-lm-sans)' }}
              >
                @yourhandle
              </text>
              <rect x='60' y='132' width='70' height='4' rx='2' fill='#d9cbb8' />
              <rect x='68' y='140' width='54' height='4' rx='2' fill='#d9cbb8' />

              {/* project tiles */}
              <rect x='56' y='152' width='37' height='30' rx='5' fill='#009485' />
              <path d='M70 160 L 81 167 L 70 174 Z' fill='#ffffff' />
              <rect x='97' y='152' width='37' height='30' rx='5' fill='#fec430' />
              <circle cx='115.5' cy='167' r='7' fill='#fdd15f' />
              <rect x='56' y='186' width='37' height='30' rx='5' fill='#57acfa' />
              <path d='M60 211 L 70 199 L 77 206 L 82 201 L 90 211 Z' fill='#8cc4fb' />
              <rect x='97' y='186' width='37' height='30' rx='5' fill='#fd9d82' />
              <path
                d='M115.5 209 C 106 202, 106 194, 111 193 C 113.5 192.5, 115 194, 115.5 196 C 116 194, 117.5 192.5, 120 193 C 125 194, 125 202, 115.5 209 Z'
                fill='#fdbba0'
              />
            </g>
          </m.g>

          {/* hover: a new brand inquiry arrives */}
          <m.g
            id='phone-inquiry'
            initial={PHONE_BUBBLE_HIDDEN}
            variants={PHONE_BUBBLE}
            style={{ ...fillBox(0.15, 1), pointerEvents: 'none' }}
          >
            <rect x='118' y='4' width='100' height='30' rx='15' fill='#ffffff' stroke='#e6e3da' strokeWidth='1.5' />
            <path d='M136 33 L 130 44 L 148 33 Z' fill='#ffffff' />
            <rect x='128' y='13' width='16' height='12' rx='2' fill='#fd744a' />
            <path d='M128.5 14 L 136 20 L 143.5 14' fill='none' stroke='#ffffff' strokeWidth='1.6' strokeLinejoin='round' />
            <text
              x='149'
              y='23'
              fontSize='10.5'
              fontWeight='700'
              fill='#141414'
              style={{ fontFamily: 'var(--font-lm-sans)' }}
            >
              New inquiry
            </text>
          </m.g>
        </m.g>
      </m.g>
    </svg>
  )
}

/* ----------------------------- Copy ----------------------------- */

type EntranceType = {
  delay?: number

  // Starting offset: px, or a string such as '100%' for a masked line reveal
  y?: number | string
  scale?: number
  duration?: number
}

// The custom properties .lm-enter reads for one element's entrance
const revealStyle = ({ delay = 0, y = 16, scale = 1, duration = INTRO.duration }: EntranceType) =>
  ({
    '--lm-delay': `${delay}s`,
    '--lm-dur': `${duration}s`,
    '--lm-y': typeof y === 'number' ? `${y}px` : y,
    '--lm-s': scale
  }) as CSSProperties

type HeroRevealProps = {
  children: ReactNode
  delay?: number
  y?: number | string
  as?: 'div' | 'span'
  className?: string
}

// One-shot entrance used by the copy: a CSS animation, so it plays from the first paint
const HeroReveal = ({ children, delay = 0, y = 16, as: Tag = 'div', className }: HeroRevealProps) => {
  return (
    <Tag style={revealStyle({ delay, y })} className={cn('lm-enter', className)}>
      {children}
    </Tag>
  )
}

const clamp = (v: number) => Math.min(1, Math.max(-1, v))

/**
 * The sun's eyes follow the cursor, read relative to the closest <section> around `anchorRef` and normalised to
 * −1…1 through Motion values, so moving the mouse never re-renders React. Mouse and trackpad only
 */
const useCursorGaze = (anchorRef: RefObject<HTMLElement | null>) => {
  const reduce = useReduce()

  const nx = useMotionValue(0)
  const ny = useMotionValue(0)

  const x = useSpring(
    useTransform(nx, v => v * GAZE.sunEyeX),
    GAZE.eyeSpring
  )

  const y = useSpring(
    useTransform(ny, v => v * GAZE.sunEyeY),
    GAZE.eyeSpring
  )

  useEffect(() => {
    const hero = anchorRef.current?.closest('section')

    if (!hero || reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    // The hero's rect is cached: re-read only on the first move after a resize or a scroll
    let r = hero.getBoundingClientRect()
    let stale = false

    const markStale = () => {
      stale = true
    }

    const resizeObserver = new ResizeObserver(markStale)

    resizeObserver.observe(hero)
    window.addEventListener('scroll', markStale, { passive: true })
    window.addEventListener('resize', markStale)

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return

      if (stale) {
        r = hero.getBoundingClientRect()
        stale = false
      }

      nx.set(clamp(((e.clientX - r.left) / r.width) * 2 - 1))
      ny.set(clamp(((e.clientY - r.top) / r.height) * 2 - 1))
    }

    const handlePointerLeave = () => {
      nx.set(0)
      ny.set(0)
    }

    hero.addEventListener('pointermove', handlePointerMove)
    hero.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', markStale)
      window.removeEventListener('resize', markStale)
      hero.removeEventListener('pointermove', handlePointerMove)
      hero.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [anchorRef, reduce, nx, ny])

  return { sunEyesStyle: { x, y } }
}

/**
 * Logo, links and the call-to-action fade up in turn, each holding its final space from the start so nothing
 * shifts. Below 768px the links move into a small menu that closes on a link tap, Escape or the toggle
 */
const HeroNavbar = () => {
  const { BRAND, LOGO, HOME_HREF, NAV_LINKS, COPY } = useHero()

  const [open, setOpen] = useState(false)

  const reduce = useReduce()

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <header className='lm-pad-x relative z-20 flex items-center justify-between pt-[max(16px,calc(1.7*var(--u)))]'>
      <a
        href='#lm-hero-copy'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-40 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-md'
      >
        Skip to content
      </a>

      <a
        href={HOME_HREF}
        style={revealStyle({ delay: NAV_INTRO.logo, y: 6, duration: 0.45 })}
        className='lm-enter lm-nav-logo flex shrink-0 items-center'
        aria-label={`${BRAND} home`}
      >
        {LOGO ?? <span className='text-[20px] font-bold'>{BRAND}</span>}
      </a>

      {/* Links sit on the right, just before the call-to-action */}
      <div className='flex items-center gap-2.5 md:gap-[max(24px,calc(2.9*var(--u)))]'>
        <nav aria-label='Primary' className='hidden md:block'>
          <ul className='flex items-center gap-[max(22px,calc(2.6*var(--u)))] text-[max(14px,calc(0.97*var(--u)))] font-medium'>
            {NAV_LINKS.map((link, i) => (
              <li
                key={link.label}
                style={revealStyle({ delay: NAV_INTRO.links.start + i * NAV_INTRO.links.stagger, y: 6, duration: 0.4 })}
                className='lm-enter'
              >
                <a href={link.href} className='lm-nav-link'>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/**
         * The wrapper animates, so the button's own hover lift (CSS transform) stays intact. Hidden on small
         * phones, where it would crowd the logo and the hero's primary button sits right below anyway
         */}
        <div
          style={revealStyle({ delay: NAV_INTRO.cta, y: 5, scale: 0.96, duration: 0.45 })}
          className='lm-enter hidden min-[440px]:block'
        >
          <a
            href={COPY.navCta.href}
            className='lm-nav-cta bg-lm-primary flex h-10 whitespace-nowrap items-center gap-2 rounded-full px-4 text-[14px] font-medium text-white sm:gap-2.5 sm:px-[18px] md:h-[max(36px,calc(2.65*var(--u)))] md:px-[max(18px,calc(1.4*var(--u)))] md:text-[max(14px,calc(1.06*var(--u)))]'
          >
            {COPY.navCta.label}
            <ArrowRight aria-hidden className='lm-nav-arrow size-4' strokeWidth={2} />
          </a>
        </div>

        {/* On phones the links live in a small menu */}
        {NAV_LINKS.length > 0 && (
          <button
            type='button'
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls='lm-mobile-menu'
            onClick={() => setOpen(v => !v)}
            style={revealStyle({ delay: NAV_INTRO.cta, y: 5, duration: 0.45 })}
            className='lm-enter border-lm-ink/15 text-lm-ink flex size-10 shrink-0 items-center justify-center rounded-full border md:hidden'
          >
            {open ? <X aria-hidden className='size-[18px]' /> : <Menu aria-hidden className='size-[18px]' />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <m.nav
            id='lm-mobile-menu'
            aria-label='Primary'
            className='lm-pad-x absolute inset-x-0 top-full z-30 mt-3 md:hidden'
            initial={{ opacity: 0, transform: 'translateY(-8px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            exit={{ opacity: 0, transform: 'translateY(-8px)' }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE }}
          >
            <ul className='bg-lm-card border-lm-ink/10 ml-auto flex w-full max-w-[280px] flex-col rounded-2xl border p-2 shadow-[0_18px_40px_-20px_rgb(18_18_18/0.35)]'>
              {NAV_LINKS.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className='hover:text-lm-primary focus-visible:text-lm-primary block rounded-xl px-4 py-3 text-[16px] font-medium'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

const HeroContent = () => {
  const { COPY } = useHero()

  return (
    <div id='lm-hero-copy' tabIndex={-1} className='lm-copy lm-pad-x relative z-10 pt-[max(40px,calc(3*var(--u)))] outline-none'>
      <h1 className='lm-headline flex flex-col'>
        {/**
         * Each line slides up from behind its own mask; the small padding keeps the glyph tops from being
         * clipped by the tight line-height, and the negative margins cancel it exactly
         */}
        {COPY.headline.map((line, i) => (
          <span key={line} className='-my-[0.06em] block overflow-hidden py-[0.06em] md:whitespace-nowrap'>
            <HeroReveal as='span' delay={INTRO.headline[i] ?? 0} y='100%' className='block'>
              {line}
            </HeroReveal>
          </span>
        ))}
      </h1>

      <HeroReveal delay={INTRO.description}>
        <p className='lm-description text-lm-body mt-[max(16px,calc(1.1*var(--u)))] max-w-[550px] md:w-fit md:max-w-none md:pl-[calc(0.15*var(--u))]'>
          {COPY.description.map(line => (
            <span key={line} className='md:block'>
              {line}{' '}
            </span>
          ))}
        </p>
      </HeroReveal>

      <HeroReveal delay={INTRO.cta}>
        <div className='mt-[max(20px,calc(1.4*var(--u)))] flex flex-wrap items-center gap-x-[max(24px,calc(2.3*var(--u)))] gap-y-4'>
          <a
            href={COPY.primaryCta.href}
            className='lm-primary-cta bg-lm-primary flex h-11 items-center gap-3 rounded-full px-6 text-[15px] font-medium text-white md:h-[max(40px,calc(2.9*var(--u)))] md:px-[max(22px,calc(1.75*var(--u)))] md:text-[max(15px,calc(1.1*var(--u)))]'
          >
            {COPY.primaryCta.label}
            <ArrowRight aria-hidden className='lm-primary-arrow size-4' strokeWidth={2} />
          </a>
          <a
            href={COPY.secondaryCta.href}
            className='text-[15px] font-medium underline decoration-[1.5px] underline-offset-[7px] md:text-[max(15px,calc(1.15*var(--u)))]'
          >
            {COPY.secondaryCta.label}
          </a>
        </div>
      </HeroReveal>
    </div>
  )
}

/* ----------------------------- Illustration ----------------------------- */

type PieceName = keyof typeof ILLUSTRATION_LAYOUT

type PieceType = {
  name: PieceName
  Svg: ComponentType<SVGProps<SVGSVGElement>>

  // Minor decoration, dropped on phones where the strip is cropped to its centre
  minor?: boolean

  // Entrance group: background artwork, the phone, the sun, or a small detail that lands last
  enter?: 'artwork' | 'figure' | 'sun' | 'detail'

  // Drawn outside the paper-texture filter (for continuously moving layers)
  bare?: boolean

  // Reaches far past the frame's edges (needs the wider texture filter region)
  wide?: boolean

  // Reacts to hover on its own painted shapes
  hover?: boolean
}

// The ground in two layers, with the ripples on the blue hills between them
const PaperGroundBack = (props: SVGProps<SVGSVGElement>) => <PaperGroundShapes layer='back' {...props} />
const PaperGroundFront = (props: SVGProps<SVGSVGElement>) => <PaperGroundShapes layer='front' {...props} />

// Paint order, back to front. Each entry is its own positioned layer (data-piece)
const PIECES: PieceType[] = [
  // Back
  { name: 'groundBack', Svg: PaperGroundBack, wide: true },
  { name: 'waves', Svg: PaperBlueWaves, bare: true },
  { name: 'ground', Svg: PaperGroundFront, hover: true, wide: true },
  { name: 'yellowCircle', Svg: PaperYellowCircle, hover: true },
  { name: 'star', Svg: PaperStar, minor: true, enter: 'detail', hover: true },
  { name: 'leftPlants', Svg: PaperLeftPlants, hover: true },

  // Middle
  { name: 'centerLeaves', Svg: PaperCenterLeaves, hover: true },
  { name: 'birdTrail', Svg: PaperBirdTrail, minor: true, enter: 'detail' },
  { name: 'bird', Svg: PaperBlueBird, enter: 'detail', hover: true },

  // The phone on the rock, then the grass over its foot
  { name: 'phone', Svg: PaperProfilePhone, enter: 'figure', hover: true },
  { name: 'grass', Svg: PaperGrass, wide: true },
  { name: 'pinkFlowerStone', Svg: PaperPinkFlower, hover: true },
  { name: 'whiteFlowersStone', Svg: PaperWhiteFlowers, hover: true },

  // Right-hand foliage sits in front of the grass, up on the slope
  { name: 'rightPlant', Svg: PaperRightPlant, hover: true },
  { name: 'rightPlants', Svg: PaperLeftPlants, hover: true },
  { name: 'whiteFlowersRight', Svg: PaperWhiteFlowers, hover: true },
  { name: 'pinkFlowerRight', Svg: PaperPinkFlower, hover: true },

  // Front
  { name: 'meadowFlowers', Svg: PaperMeadowFlowers, hover: true },
  { name: 'sun', Svg: PaperSunCharacter, enter: 'sun' },
  { name: 'eyeCard', Svg: PaperEyeCard, hover: true },
  { name: 'whiteFlowers', Svg: PaperWhiteFlowers, hover: true },
  { name: 'smallFlowers', Svg: PaperSmallFlowers, hover: true },
  { name: 'pinkFlower', Svg: PaperPinkFlower, hover: true }
]

const pct = (value: number, of: number) => `${(value / of) * 100}%`

// Entrance per piece: the artwork rises from the bottom in paint order and the small details land last
const entrance = (piece: PieceType, artworkIndex: number, detailIndex: number) => {
  if (piece.enter === 'sun') return { delay: INTRO.sun.delay, y: INTRO.sun.from, scale: 1, duration: INTRO.sun.duration }
  if (piece.enter === 'figure') return { delay: INTRO.figure, y: 35, scale: 0.97 }
  if (piece.enter === 'detail') return { delay: INTRO.detailStart + detailIndex * INTRO.detailStagger, y: 18, scale: 1 }

  return { delay: INTRO.artworkStart + artworkIndex * INTRO.artworkStagger, y: 40, scale: 1 }
}

const HeroIllustration = () => {
  const { REDUCED } = useHero()

  // The idle loops play only while the artwork is on screen and the tab is visible
  const [loopsRun, setLoopsRun] = useState(true)

  const ref = useRef<HTMLDivElement>(null)

  const { sunEyesStyle } = useCursorGaze(ref)
  const reduce = useReduce()

  useEffect(() => {
    const element = ref.current

    if (!element) return

    let onScreen = true

    const sync = () => setLoopsRun(onScreen && !document.hidden)

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })

    observer.observe(element)
    document.addEventListener('visibilitychange', sync)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  const { width, height } = ILLUSTRATION_FRAME

  let artworkIndex = 0
  let detailIndex = 0

  // reducedMotion='user': hover reactions skip their movement for visitors who ask for less motion
  return (
    <MotionConfig reducedMotion={REDUCED === undefined ? 'user' : REDUCED ? 'always' : 'never'}>
      <m.div
        ref={ref}
        aria-hidden
        animate={reduce ? LOOPS_STILL : loopsRun ? LOOPS_RUN : LOOPS_REST}
        className='lm-illustration pointer-events-none z-0 select-none'
      >
        <PaperTexture />
        {PIECES.map(piece => {
          const { name, Svg, minor } = piece
          const slot: IllustrationSlotType = ILLUSTRATION_LAYOUT[name]
          const enter = entrance(piece, artworkIndex, detailIndex)

          if (piece.enter === 'detail') detailIndex++
          else if (piece.enter !== 'figure' && piece.enter !== 'sun') artworkIndex++

          return (
            <div
              key={name}
              data-piece={name}
              className={cn('lm-enter absolute', minor && 'hidden sm:block')}
              style={{
                left: pct(slot.x, width),
                top: pct(slot.y, height),
                width: pct(slot.w, width),
                rotate: `${slot.rotate ?? 0}deg`,
                transform: slot.flip ? 'scaleX(-1)' : undefined,
                ...revealStyle(enter)
              }}
            >
              {/* The paper texture sits on this inner layer, so the entrance moves an already-textured layer */}
              {name === 'sun' ? (
                <div className='lm-piece lm-touchable'>
                  <PaperSunCharacter className='block h-auto w-full overflow-visible' eyesStyle={sunEyesStyle} />
                </div>
              ) : (
                <div
                  className={cn(!piece.bare && ['lm-piece', piece.wide && 'lm-piece-wide', piece.hover && 'lm-touchable'])}
                >
                  <Svg className='block h-auto w-full overflow-visible' />
                </div>
              )}
            </div>
          )
        })}
      </m.div>
    </MotionConfig>
  )
}

const HeroSection = () => {
  return (
    <section className='lm-card lm-grain bg-lm-card font-lm-sans text-lm-ink relative isolate flex w-full flex-col overflow-hidden antialiased'>
      <HeroNavbar />
      <HeroContent />
      <HeroIllustration />
    </section>
  )
}

/* ----------------------------- Root ----------------------------- */

const EMPTY_COPY: NonNullable<IllustratedHeroProps['copy']> = {
  headline: [],
  description: [],
  navCta: { label: '', href: '#' },
  primaryCta: { label: '', href: '#' },
  secondaryCta: { label: '', href: '#' }
}

const IllustratedHero = ({
  brand = '',
  logo,
  homeHref = '/',
  navLinks = [],
  copy = EMPTY_COPY,
  reducedMotion,
  className
}: IllustratedHeroProps) => {
  const value: HeroContextValue = {
    BRAND: brand,
    LOGO: logo,
    HOME_HREF: homeHref,
    NAV_LINKS: navLinks,
    COPY: copy,
    REDUCED: reducedMotion
  }

  return (
    <HeroContext.Provider value={value}>
      <LazyMotion features={domAnimation}>
        <div data-slot='illustrated-hero' className={cn('w-full', className)}>
          <HeroSection />
        </div>
      </LazyMotion>
    </HeroContext.Provider>
  )
}

export { IllustratedHero }
export default IllustratedHero
