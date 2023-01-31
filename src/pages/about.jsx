import Image from 'next/image'
import Head from 'next/head'
import Link from 'next/link'
import clsx from 'clsx'
import { motion } from 'framer-motion'

import { Container } from '@/components/Container'
import {
  TwitterIcon,
  InstagramIcon,
  GitHubIcon,
  LinkedInIcon,
} from '@/components/SocialIcons'
import portraitImage from '@/images/portrait.jpg'

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
            <motion.div
                initial={{
                  rotateZ: 3
                }}
                whileHover={{
                  scale: 0.95,
                  rotateZ: 0,
                  borderRadius: 15,
                }}
                className="max-w-xs px-2.5 lg:max-w-none"
            >
              <Image
                src={portraitImage}
                alt=""
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square shadow-md rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
              />
            </motion.div>
          </div>
          <div className="lg:order-first lg:row-span-2">
            <motion.h1 style={{ fontFamily: 'Layer', fontSize: 55 }} className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
              I’m <motion.span
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5
                }}
                className='bg-gradient-to-r from-teal-600 to-green-400 inline-block text-transparent bg-clip-text'
            >
              Alec Mingione
            </motion.span>. I live in <motion.span
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.5
                }}
                className='bg-gradient-to-r from-red-600 to-yellow-400 inline-block text-transparent bg-clip-text'
            >Phoenix Arizona</motion.span>, where I create the&nbsp;
                <motion.span
                    initial={{
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      color: 'gray',
                      textDecoration: '2px teal strikethrough'
                    }}
                    transition={{
                      duration: 0.5,
                      delay: 1
                    }}
                >future</motion.span> to technology.
            </motion.h1>
            <div style={{  fontSize: 18 }} className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
              <p>
                I’ve loved making things; being creative for as long as I can remember, and
                wrote my first program when I was 13 years old, just two weeks
                after my mom brought home the brand new Emachine 2000 that I
                taught myself to type on.
              </p>
              <p>
                The only thing I loved more than computers as a kid was space.
                When I was 8, I climbed the 40-foot oak tree at the back of our
                yard while wearing my older sister’s motorcycle helmet, counted
                down from three, and jumped — hoping the tree was tall enough
                that with just a bit of momentum I’d be able to get to orbit.
              </p>
              <p>
                I spent the next few summers indoors working on a rocket design,
                while I recovered from the multiple surgeries it took to fix my
                badly broken legs. It took nine iterations, but when I was 15 I
                sent my dad’s Blackberry into orbit and was able to transmit a
                photo back down to our family computer from space.
              </p>
              <p>
                Today, I’m the founder of Planetaria, where we’re working on
                civilian space suits and manned shuttle kits you can assemble at
                home so that the next generation of kids really <em>can</em>{' '}
                make it to orbit — from the comfort of their own backyards.
              </p>
            </div>
          </div>
          <div className="lg:pl-20">
            <ul role="list">
              <SocialLink href="#" icon={TwitterIcon}>
                Follow on Twitter
              </SocialLink>
              <SocialLink href="#" icon={InstagramIcon} className="mt-4">
                Follow on Instagram
              </SocialLink>
              <SocialLink href="#" icon={GitHubIcon} className="mt-4">
                Follow on GitHub
              </SocialLink>
              <SocialLink href="#" icon={LinkedInIcon} className="mt-4">
                Follow on LinkedIn
              </SocialLink>
              <SocialLink
                href="mailto:alec@mipi.io"
                icon={MailIcon}
                className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
              >
                alec@mipi.io
              </SocialLink>
            </ul>
          </div>
        </div>
      </Container>
    </>
  )
}
