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
      // Track the current published relay (multi-arch amd64+arm64). The old
      // 0.1.1 tag predates the multi-tenant `communities` schema the mobile
      // app requires and pulled in Typesense/partition issues; `main` is the
      // current Postgres-FTS, mobile-compatible relay.
      source: { dockerTag: 'ghcr.io/block/buzz:main' },
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
