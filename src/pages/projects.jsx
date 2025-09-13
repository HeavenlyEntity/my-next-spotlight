import Image from 'next/image'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUpRight, MousePointer2 } from 'lucide-react'
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { GlowCard } from '@/components/ui/spotlight-card'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import logoAnimaginary from '@/images/logos/animaginary.svg'
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

const projects = [
  {
    name: 'M i P i',
    description:
      'Creating technology to empower artists and creators to build their own communities, and build wealth.',
    link: { href: 'http://mipi.io', label: 'mipi.io' },
    logo: logoMipi,
    status: 'development',
    whatHappened: 'Early development SaaS with customer market fit and growing! Associated with my OneDay Program.',
  },
  {
    name: 'Windstone',
    description:
      'Highly private web browser desktop application built in electron.',
    link: { href: '#', label: 'github.com' },
    logo: logoWindstone,
    status: 'archived',
    whatHappened: 'Company went bankrupt and later Sideskick was born.',
  }, 
   {
    name: 'Auth.js - NetSuite Provider',
    description:
      'A NetSuite provider for Auth.js, allowing for easy authentication and authorization in NetSuite hybrid applications.',
    link: { href: 'https://authjs.dev/getting-started/providers/netsuite?framework=next-js', label: 'authjs.dev' },
    logo: authjsLogo,
    status: 'live',
    whatHappened: 'Successfully merged into Auth.js and ready to be released into the new version 5!',
  },
  {
    name: '@neatsuite/http',
    description:
      'TypeScript-first NetSuite HTTP client with OAuth 1.0a signing, smart retries, and a clean DX for SuiteTalk REST and RESTlets.',
    link: { href: 'https://github.com/heavenlyentity/neatsuite', label: 'github.com' },
    logo: logoCosmos,
    status: 'live',
    whatHappened: 'Released as part of the NeatSuite monorepo; actively maintained and adopted in projects.',
  },
  {
    name: 'PortalGen™',
    description:
      'Completely customizable system for generating PWAs (Portal web applications) using Oracle NetSuite backend technologies.\n- Built at NewGen',
    link: { href: 'https://newgennow.com/portalgen', label: 'newgennow.com/portalgen' },
    logo: logoPortalGen,
    status: 'live',
    whatHappened: 'Successfully launched and growing rapidly.',
  },
  {
    name: 'ConvensionSuite - GSC™',
    description:
      'Enterprise event management system for general service contracts and exhibitor orders, built on Next.js and Oracle NetSuite.\n- Built at NewGen',
    link: { href: 'https://conventionsuite.com', label: 'conventionsuite.com' },
    logo: logoConvensionSuite,
    status: 'live',
    whatHappened: 'Successfully launched and partnered with the largest general service contract companies in the world.',
  },
  {
    name: 'Kingdom Kode',
    description:
      'Affordable, top-tier AI solutions, software, website, and design services that solve problems right the first time—empowering businesses to thrive in a competitive digital landscape.',
    link: { href: 'https://kingdomkode.com', label: 'kingdomkode.com' },
    logo: logoKingdomKode,
    status: 'live',
    whatHappened: 'Launching creative, AI-powered solutions for growing brands and teams.',
  },
  {
    name: 'Furious Froth Coffee®',
    description:
      'The ultimate coffee site powered by Shopify with a headless storefront powered by Next.js',
    link: { href: '#', label: 'github.com' },
    logo: logoFuriousFroth,
    status: 'archived',
    whatHappened: 'Started OneDay Program and shifted focus to MiPi',
  },
  {
    name: 'Chamoji',
    description:
      'The modern CLI alternative to gitmoji-changelog. Still in progress getting cool things rigged up.',
    link: { href: 'https://github.com/HeavenlyEntity/chamoji', label: 'github.com' },
    logo: logoChamoji,
    status: 'development',
    whatHappened: 'Still in progress getting cool things rigged up. Contributors welcome!',
  },
  {
    name: 'VRSA',
    description:
      'A automated patching tool for internal servers, making it easy to analyze, schedule, and patch server vulnerabilities all within a react & Dot Net powered system.',
    link: { href: '#', label: '🔒 Internal' },
    logo: logoPlanetaria,
    status: 'archived',
    whatHappened: 'Company aquired to TD Ameritrade',
  },
  {
    name: 'VB Remote Sat',
    description:
      'This tool is used by all desktop support techs across the globe at Honeywell to increase efficiency allowing for multiple remote sessions, imaging, and automating all set up processes within a couple minutes instead of hours.',
    link: { href: '#', label: '🔒 Internal' },
    logo: logoOpenShuttle,
    status: 'live',
    whatHappened: 'Successfully launched and trained 100+ users still in use today.',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
}

const projectVariant = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    }
  }
}

const getStatusHoverEffect = (status) => {
  const baseEffect = {
    scale: 1.01, // Reduced from 1.02 to minimize scaling
    transition: { duration: 0.15, ease: "easeOut" } // Faster, smoother transition
  }

  const effects = {
    live: {
      ...baseEffect,
      backgroundColor: "rgba(0, 255, 157, 0.02)", // Reduced opacity
      boxShadow: "0 0 20px rgba(0, 255, 157, 0.15)", // Softer glow
      borderRadius: "1rem",
    },
    development: {
      ...baseEffect,
      backgroundColor: "rgba(255, 0, 242, 0.02)",
      boxShadow: "0 0 20px rgba(255, 0, 242, 0.15)",
      borderRadius: "1rem",
    },
    archived: {
      ...baseEffect,
      backgroundColor: "rgba(136, 136, 136, 0.02)",
      boxShadow: "0 0 20px rgba(136, 136, 136, 0.15)",
      borderRadius: "1rem",
    },
    sold: {
      ...baseEffect,
      backgroundColor: "rgba(255, 174, 0, 0.02)",
      boxShadow: "0 0 20px rgba(255, 174, 0, 0.15)",
      borderRadius: "1rem",
    },
    internal: {
      ...baseEffect,
      backgroundColor: "rgba(255, 174, 0, 0.02)",
      boxShadow: "0 0 20px rgba(255, 174, 0, 0.15)",
      borderRadius: "1rem",
    }
  }

  return effects[status] || baseEffect
}

const StatusIndicator = React.memo(({ status }) => {
  StatusIndicator.displayName = 'StatusIndicator';
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
      color: '#ff00f2',
      label: 'In Development',
      pulseRing: false,
      lightColor: '#cc00c2',
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
      className="absolute top-4 right-4 flex items-center status-indicator z-50"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="relative flex items-center">
        {config?.pulseRing && (
          <motion.div
            className="absolute inline-flex h-3 w-3 rounded-full dark:bg-opacity-100 bg-opacity-80"
            style={{ 
              backgroundColor: config?.color,
              boxShadow: `0 0 10px ${config?.color}`
            }}
            initial={{ opacity: prefersReducedMotion ? 1 : 0.5, scale: 1 }}
            animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: [0.5, 0], scale: [1, 1.8] }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <motion.div
          className="relative inline-flex h-3 w-3 rounded-full dark:bg-opacity-100 bg-opacity-80"
          style={{ 
            backgroundColor: config?.color,
            boxShadow: `0 0 10px ${config?.color}`
          }}
          animate={prefersReducedMotion ? { scale: 1 } : { scale: config?.pulseRing ? [1, 1.1, 1] : 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.span 
        className="ml-2 text-xs font-medium dark:text-zinc-200 text-zinc-700"
        whileHover={{ scale: 1.05 }}
      >
        {config?.label}
      </motion.span>
    </motion.div>
  )
})

function LinkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15.712 11.823a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm-4.95 1.768a.75.75 0 0 0 1.06-1.06l-1.06 1.06Zm-2.475-1.414a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm4.95-1.768a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm3.359.53-.884.884 1.06 1.06.885-.883-1.061-1.06Zm-4.95-2.12 1.414-1.415L12 6.344l-1.415 1.413 1.061 1.061Zm0 3.535a2.5 2.5 0 0 1 0-3.536l-1.06-1.06a4 4 0 0 0 0 5.656l1.06-1.06Zm4.95-4.95a2.5 2.5 0 0 1 0 3.535L17.656 12a4 4 0 0 0 0-5.657l-1.06 1.06Zm1.06-1.06a4 4 0 0 0-5.656 0l1.06 1.06a2.5 2.5 0 0 1 3.536 0l1.06-1.06Zm-7.07 7.07.176.177 1.06-1.06-.176-.177-1.06 1.06Zm-3.183-.353.884-.884-1.06-1.06-.884.883 1.06 1.06Zm4.95 2.121-1.414 1.414 1.06 1.06 1.415-1.413-1.06-1.061Zm0-3.536a2.5 2.5 0 0 1 0 3.536l1.06 1.06a4 4 0 0 0 0-5.656l-1.06 1.06Zm-4.95 4.95a2.5 2.5 0 0 1 0-3.535L6.344 12a4 4 0 0 0 0 5.656l1.06-1.06Zm-1.06 1.06a4 4 0 0 0 5.657 0l-1.061-1.06a2.5 2.5 0 0 1-3.535 0l-1.061 1.06Zm7.07-7.07-.176-.177-1.06 1.06.176.178 1.06-1.061Z"
        fill="currentColor"
      />
    </svg>
  )
}

const TypewriterText = React.memo(({ text, isVisible }) => {
  TypewriterText.displayName = 'TypewriterText';
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isVisible && index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex(index + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else if (!isVisible) {
      setDisplayedText('');
      setIndex(0);
    }
  }, [index, text, isVisible]);

  return <span>{displayedText}</span>;
});

export default function Projects() {
  const [activeProject, setActiveProject] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const hoverTimerRef = useRef(null)
  const HOVER_REVEAL_DELAY_MS = 300
  const [hoveringProject, setHoveringProject] = useState(null)

  const getGlowColorFromProject = (projectName) => {
    const mapping = {
      'M i P i': 'purple',
      Windstone: 'blue',
      'Auth.js - NetSuite Provider': 'green',
      'PortalGen™': 'orange',
      'ConvensionSuite - GSC™': 'blue',
      'Furious Froth Coffee®': 'orange',
      Chamoji: 'orange',
      VRSA: 'red',
      'VB Remote Sat': 'purple',
      'Kingdom Kode': 'purple',
    }
    return mapping[projectName] || 'blue'
  }

  const revealGradientClass = (projectName) => {
    const color = getGlowColorFromProject(projectName)
    const mapping = {
      purple: 'from-fuchsia-500/15 via-purple-500/10 to-indigo-500/15',
      green: 'from-emerald-500/15 via-teal-500/10 to-lime-500/15',
      blue: 'from-sky-500/15 via-blue-500/10 to-cyan-500/15',
      orange: 'from-orange-500/15 via-amber-500/10 to-yellow-500/15',
      red: 'from-rose-500/15 via-red-500/10 to-orange-500/15',
    }
    return mapping[color] || mapping.blue
  }


  const handleMouseEnter = useCallback((name) => {
    setHoveringProject(name)
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
    setHoveringProject(null)
  }, [])

  const handleClickCard = useCallback((name) => {
    setActiveProject((prev) => (prev === name ? null : name))
  }, [])

  const projectsWithValidity = useMemo(() => {
    return projects.map((p) => {
      const href = p.link?.href
      const isValidLink = !!href && typeof href === 'string' && href !== '#' && (
        href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/')
      )
      return { ...p, isValidLink }
    })
  }, [])

  const TeaserChip = React.memo(function TeaserChipComponent({ projectName, active }) {
    return (
    <motion.div
      initial={false}
      animate={{ 
        opacity: active ? 0 : 1, 
        y: active ? 6 : 0, 
        scale: active ? 0.96 : 1 // Slightly reduced scale change
      }}
      transition={{ duration: 0.2, ease: "easeOut" }} // Faster transition
      className="flex w-full justify-end"
    >
      <div className="relative overflow-hidden rounded-full ring-1 ring-white/10 shadow-sm backdrop-blur-sm hover:ring-white/20 transition-all duration-200">
        <div className={`absolute inset-0 bg-gradient-to-r ${revealGradientClass(projectName)} opacity-50 hover:opacity-70 transition-opacity duration-200`} />
        <div className="relative z-10 flex items-center gap-2 px-3 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-50">
          {hoveringProject !== projectName && (
            <span className="inline-flex items-center opacity-80">
              <MousePointer2 className="h-3.5 w-3.5" />
            </span>
          )}
          {hoveringProject === projectName && !active && (
            <div className="flex items-center gap-1">
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}>•</motion.span>
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.15, ease: "easeInOut" }}>•</motion.span>
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}>•</motion.span>
            </div>
          )}
          <span className="whitespace-nowrap">What happened</span>
        </div>
      </div>
    </motion.div>
    )
  })
  TeaserChip.displayName = 'TeaserChip'

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
      <SimpleLayout
        title="Things I've made trying to put my dent in the universe."
        intro="I've worked on tons of little projects over the years but these are the ones that I'm most proud of. Many of them are open-source, so if you see something that piques your interest, check out the code and contribute if you have ideas for how it can be improved."
      >
        <div className="mb-6 flex items-center justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              viewMode === 'grid'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
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
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            aria-pressed={viewMode === 'list'}
          >
            List
          </button>
        </div>
        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          role="list"
          className={`grid gap-x-12 gap-y-16 ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {projectsWithValidity.map((project) => (
            <motion.li
              key={project.name}
              variants={projectVariant}
              className="relative card-container"
              onMouseEnter={() => handleMouseEnter(project.name)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleMouseEnter(project.name)} // Better mobile support
              onTouchEnd={handleMouseLeave}
            >
              <StatusIndicator status={project.status} />
              <GlowCard
                className={viewMode === 'list' ? 'w-full' : 'w-full'}
                customSize
                glowColor={getGlowColorFromProject(project.name)}
                onMouseEnter={() => handleMouseEnter(project.name)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClickCard(project.name)}
              >
              <motion.div
                initial={false}
                animate={activeProject === project.name ? getStatusHoverEffect(project.status) : { scale: 1 }}
                className="rounded-2xl"
                style={{ transformOrigin: 'center' }} // Ensure scaling from center
              >
              <Card as="div">
                <motion.div 
                  className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0"
                  whileHover={{
                    rotate: 180, // Reduced rotation for smoother effect
                    scale: 1.05, // Reduced scale to prevent double scaling
                    transition: { 
                      duration: 0.3, // Faster animation
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }
                  }}
                >
                  <Image
                    src={project.logo}
                    alt=""
                    className="h-8 w-8 rounded"
                    unoptimized
                    loading="lazy"
                  />
                </motion.div>
                <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
                  <Card.Link href={project.link.href}>{project.name}</Card.Link>
                </h2>
                <Card.Description>
                  <span className="relative inline-block">
                    <span className="relative z-10">{project.description}</span>
                    <span className={`absolute -inset-1 -z-0 rounded-md blur-md bg-gradient-to-r ${revealGradientClass(project.name)} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </span>
                </Card.Description>
                <AnimatePresence mode="wait">
                  {activeProject === project.name && project?.whatHappened && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className={`relative z-30 mt-4 text-sm text-zinc-700 dark:text-zinc-200 rounded-lg ring-1 ring-white/10 bg-gradient-to-r ${revealGradientClass(project.name)} p-3 backdrop-blur-sm`}
                      style={{ 
                        backgroundColor: 'inherit',
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: {},
                          show: { transition: { staggerChildren: 0.025 } },
                        }}
                        className="leading-relaxed"
                      >
                        <b className="mr-1">What Happened:</b>
                        {project.whatHappened.split(/\s+/).map((w, i) => (
                          <motion.span
                            key={i}
                            variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}
                            className="inline-block mr-1"
                          >
                            {w}
                          </motion.span>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
              </motion.div>
              {/* Footer action bar, compact spacing */}
              <div className="mt-4 gap-3 flex items-center justify-between">
              <TeaserChip projectName={project.name} active={activeProject === project.name} />
                {project.isValidLink ? (
                  <Link 
                    href={project.link.href} 
                    onClick={(e)=>e.stopPropagation()} 
                    className="group inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm transition-all duration-200 hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-105 hover:shadow-lg"
                  >
                    <span>Visit</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-60">
                    {project.link?.label || 'Visit'}
                  </span>
                )}
              </div>
              </GlowCard>
            </motion.li>
          ))}
        </motion.ul>
      </SimpleLayout>
    </>
  )
}
