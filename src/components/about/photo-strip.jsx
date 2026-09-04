'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react'
import image1 from '@/images/photos/image-1.jpg'
import image2 from '@/images/photos/image-2.jpg'
import image3 from '@/images/photos/image-3.jpg'
import image4 from '@/images/photos/image-4.jpg'
import image5 from '@/images/photos/image-5.jpg'

/* Polaroid strip format ported from the RBP portfolio template
   (github.com/DavidHDev/rbp-portfolio): tilted cards drop in from above
   and follow the pointer with a small magnetic spring. Ours holds real
   photos instead of the template's dotted placeholders. */

const PHOTOS = [
  { id: 'a', image: image1, rotate: -8 },
  { id: 'b', image: image2, rotate: 6 },
  { id: 'c', image: image3, rotate: -4 },
  { id: 'd', image: image4, rotate: 7 },
  { id: 'e', image: image5, rotate: -6 },
]

const EASE = [0.22, 1, 0.36, 1]

function PolaroidCard({ photo, index, reduce }) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 220, damping: 18, mass: 0.6 })
  const tx = useTransform(sx, (v) => `${v}px`)
  const ty = useTransform(sy, (v) => `${v}px`)

  const handleMove = (e) => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    const max = 18
    const k = 0.25
    mx.set(Math.max(-max, Math.min(max, dx * k)))
    my.set(Math.max(-max, Math.min(max, dy * k)))
  }

  const handleLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      initial={
        reduce
          ? false
          : { opacity: 0, y: -120, filter: 'blur(18px)', rotate: photo.rotate }
      }
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', rotate: photo.rotate }}
      transition={{ duration: 0.9, delay: 0.05 + index * 0.08, ease: EASE }}
      style={{ x: tx, y: ty, rotate: photo.rotate }}
      className="relative aspect-[3/4] w-[clamp(6.5rem,12vw,10rem)] shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white p-1 shadow-md shadow-zinc-800/10 dark:border-zinc-800 dark:bg-zinc-800"
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl">
        <Image
          src={photo.image}
          alt=""
          fill
          sizes="10rem"
          className="object-cover"
        />
      </div>
    </motion.div>
  )
}

export default function PhotoStrip() {
  const reduce = useReducedMotion()
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-2 px-4 sm:gap-3 sm:px-8">
      {PHOTOS.map((photo, i) => (
        <PolaroidCard key={photo.id} photo={photo} index={i} reduce={reduce} />
      ))}
    </div>
  )
}
