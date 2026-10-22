# Buzz

Buzz is a self-hosted team chat and agent collaboration platform built on the
Nostr protocol (NIP-29 groups). This package runs the Buzz relay together with
its PostgreSQL database, Redis, and MinIO media storage — everything in one
service.

## First-time setup

1. **Start the service.** On first startup the relay initializes its database
   and creates your community, bound to the service's canonical address.

2. **Claim ownership.** Run the **Set Owner Pubkey** action and enter your
   Nostr public key in 64-character hex format (not `npub`). Then restart the
   service. On startup, your pubkey is bootstrapped as the community owner.

   You can find your hex pubkey in the Buzz desktop app under
   Settings > Identity, or convert an `npub` with any Nostr key tool.

3. **Connect a client.** Point the Buzz desktop, mobile, or CLI client at the
   canonical address shown in this service's interface list, for example:

   - LAN: `wss://<your-server>.local` — requires your server's Root CA to be
     trusted on the client device (see StartOS docs on "Trust Your Root CA")
   - Tor: `ws://<address>.onion` — requires a Tor-enabled client

## The canonical address

Buzz binds all data (channels, messages, memberships) to a single hostname —
the "community host". The package automatically selects one of your server's
addresses in this order: clearnet domain, LAN `.local`, Tor `.onion`.

To use a different address, run the **Set Canonical Address** action.

**Important:** clients can only connect via the canonical address. Changing it
later creates a fresh, empty community on the new host — existing data remains
stored but is only reachable if you switch back to the previous address.

## Credentials

The **Get Runtime Credentials** action displays the secrets generated at
install time: the PostgreSQL password, MinIO (media storage) credentials, and
the relay's signing key. These are used internally — you normally never need
them, but they are available for advanced debugging or data export.

## Backups

All persistent data (database, media, settings) lives on this service's data
volume and is included in standard StartOS backups.

Before upgrading from the desktop-v0.5.20-based package, make and verify a
recovery backup. This alpha-quality desktop-v0.5.28 relay snapshot applies
database migrations 33–57 forward on startup; it is not a stable relay release.
Do not downgrade the migrated database or reset it as an upgrade shortcut.
Keep the canonical hostname unchanged. The carried legacy migration-5 repair
recognizes only one known checksum; unknown drift fails closed and needs
operator investigation, not automatic rewriting.
