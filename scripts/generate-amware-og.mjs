/** Offline, deterministic social artwork. No CMS, network or provider access. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { ImageResponse } from 'next/og.js'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public/images/og/amware')
const review = path.join(root, 'docs/design/2026-09-13-amware-open-graph')
const catalog = JSON.parse(
  await fs.readFile(path.join(root, 'src/lib/social/og-catalog.json'), 'utf8')
)
const fonts = await Promise.all(
  ['Regular', 'Bold'].map(async (weight, i) => ({
    name: 'Inter',
    data: await fs.readFile(
      path.join(root, `public/fonts/Inter/Inter-${weight}.woff`)
    ),
    weight: i ? 700 : 400,
    style: 'normal',
  }))
)
const crown = `data:image/png;base64,${(
  await sharp(path.join(root, 'src/images/logos/amware-crown-mark.webp'))
    .png()
    .toBuffer()
).toString('base64')}`
const portrait = `data:image/png;base64,${(
  await sharp(path.join(root, 'src/images/portrait-bg-removed.png'))
    .resize({ width: 800, height: 860, fit: 'inside' })
    .png()
    .toBuffer()
).toString('base64')}`
const ink = '#101c1b'
const mint = '#b5edcf'
const paper = '#f3f1e9'

const box = (style, ...children) =>
  h('div', { style: { display: 'flex', ...style } }, ...children.flat())
const label = (text, style = {}) =>
  box({ fontSize: 15, letterSpacing: 2, fontWeight: 700, ...style }, text)
const mark = (size = 48) =>
  h('img', { src: crown, width: size, height: size * (619 / 900) })
const line = (style) => box({ height: 1, background: '#49625b', ...style })

function artwork(item) {
  const faint = item.dark ? '#344d45' : '#c9d1c6'
  const surface = item.dark ? '#1c332d' : '#e2e9df'
  if (item.variant === 'portrait') {
    return box(
      { position: 'relative', width: 400, height: 430, alignItems: 'center' },
      box({
        position: 'absolute',
        top: 26,
        left: 38,
        width: 320,
        height: 320,
        borderRadius: 160,
        border: `1px solid ${faint}`,
        background: surface,
      }),
      box(
        {
          position: 'absolute',
          top: 58,
          left: 0,
          width: 320,
          height: 320,
          borderRadius: 160,
          background: mint,
          border: '1px solid #96c7ac',
          overflow: 'hidden',
        },
        h('img', {
          src: portrait,
          width: 360,
          height: 387,
          style: {
            position: 'absolute',
            top: -12,
            left: -25,
            objectFit: 'contain',
          },
        })
      ),
      box(
        {
          position: 'absolute',
          top: 263,
          left: 260,
          width: 132,
          height: 132,
          borderRadius: 66,
          border: `6px solid ${item.dark ? '#162c24' : '#e8ece2'}`,
          background: mint,
          alignItems: 'center',
          justifyContent: 'center',
        },
        mark(83)
      )
    )
  }
  if (item.variant === 'kit') {
    return box(
      { width: 380, height: 380, position: 'relative' },
      box({
        position: 'absolute',
        top: 0,
        left: 55,
        width: 300,
        height: 306,
        border: `1px solid ${faint}`,
        background: surface,
        transform: 'rotate(8deg)',
      }),
      box({
        position: 'absolute',
        top: 21,
        left: 31,
        width: 300,
        height: 310,
        border: `1px solid ${faint}`,
        background: item.dark ? '#29463b' : '#d1ddcd',
        transform: 'rotate(3deg)',
      }),
      box(
        {
          position: 'absolute',
          top: 47,
          left: 0,
          width: 314,
          height: 311,
          background: mint,
          color: ink,
          padding: 28,
          flexDirection: 'column',
          boxShadow: '0 20px 30px #00000018',
          border: '1px solid #9acfb2',
        },
        box(
          { justifyContent: 'space-between', alignItems: 'center' },
          label('WAREKIT'),
          mark(35)
        ),
        box(
          { flex: 1, alignItems: 'center', justifyContent: 'center' },
          mark(167)
        ),
        line({ background: '#87b89d', marginBottom: 19 }),
        label(item.stack, { fontSize: 14, letterSpacing: 1 }),
        label(item.edition, {
          marginTop: 9,
          fontSize: 12,
          letterSpacing: 1.4,
          color: '#345245',
        })
      )
    )
  }
  if (item.variant === 'systems') {
    return box(
      {
        width: 370,
        height: 375,
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 22,
      },
      line({
        position: 'absolute',
        left: 32,
        top: 40,
        width: 1,
        height: 294,
        background: faint,
      }),
      ['01', '02', '03'].map((n, i) =>
        box(
          {
            position: 'relative',
            marginLeft: i * 24,
            width: 306,
            height: 88,
            background: i === 1 ? mint : surface,
            border: `1px solid ${i === 1 ? '#96c7ac' : faint}`,
            color: i === 1 ? ink : item.dark ? mint : ink,
            padding: 22,
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          label(n, { fontSize: 24, letterSpacing: -1 }),
          box(
            { gap: 6, alignItems: 'flex-end' },
            [18, 29, 42, 29].map((height, j) =>
              box({
                height,
                width: 7,
                background: i === 1 ? ink : item.dark ? '#658974' : '#9caf9d',
                opacity: 1 - j * 0.12,
              })
            )
          ),
          i === 1
            ? mark(49)
            : box({
                width: 48,
                height: 30,
                borderTop: `1px solid ${faint}`,
                borderBottom: `1px solid ${faint}`,
              })
        )
      )
    )
  }
  if (item.variant === 'editorial') {
    return box(
      { position: 'relative', width: 364, height: 385 },
      box({
        position: 'absolute',
        left: 48,
        top: 12,
        width: 275,
        height: 333,
        border: `1px solid ${faint}`,
        background: surface,
        transform: 'rotate(8deg)',
      }),
      box(
        {
          position: 'absolute',
          top: 37,
          left: 8,
          width: 282,
          height: 335,
          background: mint,
          color: ink,
          padding: 28,
          flexDirection: 'column',
          transform: 'rotate(-5deg)',
        },
        box(
          { justifyContent: 'space-between', alignItems: 'center' },
          label('FIELDNOTES', { fontSize: 12 }),
          mark(32)
        ),
        box(
          { fontSize: 126, fontWeight: 700, lineHeight: 1, marginTop: 17 },
          '{ }'
        ),
        line({ background: '#719f86', marginTop: 16 }),
        line({ background: '#719f86', marginTop: 15 }),
        line({ background: '#719f86', marginTop: 15, width: 155 }),
        label('AMWARE / IDEAS', { fontSize: 11, marginTop: 27 })
      )
    )
  }
  if (item.variant === 'decisions') {
    return box(
      {
        position: 'relative',
        width: 370,
        height: 370,
        alignItems: 'center',
        justifyContent: 'center',
      },
      box({
        position: 'absolute',
        width: 340,
        height: 340,
        borderRadius: 170,
        border: `1px solid ${faint}`,
      }),
      box({
        position: 'absolute',
        width: 264,
        height: 264,
        borderRadius: 132,
        border: `1px solid ${faint}`,
      }),
      box({ position: 'absolute', width: 380, height: 1, background: faint }),
      box({ position: 'absolute', width: 1, height: 380, background: faint }),
      box({
        position: 'absolute',
        left: 52,
        top: 69,
        width: 160,
        height: 160,
        borderRadius: 80,
        border: `1px solid ${item.dark ? '#9dbb9e' : '#688674'}`,
        background: surface,
      }),
      box(
        {
          position: 'absolute',
          left: 144,
          top: 161,
          width: 160,
          height: 160,
          borderRadius: 80,
          background: mint,
          alignItems: 'center',
          justifyContent: 'center',
        },
        mark(91)
      ),
      box({
        position: 'absolute',
        top: 65,
        left: 292,
        width: 10,
        height: 10,
        background: item.dark ? mint : ink,
        borderRadius: 5,
      })
    )
  }
  return box(
    {
      position: 'relative',
      width: 380,
      height: 380,
      alignItems: 'center',
      justifyContent: 'center',
    },
    box({
      position: 'absolute',
      width: 378,
      height: 378,
      borderRadius: 189,
      border: `1px solid ${faint}`,
    }),
    box({
      position: 'absolute',
      width: 330,
      height: 330,
      borderRadius: 165,
      border: `1px solid ${faint}`,
    }),
    box(
      {
        width: 280,
        height: 280,
        borderRadius: 140,
        background: mint,
        alignItems: 'center',
        justifyContent: 'center',
      },
      mark(229)
    ),
    line({
      position: 'absolute',
      top: 189,
      left: -18,
      width: 48,
      background: item.dark ? mint : ink,
    }),
    line({
      position: 'absolute',
      top: 189,
      right: -18,
      width: 48,
      background: item.dark ? mint : ink,
    }),
    box({
      position: 'absolute',
      top: 5,
      width: 8,
      height: 8,
      borderRadius: 4,
      background: item.dark ? mint : ink,
    })
  )
}

function render(item, index) {
  const fg = item.dark ? paper : ink
  return box(
    {
      width: 1200,
      height: 630,
      background: item.dark ? '#10231e' : paper,
      color: fg,
      fontFamily: 'Inter',
      position: 'relative',
      overflow: 'hidden',
    },
    box({
      position: 'absolute',
      top: 0,
      right: 0,
      width: 450,
      height: 630,
      background: item.dark ? '#162c24' : '#e8ece2',
    }),
    box(
      {
        position: 'absolute',
        top: 46,
        left: 56,
        alignItems: 'center',
        gap: 14,
      },
      box(
        { background: mint, padding: '8px 7px', alignItems: 'center' },
        mark(32)
      ),
      label('AMWARE', { fontSize: 24, letterSpacing: 3 })
    ),
    label('DESIGNED TO BUILD ON.', {
      position: 'absolute',
      top: 63,
      right: 58,
      fontSize: 12,
      color: item.dark ? '#b5c8ba' : '#5c7165',
      letterSpacing: 1.7,
    }),
    box(
      {
        position: 'absolute',
        top: 163,
        left: 56,
        width: 680,
        flexDirection: 'column',
      },
      label(item.eyebrow, {
        color: item.dark ? mint : '#3d6352',
        fontSize: 13,
        letterSpacing: 1.6,
      }),
      box(
        { marginTop: 24, flexDirection: 'column' },
        item.lines.map((text, i) =>
          box(
            {
              fontSize: 67,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2.8,
              color:
                i === item.lines.length - 1
                  ? item.dark
                    ? mint
                    : '#46725b'
                  : fg,
            },
            text
          )
        )
      ),
      box(
        {
          marginTop: 25,
          fontSize: 19,
          color: item.dark ? '#b7c8be' : '#52665b',
          letterSpacing: -0.25,
        },
        item.subtitle
      )
    ),
    box(
      {
        position: 'absolute',
        top: item.variant === 'portrait' ? 125 : 145,
        right: item.variant === 'portrait' ? 50 : 37,
      },
      artwork(item)
    ),
    line({
      position: 'absolute',
      bottom: 75,
      left: 56,
      width: 1088,
      background: item.dark ? '#385045' : '#c9d2c5',
    }),
    label(`amware.dev${item.path === '/' ? '' : item.path}`, {
      position: 'absolute',
      bottom: 35,
      left: 56,
      fontSize: 13,
      letterSpacing: 0.6,
    }),
    label(`AM / ${String(index + 1).padStart(2, '0')}`, {
      position: 'absolute',
      bottom: 35,
      right: 58,
      fontSize: 12,
      letterSpacing: 2,
      color: item.dark ? '#adc5b5' : '#566d5e',
    })
  )
}

await fs.mkdir(output, { recursive: true })
await fs.mkdir(review, { recursive: true })
const report = []
for (const [index, item] of catalog.entries()) {
  const response = new ImageResponse(render(item, index), {
    width: 1200,
    height: 630,
    fonts,
  })
  const png = await sharp(Buffer.from(await response.arrayBuffer()))
    .png({ compressionLevel: 9 })
    .toBuffer()
  await fs.writeFile(path.join(output, `${item.key}.png`), png)
  report.push({
    key: item.key,
    path: item.path,
    width: 1200,
    height: 630,
    bytes: png.length,
  })
}
await fs.writeFile(
  path.join(review, 'asset-report.json'),
  JSON.stringify(report, null, 2) + '\n'
)

const thumbs = await Promise.all(
  catalog.map(async (item, i) => ({
    input: await sharp(path.join(output, `${item.key}.png`))
      .resize(480, 252)
      .png()
      .toBuffer(),
    left: (i % 3) * 504 + 24,
    top: Math.floor(i / 3) * 276 + 24,
  }))
)
await sharp({
  create: {
    width: 1536,
    height: Math.ceil(catalog.length / 3) * 276 + 24,
    channels: 3,
    background: '#d6dbd2',
  },
})
  .composite(thumbs)
  .png()
  .toFile(path.join(review, 'contact-sheet.png'))

const portraitThumbs = await Promise.all(
  ['home', 'about'].map(async (key, i) => ({
    input: await sharp(path.join(output, `${key}.png`))
      .resize(480, 252)
      .png()
      .toBuffer(),
    left: 16 + i * 496,
    top: 16,
  }))
)
await sharp({
  create: {
    width: 1008,
    height: 284,
    channels: 3,
    background: '#d6dbd2',
  },
})
  .composite(portraitThumbs)
  .png()
  .toFile(path.join(review, 'portrait-thumbnails.png'))

const escapeHtml = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
await fs.writeFile(
  path.join(review, 'index.html'),
  `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AMWare — Open Graph collection</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f3f1e9;color:#10231e;font:16px/1.6 system-ui,sans-serif}header{max-width:1500px;margin:auto;padding:60px 32px 30px}h1{font-size:clamp(32px,5vw,62px);line-height:1.05;letter-spacing:-2px;margin:16px 0}header p{max-width:690px;color:#52665b}main{max-width:1500px;margin:auto;padding:0 32px 64px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:38px 24px}figure{margin:0;min-width:0}img{display:block;width:100%;height:auto;border:1px solid #c9d2c5}figcaption{margin-top:10px;display:flex;justify-content:space-between;gap:16px;font-size:13px}a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #46725b;outline-offset:5px}small{color:#52665b}@media(max-width:740px){main{grid-template-columns:1fr;padding:0 20px 40px}header{padding:40px 20px 20px}}</style>
<header><small>AMWARE / BRAND COLLECTION / 1200 × 630</small><h1>Designed to be shared.</h1><p>Twenty-four social previews, one visual identity. The face behind AMWare on Home and About, with crown-led graphics, deliberate typography and a distinct illustration for every other page family. Select a cover to inspect the full-size PNG.</p></header>
<main>${catalog
    .map(
      (item) =>
        `<figure><a href="../../../public/images/og/amware/${
          item.key
        }.png"><img src="../../../public/images/og/amware/${
          item.key
        }.png" alt="${escapeHtml(
          item.title
        )}" width="1200" height="630" loading="lazy"></a><figcaption><span>${escapeHtml(
          item.path
        )}</span><small>${escapeHtml(item.key)}</small></figcaption></figure>`
    )
    .join('\n')}</main></html>`
)
console.log(`Generated ${report.length} AMWare previews and review gallery.`)
