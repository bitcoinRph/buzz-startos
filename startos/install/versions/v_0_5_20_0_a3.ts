import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_20_0_a3 = VersionInfo.of({
  version: '0.5.20:1-alpha.3',
  releaseNotes: {
    en_US:
      'Restrict the StartOS desktop-v0.5.20 SQLx repair to the single known legacy migration-5 checksum. Unknown migration drift remains untouched so SQLx fails closed. This preserves current Buzz iOS compatibility without weakening exact NIP-42 relay URL validation.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
