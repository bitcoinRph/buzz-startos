import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_23_0 = VersionInfo.of({
  version: '0.5.23:0',
  releaseNotes: {
    en_US:
      'Update the packaged Buzz relay to upstream desktop-v0.5.23. Carries the ' +
      'two StartOS relay patches forward unchanged: NIP-42 ws/wss scheme ' +
      'tolerance for the same relay authority (keeps the Buzz iOS app able to ' +
      'authenticate behind StartOS TLS termination) and the allowlisted ' +
      'migration-5 checksum repair for brownfield pre-release databases. ' +
      'Upstream adds twelve new database migrations, applied forward in place ' +
      'on startup; no reset is required.',
  },
  migrations: {
    // Buzz applies its own SQLx migrations forward on startup
    // (BUZZ_AUTO_MIGRATE=true), so StartOS has no schema step of its own.
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
