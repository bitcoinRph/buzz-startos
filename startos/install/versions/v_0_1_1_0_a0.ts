import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_1_1_0_a0 = VersionInfo.of({
  version: '0.5.5:3',
  releaseNotes: {
    en_US:
      'Builds Buzz from a patched current relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host, while preserving StartOS pre-release migration compatibility.',
    es_ES:
      'Builds Buzz from a patched current relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host, while preserving StartOS pre-release migration compatibility.',
    de_DE:
      'Builds Buzz from a patched current relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host, while preserving StartOS pre-release migration compatibility.',
    pl_PL:
      'Builds Buzz from a patched current relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host, while preserving StartOS pre-release migration compatibility.',
    fr_FR:
      'Builds Buzz from a patched current relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host, while preserving StartOS pre-release migration compatibility.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
