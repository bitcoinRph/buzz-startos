import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_20_0_a2 = VersionInfo.of({
  version: '0.5.20:1-alpha.2',
  releaseNotes: {
    en_US:
      'Repair the desktop-v0.5.20 StartOS relay image so brownfield pre-release databases normalize already-applied SQLx migration checksums before running remaining migrations. This preserves the latest upstream Buzz source while restoring startup for installs affected by migration checksum drift.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
