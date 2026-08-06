import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_1_1_0_a0 = VersionInfo.of({
  version: '0.5.5:2',
  releaseNotes: {
    en_US:
      'Builds Buzz from a patched relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host.',
    es_ES:
      'Builds Buzz from a patched relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host.',
    de_DE:
      'Builds Buzz from a patched relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host.',
    pl_PL:
      'Builds Buzz from a patched relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host.',
    fr_FR:
      'Builds Buzz from a patched relay source so iOS clients can authenticate through StartOS TLS host bindings when they sign NIP-42 with ws:// for the same wss:// relay host.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
