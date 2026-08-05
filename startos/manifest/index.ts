import { setupManifest } from '@start9labs/start-sdk'
import { short, long, alertInstall } from './i18n'

export const manifest = setupManifest({
  id: 'buzz',
  title: 'Buzz',
  license: 'Apache-2.0',
  wrapperRepo: 'https://github.com/bitcoinRph/buzz-startos',
  upstreamRepo: 'https://github.com/block/buzz',
  supportSite: 'https://github.com/block/buzz/issues',
  marketingSite: 'https://github.com/block/buzz',
  donationUrl: null,
  docsUrl: 'https://github.com/block/buzz#readme',
  description: { short, long },
  volumes: ['main'],
  images: {
    buzz: {
      // Pin the Buzz 0.5.5 release relay by immutable per-commit tag
      // (multi-arch amd64+arm64 verified). GHCR publishes no semver image tag,
      // so we pin `sha-<shortsha>` of the 0.5.5 release commit (block/buzz
      // 8342dfc, tag desktop-v0.5.5) rather than the moving `main`. 0.5.5 ships
      // migrations 0001–0027 — a superset of any earlier main-based install, so
      // BUZZ_AUTO_MIGRATE upgrades forward in place (no fresh DB needed unless
      // coming from the pre-1321 0.1.1 image). It also carries the mobile
      // wss-scheme fix (RelayConfig canonicalization, v0.5.2+) so invite links
      // work in the iOS app.
      source: { dockerTag: 'ghcr.io/block/buzz:sha-8342dfc' },
      arch: ['x86_64', 'aarch64'],
    },
    postgres: {
      source: { dockerTag: 'postgres:17-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
    redis: {
      source: { dockerTag: 'redis:7-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
    minio: {
      source: { dockerTag: 'minio/minio:RELEASE.2025-09-07T16-13-09Z' },
      arch: ['x86_64', 'aarch64'],
    },
    mc: {
      source: { dockerTag: 'minio/mc:RELEASE.2025-08-13T08-35-41Z' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: alertInstall,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
