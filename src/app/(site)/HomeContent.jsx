'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
import { GitHubIcon, LinkedInIcon } from '@/components/SocialIcons'
import StaggeredText from '@/components/react-bits/staggered-text'
import { ProductCard } from '@/components/commerce/storefront'
import image1 from '@/images/photos/kingdom-kode-port.webp'
import image2 from '@/images/photos/MiPi-example.webp'
import image3 from '@/images/photos/furious-froth-site.webp'
import image4 from '@/images/photos/booking-calendar.webp'
import image5 from '@/images/photos/gsc-portal.webp'
import logoRlcanning from '@/images/logos/rlcanning-logo.png'
import logoDotCom from '@/images/logos/Dot_Com_Development.png'
import logoMipi from '@/images/logos/mipi.svg'
import logoSchwab from '@/images/logos/charles-schwab.png'
import logoNewgen from '@/images/logos/newgen.png'
import logoKingdomKode from '@/images/logos/kingdom-kode-logo.svg'
import { formatDate } from '@/lib/formatDate'

const ContourField = dynamic(
  () => import('@/components/shaders/contour-field'),
  { ssr: false }
)

/* ---- icons ---------------------------------------------------------------- */

function MailIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.75 7.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="m4 6 6.024 5.479a2.915 2.915 0 0 0 3.952 0L20 6"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

function BriefcaseIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

function ArrowDownIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.75 8.75 8 12.25m0 0 3.25-3.5M8 12.25v-8.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BookIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6.75 4.75h7.5a3 3 0 0 1 3 3v10.5a.75.75 0 0 1-1.118.664c-1.176-.662-2.71-1.164-4.382-1.164H6.75a3 3 0 0 1-3-3V7.75a3 3 0 0 1 3-3Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="M16.5 4.75v12.75M6.75 8.25h6"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

/* ---- shared section header ------------------------------------------------ */

function SectionHeader({ index, eyebrow, meta, title, copy }) {
  return (
    <div>
      <div className="border-[var(--amw-line)] flex items-baseline justify-between gap-4 border-b border-dashed pb-4">
        <p className="amw-eyebrow">
          // SEC.{index} — {eyebrow}
        </p>
        {meta && <span className="amw-kicker hidden sm:block">{meta}</span>}
      </div>
      <h2
        style={{ fontFamily: 'Layer, sans-serif' }}
        className="mt-8 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl"
      >
        {title}
      </h2>
      {copy && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {copy}
        </p>
      )}
    </div>
  )
}

/* ---- hero — terminal cover sheet ------------------------------------------ */

function SocialLink({ icon: Icon, ...props }) {
  return (
    <Link className="group -m-1 p-1" {...props}>
      <Icon className="h-6 w-6 fill-zinc-400 transition group-hover:fill-zinc-300" />
    </Link>
  )
}

function Hero() {
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="amw-panel-dark amw-ticks border-[var(--amw-line)] relative overflow-hidden rounded-3xl border bg-[#0b0b0f]">
      {/* Topographic contour field. Renders a single static frame under
          reduced motion so the panel keeps its terrain either way. */}
      <div className="amw-hero-field absolute inset-0" aria-hidden="true">
        <ContourField
          scale={1.8}
          bands={7}
          indexEvery={3}
          lineWidth={0.8}
          warp={0.45}
          speed={0.5}
          fill={1}
          color="#3ce8ce"
          backgroundColor="#0b0b0f"
          cursorInteraction={!reducedMotion}
          cursorIntensity={1}
          listenToWindow
          animate={!reducedMotion}
        />
      </div>
      {/* Keeps the copy column readable where the contours are densest. */}
      <div className="amw-hero-scrim absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 px-6 py-14 sm:px-12 sm:py-20">
        <p className="amw-mono text-xs text-zinc-400">
          <span className="text-[var(--amw-accent)]">$</span> amware boot
          --profile alec.mingione
        </p>
        <p className="amw-mono amw-cursor mt-2 text-xs text-zinc-400">
          link established · engineer / designer / founder · phoenix.az
        </p>

        <StaggeredText
          as="h1"
          text={
            'From factory floors to the founder’s desk.\nEverything I learned, packaged to ship.'
          }
          segmentBy="words"
          delay={60}
          duration={0.7}
          direction="bottom"
          className="mt-8 max-w-3xl text-4xl font-bold tracking-tight text-zinc-50 [font-family:Layer,sans-serif] sm:text-[3.25rem] sm:leading-[1.08]"
        />

        <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
          I&apos;m Alec Mingione, fractional CTO, founder of MiPi, and
          co-founder &amp; CEO of Kingdom Kode. I started out automating factory
          floors, wrote production code at Charles Schwab, and now I build
          AI-powered products and teach others to do the same. This site is the
          working catalog of that journey: hire me to build with you, or take a
          boilerplate and build on your own.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/products"
            className="amw-mono bg-[var(--amw-accent)] text-zinc-950 inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] no-underline transition hover:brightness-110"
          >
            browse boilerplates →
          </Link>
          <Link
            href="/services"
            className="amw-mono border-[var(--amw-line-strong)] hover:border-[var(--amw-accent)] hover:text-[var(--amw-accent)] inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 no-underline transition"
          >
            work with me ↗
          </Link>
          <div className="ml-1 flex items-center gap-5">
            <SocialLink
              href="https://github.com/HeavenlyEntity"
              aria-label="Follow on GitHub"
              icon={GitHubIcon}
            />
            <SocialLink
              href="https://www.linkedin.com/in/alec-mingione-90bb63aa/"
              aria-label="Follow on LinkedIn"
              icon={LinkedInIcon}
            />
          </div>
        </div>

        <div className="border-[var(--amw-line)] mt-10 flex flex-wrap gap-2 border-t border-dashed pt-6">
          <span className="amw-chip amw-chip--accent">shipping since 2017</span>
          <span className="amw-chip">fractional cto</span>
          <span className="amw-chip">2 companies founded</span>
          <span className="amw-chip">mentor &amp; teacher</span>
        </div>
      </div>
    </div>
  )
}

/* ---- story — origin trace -------------------------------------------------- */

const MILESTONES = [
  {
    year: '2017',
    label: 'RL Canning · Honeywell floors',
    line: 'Taught machines to do the boring work — first proof that good automation pays for itself.',
  },
  {
    year: '2019',
    label: 'Charles Schwab',
    line: 'Learned what production-grade really means when the code moves real money.',
  },
  {
    year: '2021',
    label: 'NewGen Business Solutions',
    line: 'Senior lead engineer — owning client systems end to end, deadline after deadline.',
  },
  {
    year: '2022',
    label: 'Founded MiPi',
    line: 'First company. Every founder lesson, learned early and firsthand.',
  },
  {
    year: '2025',
    label: 'Co-founded Kingdom Kode',
    line: 'AI-powered products for businesses — and teaching kids and adults to build their own.',
  },
  {
    year: 'now',
    label: 'AMWare',
    line: 'The playbook, productized: the services and boilerplates you see on this page.',
  },
]

function StorySection() {
  return (
    <Container className="mt-24 sm:mt-32">
      <div className="amw">
        <SectionHeader
          index="01"
          eyebrow="ORIGIN TRACE"
          meta="2017 → present"
          title="Every tool here was forged on a real deadline."
          copy="Nothing in this catalog started as a product. It started as a problem — on a factory floor, in a bank’s codebase, or inside my own startups. What survived the deadline became the playbook."
        />
        <ol className="mt-10">
          {MILESTONES.map((m, i) => (
            <li
              key={m.year}
              className="amw-reveal border-[var(--amw-line)] grid grid-cols-[4.5rem_1fr] gap-x-6 border-b border-dashed py-5 sm:grid-cols-[6rem_16rem_1fr]"
              style={{ '--i': i }}
            >
              <span className="amw-mono text-[var(--amw-accent)] text-sm font-medium">
                {m.year}
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {m.label}
              </span>
              <span className="col-span-2 mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:col-span-1 sm:mt-0">
                {m.line}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Container>
  )
}

/* ---- offerings — the catalog ----------------------------------------------- */

function HomeServiceCard({ service, index = 0 }) {
  return (
    <li className="amw-reveal" style={{ '--i': index }}>
      <Link
        href="/services"
        className="amw-card amw-ticks group h-full p-6 no-underline"
      >
        <div className="flex items-center justify-between">
          <span className="amw-kicker">/{service.slug}</span>
          <span className="amw-chip amw-chip--accent amw-chip--dot">
            Service
          </span>
        </div>
        <h4 className="mt-5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {service.name}
        </h4>
        {service.summary && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {service.summary}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-6">
          {typeof service.startingPrice === 'number' ? (
            <span className="amw-price text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <span className="amw-kicker mr-1.5">from</span>$
              {service.startingPrice.toFixed(2)}
            </span>
          ) : (
            <span className="amw-kicker">scoped per project</span>
          )}
          <span className="amw-mono text-[var(--amw-accent)] inline-flex items-center gap-1 text-xs font-medium transition-all group-hover:gap-2">
            details ↗
          </span>
        </div>
      </Link>
    </li>
  )
}

function RowHeader({ kicker, title, href, linkLabel }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div>
        <p className="amw-kicker">{kicker}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
      </div>
      <Link
        href={href}
        className="amw-mono text-[var(--amw-accent)] inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium no-underline transition-all hover:gap-2"
      >
        {linkLabel} ↗
      </Link>
    </div>
  )
}

function CatalogFallback({ error }) {
  return (
    <div className="border-[var(--amw-line-strong)] relative mt-10 overflow-hidden rounded-2xl border border-dashed">
      <div
        className="amw-grid-bg absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <div className="relative px-6 py-16 text-center">
        <p className="amw-mono text-[var(--amw-mut)] text-sm">
          <span className="text-[var(--amw-accent)]">$</span> amware catalog
          --list
        </p>
        <p className="amw-mono amw-cursor mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          {error ? 'link interrupted — retrying' : '0 published — provisioning'}
        </p>
        <p className="mx-auto mt-5 max-w-sm text-sm text-zinc-500 dark:text-zinc-500">
          {error
            ? 'The catalog could not be reached. Refresh to try again, or head straight to the listings.'
            : 'The catalog is being prepared. Check back soon, or head straight to the listings.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {error && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="amw-mono border-[var(--amw-line-strong)] hover:border-[var(--amw-accent)] hover:text-[var(--amw-accent)] inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 transition dark:text-zinc-200"
            >
              retry connection
            </button>
          )}
          <Link
            href="/products"
            className="amw-mono text-[var(--amw-accent)] inline-flex items-center gap-1 text-xs font-medium no-underline transition-all hover:gap-2"
          >
            products ↗
          </Link>
          <Link
            href="/services"
            className="amw-mono text-[var(--amw-accent)] inline-flex items-center gap-1 text-xs font-medium no-underline transition-all hover:gap-2"
          >
            services ↗
          </Link>
        </div>
      </div>
    </div>
  )
}

function CatalogSection({ products, services, catalogError }) {
  const isEmpty = products.length === 0 && services.length === 0

  return (
    <Container className="mt-24 sm:mt-32">
      <div className="amw">
        <SectionHeader
          index="02"
          eyebrow="THE CATALOG"
          meta={
            catalogError
              ? undefined
              : `${services.length + products.length} items live`
          }
          title="One playbook. Two ways in."
          copy="Bring me onto your team and I build it with you — or skip the wait and start from the same foundations I use myself. Either way, you’re shipping on systems that already survived production."
        />

        {isEmpty ? (
          <CatalogFallback error={catalogError} />
        ) : (
          <>
            {services.length > 0 && (
              <div className="mt-12">
                <RowHeader
                  kicker="MODE A — I BUILD IT WITH YOU"
                  title="Engagements"
                  href="/services"
                  linkLabel="all services"
                />
                <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service, i) => (
                    <HomeServiceCard
                      key={service.id}
                      service={service}
                      index={i}
                    />
                  ))}
                </ul>
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-14">
                <RowHeader
                  kicker="MODE B — YOU BUILD ON MINE"
                  title="Boilerplates & tooling"
                  href="/products"
                  linkLabel="full catalog"
                />
                <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i + services.length}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  )
}

/* ---- proof strip ------------------------------------------------------------ */

function Photos() {
  let rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2']
  const reducedMotion = useReducedMotion()

  return (
    <div className="mt-10">
      <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
        {[image1, image2, image3, image4, image5].map((image, imageIndex) => (
          <motion.div
            initial={{
              rotateZ: imageIndex % 2 ? 3 : -3,
            }}
            whileHover={
              reducedMotion
                ? undefined
                : {
                    scale: 0.9,
                    rotateZ: imageIndex % 2 ? 0 : -1,
                  }
            }
            whileTap={reducedMotion ? undefined : { scale: 1.1 }}
            transition={{
              type: 'spring',
              stiffness: 100,
            }}
            key={image.src}
            className={clsx(
              'relative aspect-[10/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:w-72 sm:rounded-2xl',
              rotations[imageIndex % rotations.length]
            )}
          >
            <Image
              src={image}
              alt=""
              sizes="(min-width: 640px) 18rem, 11rem"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ProofSection() {
  return (
    <div className="mt-24 sm:mt-32">
      <Container>
        <div className="amw">
          <SectionHeader
            index="03"
            eyebrow="FIELD EVIDENCE"
            meta="selected work"
            title="Shipped, not staged."
          />
        </div>
      </Container>
      <Photos />
    </div>
  )
}

/* ---- newsletter / resume / articles ----------------------------------------- */

function Article({ article }) {
  return (
    <Card as="article">
      <Card.Title href={`/articles/${article.slug}`}>
        {article.title}
      </Card.Title>
      <Card.Eyebrow as="time" dateTime={article.date} decorate>
        {formatDate(article.date)}
      </Card.Eyebrow>
      <Card.Description>{article.description}</Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  )
}

function Newsletter() {
  return (
    <form
      action="/thank-you"
      className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40"
    >
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <MailIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Stay up to date</span>
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Get notified when I publish something new, and unsubscribe at any time.
      </p>
      <div className="mt-6 flex">
        <input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          required
          className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-hidden focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm"
        />
        <Button type="submit" className="ml-4 flex-none">
          Join
        </Button>
      </div>
    </form>
  )
}

function ArticlesHeader() {
  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <BookIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Articles</span>
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Things I&apos;ve written below, check out my blog!
      </p>
      <div className="flex w-full flex-col items-center justify-center pt-2">
        <ArrowDownIcon className="h-8 w-8 animate-bounce stroke-zinc-400 dark:stroke-zinc-500" />
      </div>
    </div>
  )
}

function Resume() {
  let resume = [
    {
      company: 'Kingdom Kode',
      title: 'Co-Founder & CEO',
      logo: logoKingdomKode,
      start: '2025',
      end: {
        label: 'Present',
        dateTime: new Date().getFullYear(),
      },
    },
    {
      company: 'MiPi',
      title: 'Founder & CEO',
      logo: logoMipi,
      start: '2022',
      end: {
        label: 'Present',
        dateTime: new Date().getFullYear(),
      },
    },
    {
      company: 'NewGen Business Solutions',
      title: 'Senior Lead Software Engineer',
      logo: logoNewgen,
      start: '2021',
      end: '2025',
    },
    {
      company: 'Charles Schwab',
      title: 'Software Engineer',
      logo: logoSchwab,
      start: '2019',
      end: '2021',
    },
    {
      company: 'Dot Com Development',
      title: 'Junior Software Engineer',
      logo: logoDotCom,
      start: '2018',
      end: '2019',
    },
    {
      company: 'RL Canning (Honeywell)',
      title: 'Automation Programmer & Desktop Specialist',
      logo: logoRlcanning,
      start: '2017',
      end: '2020',
    },
  ]

  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <BriefcaseIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Work</span>
      </h2>
      <ol className="mt-6 space-y-4">
        {resume.map((role) => (
          <li key={role.company} className="flex gap-4">
            <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
              <Image src={role.logo} alt="" className="h-7 w-7" unoptimized />
            </div>
            <dl className="flex flex-auto flex-wrap gap-x-2">
              <dt className="sr-only">Company</dt>
              <dd className="w-full flex-none text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {role.company}
              </dd>
              <dt className="sr-only">Role</dt>
              <dd className="text-xs text-zinc-500 dark:text-zinc-400">
                {role.title}
              </dd>
              <dt className="sr-only">Date</dt>
              <dd
                className="ml-auto text-xs text-zinc-400 dark:text-zinc-500"
                aria-label={`${role.start.label ?? role.start} until ${
                  role.end.label ?? role.end
                }`}
              >
                <time dateTime={role.start.dateTime ?? role.start}>
                  {role.start.label ?? role.start}
                </time>{' '}
                <span aria-hidden="true">—</span>{' '}
                <time dateTime={role.end.dateTime ?? role.end}>
                  {role.end.label ?? role.end}
                </time>
              </dd>
            </dl>
          </li>
        ))}
      </ol>
      <Button
        href="https://1drv.ms/w/s!AtN3Vou-qYxDq4Qmgz2PYo_NRLkFtA?e=N5oWuH"
        variant="secondary"
        className="group mt-6 w-full"
      >
        Download CV
        <ArrowDownIcon className="h-4 w-4 stroke-zinc-400 transition group-active:stroke-zinc-600 dark:group-hover:stroke-zinc-50 dark:group-active:stroke-zinc-50" />
      </Button>
    </div>
  )
}

/* ---- page ------------------------------------------------------------------- */

export default function HomeContent({
  articles,
  products = [],
  services = [],
  catalogError = false,
}) {
  return (
    <>
      <Container className="mt-10 sm:mt-16">
        <div className="amw">
          <Hero />
        </div>
      </Container>

      <StorySection />

      <CatalogSection
        products={products}
        services={services}
        catalogError={catalogError}
      />

      <ProofSection />

      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="space-y-10 lg:pr-16 xl:pr-24">
            <Newsletter />
            <Resume />
          </div>
          <div className="flex flex-col gap-16">
            <ArticlesHeader />
            {articles.map((article) => (
              <Article key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </Container>
    </>
  )
}
