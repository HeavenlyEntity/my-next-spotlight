import Image from 'next/image'
import Head from 'next/head'

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
import logoMipi from '@/images/logos/mipi.svg'

const projects = [
  {
    name: 'M i P i',
    description:
      'Creating technology to empower freedom of speech, privacy, and self promotion. In progress with Windstone integration.',
    link: { href: 'http://launch.mipi.io', label: 'launch.mipi.io' },
    logo: logoMipi,
  },
  {
    name: 'Windstone',
    description:
      'Highly private web browser desktop application built in electron.',
    link: { href: '#', label: 'github.com' },
    logo: logoWindstone,
  },
  {
    name: 'PortalGen™',
    description:
      'Completely customizable system for generating PWAs (Portal web applications) using Oracle NetSuite backend technologies.\n- Built at NewGen',
    link: { href: 'https://newgennow.com/portalgen', label: 'newgennow.com/portalgen' },
    logo: logoPortalGen,
  },
  {
    name: 'Furious Froth Coffee®',
    description:
      'The ultimate coffee site powered by Shopify with a headless storefront powered by Next.js',
    link: { href: '#', label: 'github.com' },
    logo: logoFuriousFroth,
  },
  {
    name: 'Chamoji',
    description:
      'The modern CLI alternative to gitmoji-changelog. Still in progress getting cool things rigged up.',
    link: { href: 'https://github.com/HeavenlyEntity/chamoji', label: 'github.com' },
    logo: logoChamoji,
  },
  {
    name: 'VRSA',
    description:
      'A automated patching tool for internal servers, making it easy to analyze, schedule, and patch server vulnerabilities all within a react & Dot Net powered system.',
    link: { href: '#', label: '🔒 Internal' },
    logo: logoPlanetaria,
  },
  {
    name: 'VB Remote Sat',
    description:
      'This tool is used by all desktop support techs across the globe at Honeywell to increase efficiency allowing for multiple remote sessions, imaging, and automating all set up processes within a couple minutes instead of hours.',
    link: { href: '#', label: '🔒 Internal' },
    logo: logoOpenShuttle,
  },
]

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

export default function Projects() {
  return (
    <>
      <Head>
        <title>Projects - Alec Mingione</title>
        <meta
          name="description"
          content="Things I’ve made trying to put my dent in the universe."
        />
      </Head>
      <SimpleLayout
        title="Things I’ve made trying to put my dent in the universe."
        intro="I’ve worked on tons of little projects over the years but these are the ones that I’m most proud of. Many of them are open-source, so if you see something that piques your interest, check out the code and contribute if you have ideas for how it can be improved."
      >
        <ul
          role="list"
          className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <Card as="li" key={project.name}>
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
                <Image
                  src={project.logo}
                  alt=""
                  className="h-8 w-8"
                  unoptimized
                />
              </div>
              <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
                <Card.Link href={project.link.href}>{project.name}</Card.Link>
              </h2>
              <Card.Description>{project.description}</Card.Description>
              <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-teal-500 dark:text-zinc-200">
                <LinkIcon className="h-6 w-6 flex-none" />
                <span className="ml-2">{project.link.label}</span>
              </p>
            </Card>
          ))}
        </ul>
      </SimpleLayout>
    </>
  )
}
