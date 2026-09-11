'use client'

import React from 'react'

/*
 * `amount` is stored in cents, because that is what Creem sends and rounding
 * money on the way in is how you end up with orders that disagree with the
 * processor. The list column was therefore showing 49900, which reads as
 * either $49,900 or a bug depending on the reader.
 *
 * Zero is rendered as "Free" rather than "$0.00": a free claim is a different
 * kind of row, not a sale that happened to cost nothing, and it is the thing
 * the ledger above counts separately.
 */
export const AmountCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => {
  if (cellData === 0) {
    return (
      <span className="amware-admin-amount amware-admin-amount--free">
        Free
      </span>
    )
  }
  if (typeof cellData !== 'number' || Number.isNaN(cellData)) {
    return (
      <span className="amware-admin-amount amware-admin-amount--none">—</span>
    )
  }
  return (
    <span className="amware-admin-amount">
      {`$${(cellData / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`}
    </span>
  )
}
