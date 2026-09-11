import React from 'react'
import Image from 'next/image'

import amwareCrown from '@/images/logos/amware-crown-mark.webp'

type AdminUser = {
  email?: string | null
  name?: string | null
}

type DashboardProps = {
  user?: AdminUser | null
}

const AmwareMark = ({ fill, title }: { fill?: string; title?: string }) => (
  <Image
    aria-hidden={title ? undefined : true}
    alt={title || ''}
    className="amware-admin-mark"
    src={amwareCrown}
    style={
      fill === '#fff' || fill === '#ffffff'
        ? { filter: 'invert(1)' }
        : undefined
    }
  />
)

const AdminWordmark = () => (
  <span className="amware-admin-wordmark">
    <AmwareMark title="Amware" />
    <span className="amware-admin-wordmark__copy">
      <span className="amware-admin-wordmark__name">AMWARE</span>
      <span className="amware-admin-wordmark__label">ADMIN</span>
    </span>
  </span>
)

export const AmwareAdminLogo = () => <AdminWordmark />

export const AmwareAdminIcon = ({ fill }: { fill?: string }) => (
  <AmwareMark fill={fill} />
)

export const AmwareAdminNavBrand = () => (
  <a
    aria-label="Amware admin dashboard"
    className="amware-admin-nav-brand"
    href="/admin"
  >
    <AdminWordmark />
  </a>
)

export const AmwareAdminLoginIntro = () => (
  <div className="amware-admin-login-intro">
    <p className="amware-admin-kicker">{'// PRIVATE WORKSPACE'}</p>
    <h1>Control room.</h1>
    <p>Content, commerce, and customer operations in one precise workspace.</p>
  </div>
)

export const AmwareAdminDashboard = ({ user }: DashboardProps) => {
  const operator = user?.name || user?.email

  return (
    <section className="amware-admin-dashboard-intro">
      <div className="amware-admin-dashboard-intro__copy">
        <p className="amware-admin-kicker">
          <span aria-hidden="true" className="amware-admin-status" />
          {'// AMWARE / CONTROL ROOM'}
        </p>
        <h1>Build with clarity.</h1>
        <p>
          Shape the writing, work, and products that make up the Amware system.
        </p>
      </div>
      <div className="amware-admin-dashboard-intro__meta">
        <span>OPERATOR</span>
        <strong>{operator || 'Authenticated'}</strong>
      </div>
    </section>
  )
}
