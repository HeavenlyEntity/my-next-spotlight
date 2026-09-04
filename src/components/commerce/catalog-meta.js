/* Display helpers shared by the catalog cards and the product pages. */

export function typeMeta(type) {
  switch (type) {
    case 'boilerplate':
      return { label: 'Boilerplate', accent: true }
    case 'service-package':
      return { label: 'Service', accent: false }
    case 'digital':
    default:
      return { label: 'Digital', accent: false }
  }
}

export function priceText(price, currency = 'USD') {
  if (typeof price !== 'number') return null
  return `$${price.toFixed(2)} ${currency}`
}
