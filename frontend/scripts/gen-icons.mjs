/*
  Generate SatQuest home-screen icons from public/icon.svg.
  Produces PNGs at the sizes iOS and Android need for "Add to Home Screen".

  Run with:  npm run icons
*/
import sharp from 'sharp'
import fs    from 'node:fs/promises'
import path  from 'node:path'

const PUBLIC = path.resolve('public')
const SRC    = path.join(PUBLIC, 'icon.svg')

const TARGETS = [
  { file: 'icon-192.png',          size: 192 },
  { file: 'icon-512.png',          size: 512 },
  { file: 'icon-maskable-512.png', size: 512, padding: 0.10 },
  { file: 'apple-touch-icon.png',  size: 180 },
  { file: 'favicon-32.png',        size: 32  },
  { file: 'favicon-16.png',        size: 16  },
]

async function main() {
  const svg = await fs.readFile(SRC)

  for (const t of TARGETS) {
    const out = path.join(PUBLIC, t.file)

    if (t.padding) {
      // Maskable icon: render the art smaller inside a solid background
      // so Android safe-zone cropping never eats the logo.
      const inner = Math.round(t.size * (1 - t.padding * 2))
      const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer()

      await sharp({
        create: {
          width: t.size,
          height: t.size,
          channels: 4,
          background: '#B845FF', // brand purple as the safe-zone backdrop
        },
      })
        .composite([{ input: innerBuf, gravity: 'center' }])
        .png()
        .toFile(out)
    } else {
      await sharp(svg).resize(t.size, t.size).png().toFile(out)
    }

    console.log('✓ wrote', t.file, `(${t.size}x${t.size})`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
