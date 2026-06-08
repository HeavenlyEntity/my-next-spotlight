'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

import { Container } from '@/components/Container'
// PillNav is a plain-JS component with no TS declarations; cast to suppress inference errors.
import PillNavJS from '@/components/PillNav'
import { SiteModeToggle } from '@/components/site/SiteModeToggle'
import avatarImage from '@/images/avatar.png'
import amwareLogo from '@/images/logos/Amware-icon-mono.svg'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PillNav = PillNavJS as React.ComponentType<any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ContainerAny = Container as React.ComponentType<any>

const navItems = [
  { label: 'Products', href: '/products' },
  { label: 'Courses', href: '/courses' },
  { label: 'Services', href: '/services' },
  { label: 'Blog', href: '/blog' },
  { label: 'Home', href: '/' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const read = () =>
      setTheme(
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      )
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <header className="relative z-50 pt-6">
      <ContainerAny>
        <div className="relative flex gap-4">
          <div className="flex flex-1">
            <Link
              href="/"
              aria-label="Home"
              className={clsx(
                'h-10 w-10 rounded-full bg-white/90 p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:ring-white/10'
              )}
            >
              <Image
                src={avatarImage}
                alt=""
                sizes="2.25rem"
                className="h-9 w-9 rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                priority
              />
            </Link>
          </div>
          <div className="flex flex-1 justify-center">
            <PillNav
              theme={theme === 'light' ? 'color' : 'dark'}
              logo={amwareLogo.src}
              logoAlt="AMWare Logo"
              logoClassName={theme === 'dark' ? '' : 'invert'}
              items={navItems}
              activeHref={pathname}
              className="custom-nav"
              ease="power2.easeOut"
              baseColor={theme === 'dark' ? '#000' : '#ededed'}
              pillColor={theme === 'dark' ? '#252429' : '#fefefe'}
              hoveredPillTextColor={theme === 'light' ? '#79c9b8' : '#f4f3f5'}
              pillTextColor={theme === 'dark' ? '#3ce8ce' : '#343434'}
              initialLoadAnimation={false}
            />
          </div>
          <div className="flex flex-1 justify-end">
            <SiteModeToggle />
          </div>
        </div>
      </ContainerAny>
    </header>
  )
}
