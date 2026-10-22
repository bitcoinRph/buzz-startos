# Security backport provenance (candidate; independent QA required)

Base: official block/buzz `desktop-v0.5.28`,
`f87c10895ea35a9a2cea629fef1d7532a3fecbc5`. Package remains `0.5.28:0`, a
snapshot, not a fabricated stable relay tag. The official gitlink is unchanged;
all local application changes are represented by `startos-relay.patch`.

## Included upstream fixes

- `40c1c474e74686cbd3218866ee926211cb3365db`: author-only deletion privacy on
  read/count/live/admin surfaces and ingest anti-oracles. Includes upstream E2E
  and PostgreSQL regressions. Only adaptations: omit unrelated Justfile runner
  hunk and adjust `handlers/event.rs` imports to retain the base's available
  kinds; use the identical upstream classifier at fan-out. An extra real
  `event_visible_to_reader` boundary regression covers foreign/author/public
  controls and COUNT selection. It failed on the base before the fix.
- `b3795236ccde4cefaebfd3da06ce4c838b76e78a`: existence-oracle fix, applied
  unchanged after the deletion fix, including both upstream E2E and DB tests.
  Scoped-token reaction and report tests failed on the vulnerable code, then
  passed with this fix, using disposable PostgreSQL and production ingest.
- `67c4fe5e17c5e7b25bf6f5ddbe0b4aeeb0531c2f`: root lockfile rustls
  `0.23.45 -> 0.23.46` (RUSTSEC-2026-0346/0347).
- `8bbfe44f771a092223947440040b7aa4ce256d34`: root lockfile rustls-webpki
  `0.103.15 -> 0.103.16`, webpki-roots and webpki-root-certs
  `1.0.7 -> 1.0.10` (RUSTSEC-2026-0381/0382/0383). Preserve roots 0.26.11
  re-export shim; its dependency points to patched 1.0.10. Do not add an audit
  ignore. Omit upstream's unrelated `syn` edge change. All crate dependency
  lists and checksums verified against those exact commits.
- `bc995041cdd0a6c68c1b8a988f4e73596b3a92f9`: root lockfile negentropy
  `0.5.0 -> 0.5.2` (RUSTSEC-2026-0365), although neither relay nor CLI's
  selected Linux dependency tree contains it. No relay exploit claim.

Desktop's separate lockfile is not shipped by the wrapper's relay Docker build
and is intentionally unchanged. Existing StartOS auth/checksum/mobile changes
remain intact. No migration file changes: 57 migrations, not main's 67.

## Explicit residual holds

- NOT full main parity. Official main observed at
  `347ce88d5dd8bc631c073f1947fea6b75d5a43c0`.
- `2f2f6e2774fb0899d2a927f5e5b1987603765f31` bounded statements/mention
  scans is NOT applied. Direct applicability fails in six source/config paths;
  its parent includes changed tag-query planning, push enqueue infrastructure,
  admitted fleet sweep/deletion behavior and audit handling. This fix adds no
  migrations itself, so no claim that ten migrations are inherently required.
  A separate bounded manual port must preserve cancellation no-writer-fallback,
  transaction-local tenant-deletion exemptions, migration exemption and audit
  retries. Do not apply only a blanket timeout or silently retarget main.
- `5b907b838a44d7985e98836177aec2903717381f` push isolation/rollback work is
  absent and has schema/worker prerequisites. No push security-completeness claim.
- Fresh cargo-audit 0.22.2, RustSec DB
  `4b587f00996ebe5c05a73eaef105ef241e876414` (2026-10-21), reports 12 workspace
  vulnerability entries plus warnings. Two entries are confirmed in relay's
  actual selected dependency tree: quick-xml 0.38.4 RUSTSEC-2026-0194/0195,
  via buzz-media/rust-s3/aws-creds. Patched >=0.41 is outside declared 0.38
  ranges; official main still has the same version. No safe proven upstream
  lock-only backport was found. Requires focused dependency/API review or an
  explicit documented risk decision, not a clean-audit claim. Root-certs and
  negentropy are lock hygiene, not established selected relay dependencies.
- Native S3 tests cover anonymous GET/HEAD/list/PUT denial, bad access key and
  bad signature, authenticated byte-preserving reads/restart, and a deliberate
  public-policy positive control followed by restored private-policy denial.
  Run `python3 tests/native-storage-security.py /path/to/minio /path/to/mc` with
  TMPDIR pointing to disposable scratch. No container/ARM/StartOS claim.
- Storage images now include pinned-source notices and mc's missing AGPL license.
  This is NOT legal compliance approval: equivalent corresponding-source access,
  required dependency/build/install source and durable distributor hosting remain
  a release prerequisite. Neither image nor source was published by this work.

## Required before publishing this delta

Independent QA of the exact patch, license/image additions and native test.
Do not reuse approval of an earlier patch hash. CI package build success on an
older head does not attest these backports; package artifact inspection is still
required. Account artifact-upload quota needs an owner decision before another
CI artifact attempt. No blind reruns, artifact deletion, billing or publishing
workflow changes are part of this security patch. Backup/live install hold stays.
