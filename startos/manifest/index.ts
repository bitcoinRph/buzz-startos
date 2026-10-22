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
      // Build from the pinned Buzz submodule so StartOS can carry small relay
      // compatibility patches before they are available in the public image.
      // Official desktop-v0.5.28 snapshot, not a stable relay release.
      // scripts/prepare-source.sh applies the reviewed auth/checksum patch.
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
      source: { dockerBuild: { workdir: './storage/minio' } },
      arch: ['x86_64', 'aarch64'],
    },
    mc: {
      source: { dockerBuild: { workdir: './storage/mc' } },
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
