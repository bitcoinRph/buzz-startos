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
      // Build from the pinned Buzz submodule so StartOS can ship relay patches
      // before they are available in the public ghcr.io/block/buzz image.
      source: { dockerBuild: { workdir: './buzz' } },
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
