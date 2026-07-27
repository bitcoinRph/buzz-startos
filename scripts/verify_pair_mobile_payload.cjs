#!/usr/bin/env node
const fs = require('fs')
const pair = fs.readFileSync('startos/actions/pairDevice.ts', 'utf8')
const utils = fs.readFileSync('startos/utils.ts', 'utf8')
const manifest = fs.readFileSync('startos/manifest/index.ts', 'utf8')
const main = fs.readFileSync('startos/main.ts', 'utf8')
const failures = []
function must(cond, msg) { if (!cond) failures.push(msg) }

must(pair.includes("JSON.stringify({ relayUrl: origin, nsec, pubkey })"), 'pair action must emit relayUrl/nsec/pubkey JSON payload')
must(pair.includes("const code = `buzz://${payload}`"), 'pair action must emit buzz:// base64url code')
must(pair.includes('mobileInviteOriginError(origin)'), 'pair action must reject mobile-invalid origins')
must(pair.includes('add-member'), 'pair action must admit generated pubkey on closed relay')
must(pair.includes('RELAY_URL: toWebsocketUrl(origin)'), 'buzz-admin admission must use relay websocket URL')
must(pair.includes('pgPassword'), 'pair action must use postgres password from store')
must(!pair.includes('postgres://${dbUser}:***@'), 'pair action must not contain redacted placeholder in DATABASE_URL source')
must(utils.includes('export function mobileInviteOriginError(origin: string): string | null'), 'utils must define mobileInviteOriginError')
must(utils.includes("url.protocol !== 'https:'"), 'mobile guard must reject non-HTTPS in release-compatible pairing')
must(utils.includes('isPrivateIpv4(host)'), 'mobile guard must reject private numeric IPv4')
must(manifest.includes("source: { dockerBuild: { workdir: './buzz' } }"), 'manifest must keep pinned source build, not PR #3 ghcr main image')
must(!manifest.includes("ghcr.io/block/buzz:main"), 'manifest must not use migration-incompatible ghcr main image')
must(main.includes("BUZZ_AUTO_MIGRATE: 'true'"), 'main must keep auto-migrate enabled')
if (failures.length) {
  console.error(failures.map((f, i) => `${i + 1}. ${f}`).join('\n'))
  process.exit(1)
}
console.log('pair-mobile payload/source checks passed')
