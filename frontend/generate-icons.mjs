// Run once: node generate-icons.mjs
// Generates icon-192.png, icon-512.png, apple-touch-icon.png from an inline SVG
// Requires: npm install sharp (dev only, not in package.json)

import sharp from 'sharp'
import { writeFileSync } from 'fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#c2692f"/>
  <text x="256" y="340" text-anchor="middle" font-size="280" font-family="serif">🍴</text>
</svg>`

const buf = Buffer.from(svg)

await sharp(buf).resize(192).png().toFile('public/icon-192.png')
await sharp(buf).resize(512).png().toFile('public/icon-512.png')
await sharp(buf).resize(180).png().toFile('public/apple-touch-icon.png')

console.log('Icons generated.')
