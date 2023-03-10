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
                animate={{
                  rotateZ: 3
                }}
                whileHover={{
                  scale: 0.95,
                  rotateZ: 0,
                  borderRadius: 15,
                }}
                transition={{
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 300
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
          <div className="lg:order-first lg:row-span-2 ">
            <motion.h1 style={{ fontFamily: 'Layer' }} className="text-5xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 md:text-4xl">
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
                wrote my first program when I was 8 years old, just two weeks
                after my mom brought home the brand new Emachine 2000 that I
                taught myself to type on.
              </p>
              <p>
                The only thing I loved more than computers as a kid was cars, art, and taking things apart.
                At 13 I began building computers for the time trying to create the biggest and baddest gaming PC.
                My first build was an ASUS with 4GBs of DDR2 RAM. A caveman that thing is these days.
              </p>
              <p>
                Taking classes and becoming more aware with the advancements in technology. At 15 I had been taking a computer class
                that only a few kids got allowed to take. Excited, I learned about HTML, CSS, and JS along with how it
                works on the computer itself going down to assembly code.
                I had built a Facebook clone single page showcasing myself, my future career, and why.
                It was so hard, but once I figured it out I wanted it to be the best thing in the class.
              </p>
              <p>
                Today, I’m the founder of MiPi, where we’re working on
                citizen privacy, encryption, free speech, and blockchain technology to empower the people at
                home so that the next generation of kids can really <em>understand</em>{' '}
                privacy from their hands defining true freedom and controlled exposure.
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
              <SocialLink href="https://github.com/HeavenlyEntity" icon={GitHubIcon} className="mt-4">
                Follow on GitHub
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/in/alec-mingione-90bb63aa/" icon={LinkedInIcon} className="mt-4">
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
