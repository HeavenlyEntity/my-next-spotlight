import Image from 'next/image'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect, useState, useCallback } from 'react'
import { debounce } from 'lodash'

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
    scale: 1.02,
    transition: { duration: 0.2 }
  }

  const effects = {
    live: {
      ...baseEffect,
      backgroundColor: "rgba(0, 255, 157, 0.03)",
      boxShadow: "0 0 25px rgba(0, 255, 157, 0.2)",
      borderRadius: "1rem",
    },
    development: {
      ...baseEffect,
      backgroundColor: "rgba(255, 0, 242, 0.03)",
      boxShadow: "0 0 25px rgba(255, 0, 242, 0.2)",
      borderRadius: "1rem",
    },
    archived: {
      ...baseEffect,
      backgroundColor: "rgba(136, 136, 136, 0.03)",
      boxShadow: "0 0 25px rgba(136, 136, 136, 0.2)",
      borderRadius: "1rem",
    },
    sold: {
      ...baseEffect,
      backgroundColor: "rgba(255, 174, 0, 0.03)",
      boxShadow: "0 0 25px rgba(255, 174, 0, 0.2)",
      borderRadius: "1rem",
    },
    internal: {
      ...baseEffect,
      backgroundColor: "rgba(255, 174, 0, 0.03)",
      boxShadow: "0 0 25px rgba(255, 174, 0, 0.2)",
      borderRadius: "1rem",
    }
  }

  return effects[status] || baseEffect
}

const StatusIndicator = React.memo(({ status }) => {
  StatusIndicator.displayName = 'StatusIndicator';
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
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ 
              opacity: [0.5, 0],
              scale: [1, 1.8],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        <motion.div
          className="relative inline-flex h-3 w-3 rounded-full dark:bg-opacity-100 bg-opacity-80"
          style={{ 
            backgroundColor: config?.color,
            boxShadow: `0 0 10px ${config?.color}`
          }}
          animate={{ 
            scale: config?.pulseRing ? [1, 1.1, 1] : 1
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
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

  const handleMouseEnter = (name) => {
    setActiveProject(name);
  };

  const handleMouseLeave = () => {
    setActiveProject(null);
  };

  const handleTouchStart = (name) => {
    const timeout = setTimeout(() => {
      setActiveProject(name);
    }, 500); // Long press duration

    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    const cards = document.getElementsByClassName('card-container');
    
    const handleMouseMove = debounce((e) => {
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    }, 100); // Debounce to reduce frequency

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

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
        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          role="list"
          className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <motion.li
              key={project.name}
              variants={projectVariant}
              whileHover={getStatusHoverEffect(project.status)}
              className="relative card-container"
              onMouseEnter={() => handleMouseEnter(project.name)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleTouchStart(project.name)}
              onTouchEnd={handleMouseLeave}
            >
              <StatusIndicator status={project.status} />
              <Card as="div">
                <motion.div 
                  className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0"
                  whileHover={{
                    rotate: 360,
                    scale: 1.1,
                    transition: { 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200
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
                <Card.Description>{project.description}</Card.Description>
                <AnimatePresence mode="wait">
                  {activeProject === project.name && project?.whatHappened && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-30 mt-4 text-sm text-zinc-600 dark:text-zinc-400"
                      style={{ 
                        backgroundColor: 'inherit',
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <b>What Happened:</b> <TypewriterText text={project.whatHappened} isVisible={activeProject === project.name} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-teal-500 dark:text-zinc-200">
                  <LinkIcon className="h-6 w-6 flex-none" />
                  <span className="ml-2">{project.link.label}</span>
                </p>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      </SimpleLayout>
    </>
  )
}
