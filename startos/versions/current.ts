import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.5.28:0',
  releaseNotes: {
    en_US:
      'Build the relay from official desktop-v0.5.28 source, an alpha desktop-tagged snapshot rather than a stable relay release. Preserve same-authority NIP-42 ws/wss compatibility and the exact allowlisted legacy migration-5 checksum repair. Apply SQLx migrations 33–57 forward in place; take a verified recovery backup first. Replace unavailable storage image tags with the official MinIO security-release source build and checksum-verified mc release binaries.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
