export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Buzz!': 0,
  Database: 1,
  'PostgreSQL is ready': 2,
  'PostgreSQL is not ready': 3,
  Cache: 4,
  'Redis is ready': 5,
  'Redis is not ready': 6,
  'Object Storage': 7,
  'MinIO is ready': 8,
  'MinIO is not ready': 9,
  Relay: 10,
  'The Buzz relay is ready': 11,
  'The Buzz relay is not ready': 12,

  // interfaces.ts
  'Web UI': 13,
  'The Buzz web interface (invite landing page and repository browser)': 14,
  'Relay API': 15,
  'WebSocket relay endpoint for Buzz desktop, mobile, and CLI clients': 16,

  // actions
  'Get Runtime Credentials': 17,
  'View the generated secrets used internally by Buzz (database, object storage, relay identity key)': 18,
  'Set Owner Pubkey': 19,
  'Register your Nostr pubkey as the relay owner. The owner is bootstrapped into the community with the owner role on startup.': 20,
  'Set Canonical Address': 21,
  'Choose which of this server’s addresses is the canonical one for Buzz clients. All data is bound to this host.': 22,
  'Changing the canonical address creates a fresh community on the new host. Existing channels and messages remain stored, but are only reachable via the previous address.': 23,

  // init
  'Register your Nostr pubkey as the relay owner so you can administer your Buzz community.': 24,

  // actions: membership / invites / members
  'Set Membership Mode': 25,
  'Choose whether your community is open (anyone can join) or closed (invite/admit only).': 26,
  'Closed mode only takes effect once an owner pubkey is set, and applies after the next restart. Make sure you can admit yourself (invite or Manage Members) before locking the relay down.': 27,
  'Create Mobile Invite': 28,
  'Mint an invite link to add this community to the Buzz mobile app. On a closed relay, claiming the invite also admits the device.': 29,
  'Manage Members': 30,
  'List, admit, or remove relay members. Adding a pubkey admits it to a closed community without an invite.': 31,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
