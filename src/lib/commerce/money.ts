/*
 * One price format for the whole storefront.
 *
 * There were several. The product card's headline said "$999" while the
 * button directly beneath it said "$999.00", because one used
 * toLocaleString and the other toFixed(2) -- the same number, disagreeing
 * with itself inside a single card. The catalogue grid and the courses page
 * had the third and fourth copies.
 *
 * Whole dollars stay whole: every price here is a round number, and ".00"
 * is two characters of noise on the one line a buyer reads most carefully.
 * Cents appear only when a price actually has them. Thousands are grouped,
 * so $12,000 cannot be misread as $12.
 */
export function usd(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}
