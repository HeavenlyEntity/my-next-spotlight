import Image from 'next/image'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'

import { Container } from '@/components/Container'
import BorderGlow from '@/components/BorderGlow'
import AgenticBall from '@/components/AgenticBall'
import logoCosmos from '@/images/logos/cosmos.svg'
import logoPortalGen from '@/images/logos/PortalGen Fav-1.png'
import logoOpenShuttle from '@/images/logos/open-shuttle.svg'
import logoPlanetaria from '@/images/logos/planetaria.svg'
import logoFuriousFroth from '@/images/logos/FF.svg'
import logoChamoji from '@/images/logos/chamoji_logo-ico.png'
import logoWindstone from '@/images/logos/Windstone icon-1.png'
import logoMipi from '@/images/logos/mipi-lander-int-icon.svg'
import authjsLogo from '@/images/logos/authjs.png'
import logoConvensionSuite from '@/images/logos/ConventionSuite.png'
import logoKingdomKode from '@/images/logos/kingdom-kode-logo.svg'
import logoCelestial from '@/images/logos/dark-celestial-square.svg'

const Sparkline = ({ data, color }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const height = 24
  const width = 80
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color || 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

import coverMipi from '@/images/projects/mipi-cover.png'
import coverWindstone from '@/images/projects/windstone-cover.png'
import coverAuthjs from '@/images/projects/authjs-cover.png'
import coverNeatsuite from '@/images/projects/neatsuite-cover.png'
import coverPortalGen from '@/images/projects/portalgen-cover.png'
import coverConventionSuite from '@/images/projects/conventionsuite-cover.png'
import coverKingdomKode from '@/images/projects/kingdomkode-cover.png'
import coverFuriousFroth from '@/images/projects/furiousfroth-cover.png'
import coverChamoji from '@/images/projects/chamoji-cover.png'
import coverVrsa from '@/images/projects/vrsa-cover.png'
import coverVbRemoteSat from '@/images/projects/vbremotesat-cover.png'
import coverCelestial from '@/images/projects/celestial-cover.png'

function parseDate(dateStr) {
  const [month, day, year] = dateStr.split('/')
  const fullYear =
    parseInt(year, 10) < 100 ? 2000 + parseInt(year, 10) : parseInt(year, 10)
  return new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10))
}

function getFullYear(dateStr) {
  const [, , year] = dateStr.split('/')
  const y = parseInt(year, 10)
  return y < 100 ? 2000 + y : y
}

const projects = [
  {
    name: 'Celestial Studio Salon',
    tags: ['Full Stack', 'SaaS', 'Booking'],
    date: '03/15/25',
    description:
      'A fully configurable booking system for a local salon in Peoria. Features a landing page configurator, local client/appointment recognition, built-in CRM, calendar scheduling, and robust Stripe integration with payment intent for deposits and cancellation fees.',
    link: { href: 'https://www.celestialsalon.co', label: 'celestialsalon.co' },
    logo: logoCelestial,
    cover: coverCelestial,
    status: 'development',
    whatHappened:
      'MVP successfully launched with active clients coming in; full feature suite still in active development!',
    activity: [10, 20, 35, 50, 65, 80, 85, 95, 100],
  },
  {
    name: 'Kingdom Kode',
    tags: ['Agency', 'AI'],
    date: '02/01/25',
    description:
      'Affordable, top-tier AI solutions, software, website, and design services that solve problems right the first time—empowering businesses to thrive in a competitive digital landscape.',
    link: { href: 'https://kingdomkode.com', label: 'kingdomkode.com' },
    logo: logoKingdomKode,
    cover: coverKingdomKode,
    status: 'live',
    whatHappened:
      'Launching creative, AI-powered solutions for growing brands and teams.',
    activity: [20, 30, 25, 40, 50, 45, 60, 75, 80],
  },
  {
    name: 'ConvensionSuite - GSC™',
    tags: ['Enterprise SaaS'],
    date: '09/30/24',
    description:
      'Enterprise event management system for general service contracts and exhibitor orders, built on Next.js and Oracle NetSuite.\n- Built at NewGen',
    link: { href: 'https://conventionsuite.com', label: 'conventionsuite.com' },
    logo: logoConvensionSuite,
    cover: coverConventionSuite,
    status: 'live',
    whatHappened:
      'Successfully launched and partnered with the largest general service contract companies in the world.',
    activity: [100, 75, 50, 35, 25, 25, 25, 25, 25],
  },
  {
    name: 'M i P i',
    tags: ['Creator Platform', 'SaaS'],
    date: '08/15/24',
    description:
      'Creating technology to empower artists and creators to build their own communities, and build wealth.',
    link: { href: 'http://i.mipi.io', label: 'i.mipi.io' },
    logo: logoMipi,
    cover: coverMipi,
    status: 'development',
    whatHappened:
      'Early development SaaS with customer market fit and growing! Associated with my OneDay Program.',
    activity: [10, 20, 40, 35, 50, 45, 60, 70, 85],
  },
  {
    name: 'PortalGen™',
    tags: ['Enterprise SaaS', 'PWA'],
    date: '05/12/24',
    description:
      'Completely customizable system for generating PWAs (Portal web applications) using Oracle NetSuite backend technologies.\n- Built at NewGen',
    link: {
      href: 'https://newgennow.com/portalgen',
      label: 'newgennow.com/portalgen',
    },
    logo: logoPortalGen,
    cover: coverPortalGen,
    status: 'live',
    whatHappened: 'Successfully launched and growing rapidly.',
    activity: [40, 60, 35, 65, 30, 30, 30, 20, 10],
  },
  {
    name: '@neatsuite/http',
    tags: ['Open Source', 'TypeScript'],
    date: '01/20/24',
    description:
      'TypeScript-first NetSuite HTTP client with OAuth 1.0a signing, smart retries, and a clean DX for SuiteTalk REST and RESTlets.',
    link: {
      href: 'https://github.com/heavenlyentity/neatsuite',
      label: 'github.com',
    },
    logo: logoCosmos,
    cover: coverNeatsuite,
    status: 'live',
    whatHappened:
      'Released as part of the NeatSuite monorepo; actively maintained and adopted in projects.',
    activity: [60, 50, 70, 65, 80, 75, 85, 90, 95],
  },
  {
    name: 'Auth.js - NetSuite Provider',
    tags: ['Open Source'],
    date: '11/05/23',
    description:
      'A NetSuite provider for Auth.js, allowing for easy authentication and authorization in NetSuite hybrid applications.',
    link: {
      href: 'https://authjs.dev/getting-started/providers/netsuite?framework=next-js',
      label: 'authjs.dev',
    },
    logo: authjsLogo,
    cover: coverAuthjs,
    status: 'live',
    whatHappened:
      'Successfully merged into Auth.js and ready to be released into the new version 5!',
    activity: [30, 25, 40, 45, 35, 50, 60, 75, 85],
  },
  {
    name: 'Chamoji',
    tags: ['CLI Tool', 'Open Source'],
    date: '10/14/23',
    description:
      'The modern CLI alternative to gitmoji-changelog. Still in progress getting cool things rigged up.',
    link: {
      href: 'https://github.com/HeavenlyEntity/chamoji',
      label: 'github.com',
    },
    logo: logoChamoji,
    cover: coverChamoji,
    status: 'development',
    whatHappened:
      'Still in progress getting cool things rigged up. Contributors welcome!',
    activity: [15, 20, 10, 25, 35, 30, 40, 50, 60],
  },
  {
    name: 'Windstone',
    tags: ['Desktop App', 'Privacy'],
    date: '03/10/23',
    description:
      'Highly private web browser desktop application built in electron.',
    link: { href: '#', label: 'github.com' },
    logo: logoWindstone,
    cover: coverWindstone,
    status: 'archived',
    whatHappened: 'Company went bankrupt and later Sideskick was born.',
    activity: [80, 70, 60, 50, 40, 30, 20, 10, 5],
  },
  {
    name: 'Furious Froth Coffee®',
    tags: ['E-commerce', 'Headless'],
    date: '06/20/22',
    description:
      'The ultimate coffee site powered by Shopify with a headless storefront powered by Next.js',
    link: { href: '#', label: 'github.com' },
    logo: logoFuriousFroth,
    cover: coverFuriousFroth,
    status: 'archived',
    whatHappened: 'Started OneDay Program and shifted focus to MiPi',
    activity: [75, 65, 55, 45, 35, 25, 15, 5, 0],
  },
  {
    name: 'VRSA',
    tags: ['Internal Tool', 'Security'],
    date: '04/11/21',
    description:
      'A automated patching tool for internal servers, making it easy to analyze, schedule, and patch server vulnerabilities all within a react & Dot Net powered system.',
    link: { href: '#', label: '🔒 Internal' },
    logo: logoPlanetaria,
    cover: coverVrsa,
    status: 'archived',
    whatHappened: 'Company aquired to TD Ameritrade',
    activity: [90, 80, 70, 60, 50, 40, 30, 20, 10],
  },
  {
    name: 'VB Remote Sat',
    tags: ['Internal Tool', 'Automation'],
    date: '07/08/20',
    description:
      'This tool is used by all desktop support techs across the globe at Honeywell to increase efficiency allowing for multiple remote sessions, imaging, and automating all set up processes within a couple minutes instead of hours.',
    link: { href: '#', label: '🔒 Internal' },
    logo: logoOpenShuttle,
    cover: coverVbRemoteSat,
    status: 'live',
    whatHappened:
      'Successfully launched and trained 100+ users still in use today.',
    activity: [40, 55, 40, 60, 20, 55, 45, 65, 70],
  },
].sort((a, b) => parseDate(b.date) - parseDate(a.date))

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const projectVariant = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
}

const StatusIndicator = React.memo(({ status, viewMode = 'grid' }) => {
  StatusIndicator.displayName = 'StatusIndicator'
  const size = viewMode === 'list' ? 32 : 24
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mq.matches)
      const onChange = (e) => setPrefersReducedMotion(e.matches)
      mq.addEventListener?.('change', onChange)
      return () => mq.removeEventListener?.('change', onChange)
    }
  }, [])
  const statusConfig = {
    live: {
      color: '#00ff9d',
      label: 'Live',
      pulseRing: true,
      lightColor: '#00cc7d',
    },
    development: {
      color: '#38bdf8',
      label: 'In Development',
      pulseRing: true,
      lightColor: '#0284c7',
    },
    archived: {
      color: '#888888',
      label: 'Archived',
      pulseRing: false,
      lightColor: '#666666',
    },
    internal: {
      color: '#ffae00',
      label: 'Internal',
      pulseRing: true,
      lightColor: '#cc8b00',
    },
    sold: {
      color: '#ffae00',
      label: 'Sold',
      pulseRing: true,
      lightColor: '#cc8b00',
    },
  }

  const config = statusConfig[status]

  return (
    <motion.div
      className="inline-flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <AgenticBall
        key={viewMode}
        width={size}
        height={size}
        color={config?.color}
        speed={config?.pulseRing ? 0.8 : 0.4}
        zoom={1.5}
        className="shrink-0"
      />
      <span className="ml-2 text-xs font-medium text-zinc-900 dark:text-zinc-200">
        {config?.label}
      </span>
    </motion.div>
  )
})

export default function Projects() {
  const [activeProject, setActiveProject] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const hoverTimerRef = useRef(null)
  const HOVER_REVEAL_DELAY_MS = 300

  const handleMouseEnter = useCallback((name) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      setActiveProject(name)
    }, HOVER_REVEAL_DELAY_MS)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setActiveProject(null)
  }, [])

  const handleClickCard = useCallback((name) => {
    setActiveProject((prev) => (prev === name ? null : name))
  }, [])

  const projectsWithValidity = useMemo(() => {
    return projects.map((p) => {
      const href = p.link?.href
      const isValidLink =
        !!href &&
        typeof href === 'string' &&
        href !== '#' &&
        (href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('/'))
      return { ...p, isValidLink }
    })
  }, [])

  useEffect(() => {
    // cleanup hover timer on unmount
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  return (
    <>
      <Head>
        <title>Projects - Alec Mingione</title>
        <meta
          name="description"
          content="Things I've made trying to put my dent in the universe."
        />
      </Head>
      <Container className="mt-16 sm:mt-32">
        <div className="mb-16 flex flex-col gap-12 sm:mb-24 md:flex-row md:items-start md:justify-between lg:gap-24">
          <h1 className="max-w-xl shrink-0 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            Explore My Work
          </h1>
          <div className="flex max-w-2xl flex-col gap-8 pt-2 sm:flex-row md:gap-12">
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                A curated selection of projects highlighting my approach to
                clean design, thoughtful user experience, and innovative web
                development.
              </p>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Visual Identity
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Every project tells a unique story, crafted with precision,
                performance, and purpose from my perspective as a creator.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              viewMode === 'grid'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
            }`}
            aria-pressed={viewMode === 'grid'}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              viewMode === 'list'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
            }`}
            aria-pressed={viewMode === 'list'}
          >
            List
          </button>
        </div>

        {viewMode === 'grid' ? (
          <motion.ul
            variants={container}
            initial="hidden"
            animate="show"
            role="list"
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {projectsWithValidity.map((project) => {
              const glowConfig = {
                live: {
                  colors: ['#34d399', '#06b6d4', '#22d3ee'],
                  glowColor: '160 80 65',
                },
                development: {
                  colors: ['#38bdf8', '#0ea5e9', '#0284c7'],
                  glowColor: '200 80 75',
                },
                archived: {
                  colors: ['#a1a1aa', '#71717a', '#d4d4d8'],
                  glowColor: '240 10 65',
                },
              }
              const glow = glowConfig[project.status] || glowConfig.archived

              return (
                <motion.li
                  key={project.name}
                  variants={projectVariant}
                  className="group"
                  onMouseEnter={() => handleMouseEnter(project.name)}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={() => handleMouseEnter(project.name)}
                  onTouchEnd={handleMouseLeave}
                >
                  <BorderGlow
                    colors={glow.colors}
                    glowColor={glow.glowColor}
                    backgroundColor="var(--card-bg, #ffffff)"
                    borderRadius={16}
                    glowRadius={30}
                    glowIntensity={0.6}
                    edgeSensitivity={25}
                    coneSpread={20}
                    fillOpacity={0.3}
                    className="h-full [--card-bg:#ffffff] dark:[--card-bg:#18181b]"
                  >
                    <div
                      className="relative inset-x-0.5 w-full cursor-pointer overflow-hidden"
                      onClick={() => handleClickCard(project.name)}
                    >
                      {project.cover && (
                        <Image
                          src={project.cover}
                          alt={project.name}
                          className="w-full !object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}

                      <AnimatePresence mode="wait">
                        {activeProject === project.name &&
                          project?.whatHappened && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 p-6 backdrop-blur-md dark:bg-black/80"
                            >
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-center"
                              >
                                <Image
                                  src={project.logo}
                                  alt=""
                                  className="mx-auto mb-4 h-12 w-12 rounded-xl shadow-lg"
                                  unoptimized
                                />
                                <StatusIndicator
                                  status={project.status}
                                  viewMode="grid"
                                />
                                <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-100 md:text-base">
                                  {project.whatHappened}
                                </p>
                                {project.isValidLink && (
                                  <Link
                                    href={project.link.href}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 dark:bg-white dark:text-zinc-900"
                                  >
                                    Visit Project
                                    <ArrowUpRight className="h-4 w-4" />
                                  </Link>
                                )}
                              </motion.div>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <h2 className="shrink-0 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {project.isValidLink ? (
                            <Link
                              href={project.link.href}
                              className="hover:underline focus:outline-hidden"
                            >
                              {project.name}
                            </Link>
                          ) : (
                            project.name
                          )}
                        </h2>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {getFullYear(project.date)}
                      </span>
                    </div>
                  </BorderGlow>
                </motion.li>
              )
            })}
          </motion.ul>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="shadow-xs w-full overflow-hidden rounded-xl border border-zinc-200 bg-white backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50/50 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Project</th>
                    <th className="px-6 py-4 font-medium">Timeline</th>
                    <th className="px-6 py-4 font-medium">Tech</th>
                    <th className="px-6 py-4 font-medium">Activity</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {projectsWithValidity.map((project, idx) => {
                    const glowConfig = {
                      live: { color: '#34d399' },
                      development: { color: '#38bdf8' },
                      archived: { color: '#a1a1aa' },
                      internal: { color: '#fbbf24' },
                    }
                    const cConfig =
                      glowConfig[project.status] || glowConfig.archived
                    return (
                      <motion.tr
                        key={project.name}
                        variants={projectVariant}
                        className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="shadow-xs relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                              <Image
                                src={project.logo}
                                alt={project.name}
                                className="h-full w-full object-cover p-1.5"
                                unoptimized
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {project.name}
                              </span>
                              {project.isValidLink ? (
                                <Link
                                  href={project.link.href}
                                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                                >
                                  {project.link.label}
                                </Link>
                              ) : (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {project.link.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                          {parseDate(project.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {project.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 2 && (
                              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                +{project.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Sparkline
                            data={project.activity}
                            color={cConfig.color}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <StatusIndicator
                            status={project.status}
                            viewMode="list"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {project.isValidLink ? (
                            <Link
                              href={project.link.href}
                              className="shadow-xs inline-flex w-24 justify-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:scale-105 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                              Visit Project
                            </Link>
                          ) : (
                            <span className="inline-flex w-24 justify-center rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-zinc-400 shadow-none dark:text-zinc-500">
                              Internal
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Showing {projects.length} results
                </span>
                <div className="flex gap-1">
                  <button
                    disabled
                    className="shadow-xs rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                  >
                    Previous
                  </button>
                  <button className="rounded-md border border-teal-500 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400">
                    1
                  </button>
                  <button
                    disabled
                    className="shadow-xs rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Container>
    </>
  )
}
