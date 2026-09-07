'use client'

import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { SectionEyebrow } from './section-eyebrow'
import imageGearz from '@/images/projects/gearz-mockup.webp'
import imageKingdomKode from '@/images/photos/kingdom-kode-port.webp'
import imageMipi from '@/images/photos/MiPi-mockup.webp'

/* Ported from the "minimal" landing template (components/features.tsx):
   sticky intro column on the left, numbered split cards scrolling on the
   right. The three "features" are the flagship builds; covers stay in
   color here because they are the evidence, not decoration. */

const easeOut = [0.16, 1, 0.3, 1]

const features = [
  {
    number: '01',
    title: 'Gearz',
    description:
      'The home base for car culture: meets, clubs, garages, and event ticketing. Founder build, in development.',
    image: imageGearz,
  },
  {
    number: '02',
    title: 'Kingdom Kode',
    description:
      'AI products for business, and teaching people to build their own. Co-founded in 2025.',
    image: imageKingdomKode,
  },
  {
    number: '03',
    title: 'MiPi',
    description:
      'The studio where this playbook was first productized. Founded in 2022 and still shipping.',
    image: imageMipi,
  },
]

function FeatureCard({ feature, index }) {
  return (
    <motion.div
      className="bg-[var(--amw-muted)] group grid grid-cols-1 gap-2 overflow-hidden rounded-2xl p-2 transition-colors duration-300 md:grid-cols-2"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: easeOut,
      }}
    >
      <div className="px-4 py-28">
        <span className="amw-mono text-[var(--amw-accent-ink)] bg-[var(--amw-accent-soft)] mb-4 block w-fit rounded-md px-2 py-1 text-sm font-medium">
          {feature.number}
        </span>
        <h3 className="mb-4 text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
          {feature.title}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {feature.description}
        </p>
      </div>

      <div className="aspect-4/3 relative w-full self-stretch overflow-hidden rounded-xl md:aspect-auto">
        <Image
          src={feature.image}
          alt={feature.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="relative! h-full! w-full! md:absolute! object-cover"
        />
      </div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section className="px-6 py-16 md:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        {/* Sticky left column */}
        <motion.div
          className="lg:sticky lg:top-60 lg:w-96 lg:shrink-0"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <SectionEyebrow index="02" label="FIELD EVIDENCE" />
          <h2
            style={{ fontFamily: 'Layer, sans-serif' }}
            className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:mb-6 md:text-3xl lg:text-4xl"
          >
            Shipped, not staged
          </h2>
          <p className="mb-6 max-w-sm text-base text-zinc-600 dark:text-zinc-400 md:mb-8 md:text-lg">
            Every foundation in the catalog was proven on a real build first.
            This is where it earned its keep.
          </p>
          <Link
            href="/projects"
            className="group inline-flex w-full items-center justify-center gap-3 rounded-md bg-zinc-900 py-3 pl-5 pr-3 font-medium text-white no-underline transition-all duration-500 ease-out hover:rounded-[50px] dark:bg-zinc-100 dark:text-zinc-900 sm:w-auto"
          >
            <span>View All Projects</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-900 transition-all duration-300 group-hover:scale-110 dark:bg-zinc-900 dark:text-zinc-100">
              <ChevronRight
                className="relative left-px h-4 w-4"
                aria-hidden="true"
              />
            </span>
          </Link>
        </motion.div>

        {/* Scrolling right column */}
        <div className="flex min-w-0 flex-1 flex-col gap-6 md:gap-32">
          {features.map((feature, index) => (
            <FeatureCard key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
