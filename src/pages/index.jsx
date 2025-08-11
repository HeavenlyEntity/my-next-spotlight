import { useEffect, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import Link from 'next/link'
import clsx from 'clsx'
import Typewriter from 'typewriter-effect'
import { motion } from 'framer-motion'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
import {
  TwitterIcon,
  InstagramIcon,
  GitHubIcon,
  LinkedInIcon,
} from '@/components/SocialIcons'
import image1 from '@/images/photos/kingdom-kode-port.webp'
import image2 from '@/images/photos/MiPi-example.webp'
import image3 from '@/images/photos/furious-froth-site.webp'
import image4 from '@/images/photos/booking-calendar.webp'
import image5 from '@/images/photos/gsc-portal.webp'
import logoAirbnb from '@/images/logos/airbnb.svg'
import logoFacebook from '@/images/logos/facebook.svg'
import logoPlanetaria from '@/images/logos/planetaria.svg'
import logoRlcanning from '@/images/logos/rlcanning-logo.png'
import logoDotCom from '@/images/logos/Dot_Com_Development.png'
import logoMipi from '@/images/logos/mipi.svg'
import logoSchwab from '@/images/logos/charles-schwab.png'
import logoNewgen from '@/images/logos/newgen.png'
import logoStarbucks from '@/images/logos/starbucks.svg'
import { generateRssFeed } from '@/lib/generateRssFeed'
import { getAllArticles } from '@/lib/getAllArticles'
import { formatDate } from '@/lib/formatDate'

const onDownloadResume = () => {
  fetch(file).then((response) => {
    response.blob().then((blob) => {
      let url = window.URL.createObjectURL(blob)
      let a = document.createElement('a')
      a.href = url
      a.download = 'testFile.docx'
      a.click()
    })
  })
}

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

function SocialLink({ icon: Icon, ...props }) {
  return (
    <Link className="group -m-1 p-1" {...props}>
      <Icon className="h-6 w-6 fill-zinc-500 transition group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300" />
    </Link>
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
          className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm"
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
    <ArticlesPointer />

    </div>
  )
}

function ArticlesPointer() {
  return (
    <div className="flex justify-center items-center flex-col w-full pt-2">
      <ArrowDownIcon className="h-8 w-8 stroke-zinc-400 dark:stroke-zinc-500 animate-bounce" />
    </div>
  )
}

function Resume() {
  let resume = [
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
      title: 'Senior Software Engineer',
      logo: logoNewgen,
      start: '2021',
      end: {
        label: 'Present',
        dateTime: new Date().getFullYear(),
      },
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
        {resume.map((role, roleIndex) => (
          <li key={roleIndex} className="flex gap-4">
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

function Photos() {
  let rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2']

  return (
    <div className="mt-16 sm:mt-20">
      <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
        {[image1, image2, image3, image4, image5].map((image, imageIndex) => (
          <motion.div
            initial={{
              rotateZ: imageIndex % 2 ? 3 : -3,
            }}
            whileHover={{
              scale: 0.9,
              rotateZ: imageIndex % 2 ? 0 : -1,
            }}
            whileTap={{
              scale: 1.1,
            }}
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

const TextVariants = {
  offscreen: {
    y: '100%',
    opacity: 0,
    position: 'absolute',
  },
  onscreen: {
    y: 0,
    opacity: 1,
    position: 'relative',
  },
  exit: {
    opacity: 0,
    display: 'none',
    position: 'absolute',
  },
}

export default function Home({ articles }) {
  const texts = ['Engineer', 'Designer', 'Founder']
  const [currentWord, setCurrentWord] = useState(-1)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i === texts.length) clearInterval(interval)
      else setCurrentWord(i)
      i++
    }, 2100 + texts[i].length * 1.1)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Head>
        <title>
          Alec Mingione - Software engineer, founder, and amateur photographer
        </title>
        <meta
          name="description"
          content="I’m Alec, a software designer and entrepreneur based in Phoenix Arizona. I’m the founder and CEO of MiPi, where we develop technologies that empower regular people to explore freedom of speech on their own terms."
        />
      </Head>
      <Container className="mt-9">
        <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
          <svg
            className="relative left-[calc(50%-11rem)] -z-10 h-[21.1875rem] max-w-none -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:h-[42.375rem]"
            viewBox="0 0 1155 678"
          >
            <path
              fill="url(#9b2541ea-d39d-499b-bd42-aeea3e93f5ff)"
              fillOpacity=".3"
              d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
            />
            <defs>
              <linearGradient
                id="9b2541ea-d39d-499b-bd42-aeea3e93f5ff"
                x1="1155.49"
                x2="-78.208"
                y1=".177"
                y2="474.645"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#9089FC" />
                <stop offset={1} stopColor="#FF80B5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="max-w-2xl">
          <div
            style={{ fontFamily: 'Layer, sans-serif' }}
            className="py-3 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl"
          >
            Software{' '}
            {
              <span className="text-teal-500">
                <Typewriter
                  options={{
                    loop: true,
                  }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString(
                        "<span class='bg-gradient-to-r from-teal-600  to-lime-300 inline-block text-transparent bg-clip-text'>Engineer</span>"
                      )
                      .pauseFor(1000)
                      .deleteAll()
                      .typeString(
                        "<span class='bg-gradient-to-r from-teal-600 to-orange-400 inline-block text-transparent bg-clip-text'>Designer</span>"
                      )
                      .pauseFor(1000)
                      .deleteAll()
                      .typeString(
                        "<span class='bg-gradient-to-r from-red-600 to-yellow-400 inline-block text-transparent bg-clip-text'>Founder</span>"
                      )
                      .pauseFor(3000)
                      .start()
                  }}
                />
              </span>
            }{' '}
            & amateur artist.
          </div>

          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            Hi! I’m Alec, a senior software engineer and entrepreneur based in
            Phoenix Arizona. I’m the founder and CEO of MiPi, where we develop
            technologies that empower people to explore free speech, privacy,
            and social engagement on their own terms.
          </p>
          <div className="mt-6 flex gap-6">
            {/*<SocialLink
              href="https://twitter.com"
              aria-label="Follow on Twitter"
              icon={TwitterIcon}
            />
            <SocialLink
              href="https://instagram.com"
              aria-label="Follow on Instagram"
              icon={InstagramIcon}
            />*/}
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
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="space-y-10 lg:pr-16 xl:pr-24">
            <Newsletter />
            <Resume />
          </div>
          <div className="flex flex-col gap-16">
            {/*<div style={{ fontFamily: 'Layer, sans-serif' }} className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl py-3">*/}
            {/*  Articles Coming Soon!*/}
            {/*</div>*/}
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

export async function getStaticProps() {
  if (process.env.NODE_ENV === 'production') {
    await generateRssFeed()
  }

  return {
    props: {
      articles: (await getAllArticles())
        .slice(0, 4)
        .map(({ component, ...meta }) => meta),
    },
  }
}
