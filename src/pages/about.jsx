import Image from 'next/image'
import Head from 'next/head'
import Link from 'next/link'
import clsx from 'clsx'
import { motion } from 'motion/react'

import { Container } from '@/components/Container'
import {
  TwitterIcon,
  InstagramIcon,
  GitHubIcon,
  LinkedInIcon,
} from '@/components/SocialIcons'
import ProfileCard from '@/components/ProfileCard'
import portraitImage from '@/images/portrait-bg-removed.png'
import amwareLogo from '@/images/logos/AMWARE-Crown-Black.svg'

function SocialLink({ className, href, children, icon: Icon }) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  )
}

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

export default function About() {
  return (
    <>
      <Head>
        <title>About - Alec Mingione</title>
        <meta
          name="description"
          content="I’m Alec Mingione. I live in Phoenix Arizona, where I engineer the future."
        />
      </Head>
      <Container className="mt-16 sm:mt-32">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
          <div className="lg:pl-20">
            <div className="max-w-68 mx-auto flex justify-center px-2.5 sm:max-w-xs sm:justify-self-center lg:mx-0 lg:w-[325px] lg:max-w-none">
              <ProfileCard
                avatarUrl={portraitImage.src}
                name="Alec Mingione"
                title="Founder & Engineer"
                handle="AmwareDotDev"
                status="Engineering the Future"
                iconUrl={amwareLogo.src}
                behindGlowEnabled
                behindGlowColor="rgba(125, 190, 255, 0.67)"
                showUserInfo={false}
                cardHeightMobile="62svh"
                cardMaxHeightMobile="460px"
                cardHeightDesktop="80svh"
                cardMaxHeightDesktop="650px"
              />
            </div>
          </div>
          <div className="lg:order-first lg:row-span-2 ">
            <motion.h1
              style={{ fontFamily: 'Layer' }}
              className="text-5xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 md:text-4xl"
            >
              I’m{' '}
              <motion.span
                style={{ fontFamily: 'Layer' }}
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="bg-linear-to-r inline-block from-teal-600 to-green-400 bg-clip-text text-transparent"
              >
                Alec Mingione
              </motion.span>
              . I live in{' '}
              <motion.span
                style={{ fontFamily: 'Layer' }}
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.5,
                }}
                className="bg-linear-to-r inline-block from-red-600 to-yellow-400 bg-clip-text text-transparent"
              >
                Phoenix Arizona
              </motion.span>
              , where I create the&nbsp;
              <motion.span
                style={{ fontFamily: 'Layer' }}
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  color: 'gray',
                  textDecoration: '2px teal strikethrough',
                }}
                transition={{
                  duration: 0.5,
                  delay: 1,
                }}
              >
                future
              </motion.span>{' '}
              in technology.
            </motion.h1>
            <div
              style={{ fontSize: 18 }}
              className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400"
            >
              <p>
                I’ve loved making things; being creative for as long as I can
                remember, and wrote my first program when I was 8 years old,
                just two weeks after my mom brought home the brand new Emachine
                2000 that I taught myself to type on.
              </p>
              <p>
                The only thing I loved more than computers as a kid was cars,
                art, and taking things apart. At 13 I began building computers
                for the time trying to create the biggest and baddest gaming PC.
                My first build was an ASUS with 4GBs of DDR2 RAM. A caveman now
                a days!
              </p>
              <p>
                That curiosity turned into a career. I started as an automation
                programmer at Honeywell, writing the scripts that kept
                industrial systems humming. From there I moved into web
                engineering&mdash;cutting my teeth as a junior developer, then
                joining Charles Schwab as a Software Engineer where I shipped
                production code for one of the largest brokerages in the world.
                Every role deepened the same instinct I had as a kid: figure out
                how the machine works, then make it work better.
              </p>
              <p>
                At NewGen Business Solutions I stepped into a Senior Lead role
                and the work shifted from writing features to designing the
                systems they lived in. I owned architecture decisions, set
                technical direction for the team, and mentored engineers through
                complex builds. It was the first time I realized the hardest
                problems weren&apos;t in the code&mdash;they were in the gap
                between what the business needed and what the technology could
                deliver.
              </p>
              <p>
                That realization led me to pursue an MBA, which I completed in
                February 2026&mdash;pitching to real investors, stress-testing
                business models, and learning to speak the language of growth
                alongside the language of code. Today I&apos;m the founder of
                MiPi and Co-Founder of Kingdom Kode, and I serve as an on-demand
                CTO for teams that need someone who can whiteboard architecture
                in the morning and present unit economics in the afternoon. If
                you&apos;re looking for someone who bridges the boardroom and
                the codebase, that&apos;s exactly the gap I was built to close.
              </p>
            </div>
          </div>
          <div className="lg:pl-20">
            <ul role="list">
              <SocialLink href="https://x.com/AmwareDotDev" icon={TwitterIcon}>
                Follow on Twitter
              </SocialLink>
              <SocialLink
                href="https://www.instagram.com/amware.dev/"
                icon={InstagramIcon}
                className="mt-4"
              >
                Follow on Instagram
              </SocialLink>
              <SocialLink
                href="https://github.com/HeavenlyEntity"
                icon={GitHubIcon}
                className="mt-4"
              >
                Follow on GitHub
              </SocialLink>
              <SocialLink
                href="https://www.linkedin.com/in/alec-mingione-90bb63aa/"
                icon={LinkedInIcon}
                className="mt-4"
              >
                Follow on LinkedIn
              </SocialLink>
              <SocialLink
                href="mailto:amware.develop@gmail.com"
                icon={MailIcon}
                className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
              >
                amware.develop@gmail.com
              </SocialLink>
            </ul>
          </div>
        </div>
      </Container>
    </>
  )
}
