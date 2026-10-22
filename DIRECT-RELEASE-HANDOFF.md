# Direct draft-release delivery — code review handoff

## Status and scope

Local implementation only, based on wrapper HEAD `72349b0e9ff33327ac6a73f2d11d488455cdbb17`, branch `review/buzz-0.5.28-consolidated`, draft PR #14. No commit, push, merge, dispatch, remote release, registry write, signing credential access, or actual new native package was performed by this change. Independent release-delta QA is still required before the parent combines/pushes it with the separately approved security delta.

Release/install remains **HOLD**: quick-xml shipped advisories, missing bounded-read fixes, source-compliance obligations, and incomplete StartOS E2E remain blockers. Actions artifact quota is bypassed by this delivery path; that is not security clearance. Package version stays `0.5.28:0`; a validation RC label does not change the package's internal version or make the desktop-tagged source stable.

## Exact delta allowlist

Only these six paths belong to this delivery delta after the bounded QA fix (the nine approved security paths remain separate and unchanged):

1. `.github/workflows/buildService.yml`
2. `.github/workflows/releaseService.yml`
3. `scripts/direct-release.py`
4. `tests/direct-release.test.py`
5. `DIRECT-RELEASE-HANDOFF.md` (this review handoff, not self-hashed)
6. `tests/build-workflow-signing.test.mjs` (legacy contracts adapted to the authorized architecture, including executable trust/SHA truth tables)

Executable/config payload hashes (SHA-256; the handoff's own hash must be recorded externally by QA):

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `.github/workflows/buildService.yml` | 4370 | `6faf16f72ec93cea6f9041af604d9e5098276a650698c3ca457d15e4a50a2b6a` |
| `.github/workflows/releaseService.yml` | 625 | `539bafcfdae87d2b64b3f07d6d932180e0e401e2ca94ee766aadf1962a7af8fe` |
| `scripts/direct-release.py` | 6239 | `6cf448fe60ad127880ef93877b61df4daacab13171536c04c7401af8ad4c6ae0` |
| `tests/direct-release.test.py` | 9818 | `5a9119486520d1a23a6850c59f73e7979ed661eb3ac23641e61c673416efaf4a` |
| `tests/build-workflow-signing.test.mjs` | 10839 | `4ba9083aa4cd4026069b7d7516a57f2aa7442f14b623aafe55cb4e127c92ce12` |

All nine existing security delta files still exactly match `approved-path-hashes.json`, verified with Python SHA-256 comparison. No edits to UPDATING.md, source patch, submodule, locks, storage Dockerfiles, notices, or security tests. Existing security approval does not approve these separate workflow/helper paths. `direct-release-fix-path-hashes.json` records all 15 combined payload paths (original 14 plus the legacy regression test), including this handoff's external hash. It is a review candidate manifest, not approval to stage or push. `DIRECT-RELEASE-FIX.md` and its logs are excluded review evidence.

## Delivery contract

- Package runs on same-repository PR heads, main pushes, and manual branch dispatches; forks and Dependabot PR execution are excluded by both actor and PR-author identity (including human reopen events). Same-repository human-authored draft PRs remain allowed. No `pull_request_target` or untrusted fork checkout. Same-repository contributors are the explicit trust boundary. The one package job has `contents: write`, all other permissions default to none; checkout credentials are not persisted. Only the final upload step receives the runner token. No stored signing/registry secrets are referenced.
- Checkout builds the exact PR head, not GitHub's synthetic PR merge SHA. Dispatch requires `expected_sha` matching the selected ref's checked-out full SHA; helper rechecks `git rev-parse HEAD` against that SHA before API calls.
- Existing pinned Start CLI, Node 22, SDK lockfile, recursive submodule, Docker Buildx OCI builder, `start-cli init-key`, `start-cli s9pk init-workspace ..`, and native `make x86_64` semantics are retained. RC packages use an ephemeral developer key, not the protected production signing identity.
- Immediately after the native build, the **same runner** posts `buzz_x86_64.s9pk`, its SHA-256 sidecar, and `provenance.json` directly to GitHub Release asset storage. No upload/download-artifact action, Actions artifact handoff, or shared release workflow remains. Npm dependency cache is unchanged and is not package artifact storage.
- Each execution creates a new `rc-<full-commit-sha>-<run-id>-<run-attempt>` draft, explicitly `draft: true`, `prerelease: true`, `make_latest: "false"`, target full SHA. No rolling `dev-build` tag is touched. Drafts are visible through authenticated release APIs to users with push access, not stable/public release pollers. They must not be manually promoted to stable.
- Draft discovery uses paginated authenticated release listing, not `/releases/tags/...` as a draft lookup. Upload and readback use the numeric ID returned by create. Drafts may not yet have a Git tag, so provenance is the exact `target_commitish`, body and provenance asset. No claim of a published tag is made.
- Existing release identity or tag causes failure, never clobber/reuse/delete. New workflow attempts use new identities. Interrupted/failed uploads leave a partial draft for inspection, not a success; no automated cleanup or deletion. After upload, exact-ID readback verifies draft/prerelease, commit target, exact three asset names/count, uploaded state, byte sizes and server SHA-256 digests. Missing digests fail closed.
- Missing, symlinked, empty or >=2-GiB packages fail before any API request. Each asset must be **under** 2 GiB. No package was fabricated: offline tests explicitly use non-installable fixture bytes.

## Verification performed

Bounded QA blocker follow-up: real root `npm test` reproduced 2 pass / 4 fail; the updated legacy suite first reproduced the human-reopened Dependabot defect (5 pass / 1 fail), then passed 6/6 after the guard fix. Fresh root `npm test` (including actual build), all 16 direct-release contracts, TypeScript check, actionlint, and scoped whitespace checks pass. No skipped tests. The existing upstream `punycode` deprecation warning remains visible, not suppressed. See `DIRECT-RELEASE-FIX.md` for exact commands/log hashes. Independent re-review is still required; the earlier `DIRECT-RELEASE-QA.md` FAIL remains historical, not silently overwritten.

```sh
python3 tests/direct-release.test.py
# Ran 16 tests ... OK

actionlint .github/workflows/buildService.yml .github/workflows/releaseService.yml
# exit 0, no diagnostics

git diff --check -- .github/workflows/buildService.yml .github/workflows/releaseService.yml
# exit 0
```

The first test run failed with 11 expected failures before implementation (missing helper and artifact-based workflow); the implemented suite passes. Contracts cover same-runner/no-Actions-artifact path, trust boundary, missing/empty/symlink/oversized package, invalid and mismatched SHA, package hash/provenance, explicit draft/nonlatest flags, numeric-ID uploads and readback, existing release/tag refusal, paginated draft lookup, upload transport/file input, 404 versus permission errors, and remote missing/mismatched hashes or commit target.

No native build, live upload, download roundtrip or StartOS E2E is claimed by these offline contracts. Full-repository `git diff --check` reports pre-existing whitespace in the security patch's diff payload; the workflow-scoped check passes and that independently approved file was not changed. Editor generic YAML schema diagnostics target an unrelated cfgd schema; actual GitHub Actions `actionlint` passed.

## Parent action after independent QA and one approved combined push

Do not merge PR #14. Use the normal new PR `synchronize` run if it builds this exact head; avoid needlessly building twice. If an explicit dispatch is needed after the final reviewed head is pushed:

```sh
# Use the parent's already-verified GitHub CLI access; do not read/copy credentials.
SHA="$(git rev-parse HEAD)"
test "$(git branch --show-current)" = review/buzz-0.5.28-consolidated
gh workflow run buildService.yml --repo bitcoinRph/buzz-startos \
  --ref review/buzz-0.5.28-consolidated -f expected_sha="$SHA"
```

Bind subsequent run monitoring to the exact pushed SHA and workflow/event. For PR events, Actions' run `head_sha` can be the synthetic merge identity: additionally verify checkout `HEAD_SHA`, provenance commit, and release target all equal the PR's reviewed head. For manual dispatch, run `head_sha` must equal `$SHA`. Capture run ID/attempt and emitted numeric release ID. Read `/repos/bitcoinRph/buzz-startos/releases/<ID>` with authenticated access, verify draft flags/target and asset digests, then download assets by their IDs (`Accept: application/octet-stream`) and check the sidecar and provenance offline. Do not use latest/tag lookup to prove a draft exists. No current release ID or binary is available from this local task.

## Future approved stable-release path (not enabled)

`releaseService.yml` deliberately has only manual dispatch and an unconditional failing security gate. No tag-triggered shared workflow, registry credentials, signing secret or stable publishing executes while known blockers remain. Auto-stable is not enabled by merging this work.

A later separately reviewed update must first close every blocker (shipped dependency advisory assessment/fixes, bounded reads, complete corresponding-source/license delivery, native checks and StartOS install/upgrade/E2E). Then bind explicit release approval to the reviewed post-merge main SHA and unique package version, restore protected production signing on a native same-runner build, create a **new versioned** release targeting that SHA, upload/verify direct release assets with no clobber, and publish only after protected approval. Never convert an ephemeral-key validation draft or overwrite an earlier version/rolling dev tag. Registry delivery and stable poller changes require their own approval.

## References checked

- Start9 packaging: https://docs.start9.com/packaging/0.4.0.x/
- Start9 environment/workspace/native OCI prerequisites: https://docs.start9.com/packaging/0.4.0.x/environment-setup.html
- GitHub release quota: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases#storage-and-bandwidth-quotas — under 2 GiB per asset, up to 1000 assets; no total release-size/bandwidth limit stated. This is distinct from Actions artifact quota.
- GitHub authenticated draft listing and exact-ID release API: https://docs.github.com/en/rest/releases/releases
