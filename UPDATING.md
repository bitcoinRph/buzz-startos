# Updating Buzz

## Source channel and version

The wrapper already followed desktop-tagged source snapshots, not stable relay
images. This update targets official `block/buzz` `desktop-v0.5.28`, commit
`f87c10895ea35a9a2cea629fef1d7532a3fecbc5`. The relay crate independently says
0.2.1. Do not describe desktop 0.5.28 as a stable relay release.

Package `0.5.28:0` retains the complete selected upstream tag version and integer
wrapper revision, per official ExVer docs. Its alpha/snapshot quality is explicit
in release notes and README rather than inventing an upstream alpha tag or using
a downstream prerelease suffix. Current metadata is `startos/versions/current.ts`;
legacy graph import remains for compatibility with pinned SDK beta.48. There are
no historical graph nodes because all previous wrapper migrations are empty.
The SDK package does not ship s9pk.mk, so the existing vendored make include stays.

Submodule provenance now points directly to official block/buzz. `npm run build`
and `make ingredients` run `scripts/prepare-source.sh`, which refuses another
source SHA and idempotently applies `patches/startos-relay.patch`. Keep the patch
and source-pin regression synchronized. Do not commit the prepared submodule's
working-tree changes as an unpublished gitlink. Only the official gitlink is used.

## Carried compatibility

- Same-authority ws/wss NIP-42 alias acceptance for affected installed mobile
  clients; host, port, path and query negatives remain strict.
- Allowlisted legacy successful migration-5 checksum repair, within upstream's
  exclusive schema lock. Unknown checksums remain SQLx failures.
- All SQL migrations 1–32 are byte-preserved, including 29–32. New target has 57.
- Preserve canonical host, private key, owner, membership mode, volumes, S3
  credentials, ports, health and initialization contracts. No reset or downgrade.

Storage uses official MinIO source security release 2025-10-15 (exact commit
9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a) and checksum-verified official mc
2025-08-13 binaries because the old Docker Hub pins return 404. These are not
unofficial mirrors. Both components are AGPLv3: distribution must preserve license
and corresponding-source obligations. Independently review the security update.

## Validation and release gates

Run `npm ci`, `npm test`, `npm run check`, Rust auth/DB regression tests, then
`make x86_64` / `make aarch64` inside an initialized packaging workspace. CI Package
runs these checks and produces x86_64 validation artifact plus checksum on PRs.
The unchanged legacy tag-release workflow is a separate publication path: do not
push version tags until it receives independent workflow review. Existing main
publication uses immutable dev-build-<commit> tags, not formal ExVer release tags.

Require independent code/workflow/storage QA before publishing a replacement PR.
PR 13's desktop0.5.23 update and repair tests are superseded; PR5's auth repair is
preserved. Do not close either without the reviewed replacement PR link.

Before installation: CI image/package success, artifact checksum/provenance,
backup verification, populated database update, real iOS pairing/auth/reconnect,
media/git, health, and persistence checks. Local native tests do not prove
StartOS lifecycle, backups or ARM runtime. Live sideload stays on hold.

## Post-tag divergence

Official main at review: 347ce88d5dd8bc631c073f1947fea6b75d5a43c0, 67 migrations.
It is NOT packaged here. Main contains post-tag private-event deletion metadata
and existence-oracle fixes, dependency advisory updates, bounded reads, push
post-commit work, and a pgschema runtime-partition preservation fix. The wrapper
uses SQLx, not pgschema; do not claim latest-tagged means every main fix is present.
Adopting main or backporting those changes is a separate parent target decision,
not an unreviewed source-channel switch.
