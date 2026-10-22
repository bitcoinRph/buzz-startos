# Buzz for StartOS

[Buzz](https://github.com/block/buzz) is a communications platform built on the
Nostr protocol (NIP-29 groups): realtime team chat, threads, DMs, media
sharing, git repository hosting, and an agent harness that lets AI agents
participate in your channels.

This repository packages Buzz for [StartOS](https://start9.com). The package
bundles everything the relay needs in a single service:

| Component | Image | Purpose |
|-----------|-------|---------|
| Buzz relay | `ghcr.io/block/buzz` | WebSocket relay, REST bridge, web UI, git hosting |
| PostgreSQL 17 | `postgres:17-alpine` | Event store, full-text search, audit log |
| Redis 7 | `redis:7-alpine` | Pub/sub fan-out, presence, rate limits |
| MinIO | `minio/minio` | Blossom/S3 media storage |
| MinIO client | `minio/mc` | One-shot media bucket bootstrap |

## How it works

- All five containers run inside one StartOS service and communicate over
  localhost. Persistent state lives on the service's `main` volume
  (`postgres/`, `redis/`, `minio/` subdirectories) and is included in StartOS
  backups.
- Secrets (PostgreSQL password, MinIO credentials, relay signing key, git hook
  HMAC secret) are generated once at install time. View them with the
  **Get Runtime Credentials** action.
- Buzz resolves the community (tenant) from the connection host and the relay
  seeds exactly one community for the host in `RELAY_URL`. The package
  auto-selects a canonical address (clearnet domain > LAN `.local` > Tor
  `.onion`) and you can override it with the **Set Canonical Address** action.
  Clients must connect via the canonical address.
- Run the **Set Owner Pubkey** action with your Nostr pubkey (64-char hex) to
  be bootstrapped as the community owner on the next restart.

## Connecting clients

Point the Buzz desktop, mobile, or CLI client at the canonical address, e.g.
`wss://adjective-noun.local` on your LAN (requires trusting your server's Root
CA) or the service's Tor address (`ws://<onion>.onion`).

## Building

Requires Docker, Node.js 22, `make`, and
[`start-cli`](https://docs.start9.com/latest/developer-guide/sdk/installing-the-sdk).

```bash
git clone --recurse-submodules https://github.com/bitcoinRph/buzz-startos.git
cd buzz-startos
npm ci
start-cli s9pk init-workspace ..
make            # builds buzz_x86_64.s9pk and buzz_aarch64.s9pk
```

Or trigger the **Package** GitHub Actions workflow, which builds the `.s9pk`
on every push.

## Installing

Sideload the `.s9pk` via **System > Sideload a Service** in your StartOS UI,
or run `make install` with `host: http://server-name.local` configured in
`~/.startos/config.yaml`.

> **Upgrading from an early build?** If you previously installed a build that
> ran the `ghcr.io/block/buzz:0.1.1` image, its database is an incompatible
> pre-multi-tenant schema and the current relay cannot migrate it in place —
> you must start the database fresh. **Uninstall** the old service first, then
> sideload this package. See [docs/RESET.md](docs/RESET.md).

## Known limitations

- Only one hostname works at a time (host-derived community boundary — see
  above). Pick LAN, Tor, or a clearnet domain and stick with it.
- Huddle (voice) audio works within the single relay instance.
- Push notifications default to the public Buzz APNs gateway.
