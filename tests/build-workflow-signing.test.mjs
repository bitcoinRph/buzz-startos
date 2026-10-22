import assert from 'node:assert/strict'
import { execFile as execFileCallback } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import test from 'node:test'

const execFile = promisify(execFileCallback)
const require = createRequire(import.meta.url)
const workflowPath = new URL(
  '../.github/workflows/buildService.yml',
  import.meta.url,
)
const versionsPath = new URL(
  '../startos/install/versions/index.ts',
  import.meta.url,
)

async function workflow() {
  return readFile(workflowPath, 'utf8')
}

test('untrusted builds are read-only and cannot access the stable signing key', async () => {
  const yaml = await workflow()
  const packageJob = yaml.match(/\n  package:[\s\S]*?(?=\n  publish:)/)?.[0]
  assert.ok(packageJob, 'read-only package job is missing')
  assert.match(packageJob, /permissions:\n\s+contents: read/)
  assert.doesNotMatch(packageJob, /secrets\.BUILD_KEY/)
  assert.doesNotMatch(packageJob, /gh release/)
  assert.match(
    packageJob,
    /cargo test -p buzz-auth ws_and_wss --lib[\s\S]*cargo test -p buzz-db startos_checksum_repair_allowlist_is_exact --lib/,
  )

  const checkoutSteps = [
    ...yaml.matchAll(
      /uses: actions\/checkout@[^\n]+[\s\S]*?(?=\n\s{6}- name:|\n\s{4}[a-z])/g,
    ),
  ]
  assert.ok(
    checkoutSteps.length >= 2,
    'expected checkout in validation and publish jobs',
  )
  for (const [checkout] of checkoutSteps) {
    assert.match(checkout, /persist-credentials: false/)
  }

  const thirdPartyActions = [...yaml.matchAll(/uses: ([^\s]+)@([^\s]+)/g)]
  assert.ok(thirdPartyActions.length >= 5)
  for (const [, action, revision] of thirdPartyActions) {
    assert.match(
      revision,
      /^[0-9a-f]{40}$/,
      `${action} must be pinned to a commit SHA`,
    )
  }
})

test('stable signing and release publishing are isolated to protected main pushes', async () => {
  const yaml = await workflow()
  const publishJob = yaml.match(/\n  publish:[\s\S]*/)?.[0]
  assert.ok(publishJob, 'trusted publish job is missing')
  assert.match(
    publishJob,
    /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  )
  assert.match(publishJob, /environment: package-signing/)
  assert.match(publishJob, /permissions:\n\s+contents: write/)
  assert.match(publishJob, /BUILD_KEY: \$\{\{ secrets\.BUILD_KEY \}\}/)
  assert.match(publishJob, /umask 077/)
  assert.match(
    publishJob,
    /if: always\(\)[\s\S]*rm -f \.\.\/\.startos\/build\.key\.pem/,
  )
  assert.doesNotMatch(publishJob, /gh release delete|gh release edit|--clobber/)
  assert.match(publishJob, /tag="dev-build-\$\{HEAD_SHA\}"/)
  assert.match(publishJob, /gh release create "\$tag"/)
  assert.match(
    publishJob,
    /release_json="\$\(gh api "repos\/\$GITHUB_REPOSITORY\/releases\/tags\/\$tag"\)"/,
  )
  assert.match(publishJob, /remote_digest=.*\.digest/)
  assert.match(publishJob, /remote_size=.*\.size/)
  assert.match(
    publishJob,
    /remote_tag_sha="\$\(gh api "repos\/\$GITHUB_REPOSITORY\/git\/ref\/tags\/\$tag" --jq \.object\.sha\)"/,
  )
  assert.match(publishJob, /test "\$remote_digest" = "sha256:\$package_sha"/)
  assert.match(publishJob, /test "\$remote_size" = "\$package_size"/)
  assert.match(publishJob, /test "\$remote_tag_sha" = "\$HEAD_SHA"/)
  assert.match(publishJob, /--pattern "\$checksum_asset"/)
  assert.match(
    publishJob,
    /cmp -s "\$checksum_asset" "\$existing_dir\/\$checksum_asset"/,
  )
  assert.match(publishJob, /remote_checksum_digest/)
  assert.match(publishJob, /remote_checksum_size/)
  assert.match(yaml, /cancel-in-progress: false/)
})

test('validation reclaims ephemeral runner disk before relay regression tests', async () => {
  const yaml = await workflow()
  const packageJob = yaml.match(/\n  package:[\s\S]*?(?=\n  publish:)/)?.[0]
  assert.ok(packageJob, 'read-only package job is missing')

  const cleanup = packageJob.indexOf('Reclaim runner disk space')
  const rustTests = packageJob.indexOf(
    'cargo test -p buzz-auth ws_and_wss --lib',
  )
  assert.ok(cleanup >= 0, 'runner disk cleanup step is missing')
  assert.ok(
    cleanup < rustTests,
    'runner disk cleanup must run before relay regression tests',
  )
  assert.match(
    packageJob,
    /sudo rm -rf \/usr\/share\/dotnet \/usr\/local\/lib\/android \/opt\/ghc \/usr\/local\/share\/boost/,
  )
  assert.match(packageJob, /CARGO_INCREMENTAL: '0'/)
  assert.match(packageJob, /CARGO_PROFILE_TEST_DEBUG: '0'/)
})

test('Start CLI is pinned and checksum-verified before execution', async () => {
  const yaml = await workflow()
  const url =
    'https://github.com/Start9Labs/start-technologies/releases/download/start-cli/v1.1.0/start-cli_x86_64-linux'
  assert.equal(yaml.split(url).length - 1, 2)
  assert.equal(
    yaml.split(
      '70eff67b6e9a936acd8aaaf787b783819252ecedaa5c74d462e3b15ed4dd843a',
    ).length - 1,
    2,
  )
  assert.equal(yaml.match(/sha256sum -c -/g)?.length, 2)
  assert.doesNotMatch(
    yaml,
    /api\.github\.com\/repos\/Start9Labs\/start-technologies\/releases/,
  )

  for (const job of [
    yaml.match(/\n  package:[\s\S]*?(?=\n  publish:)/)?.[0],
    yaml.match(/\n  publish:[\s\S]*/)?.[0],
  ]) {
    assert.ok(job)
    const verification = job.indexOf('sha256sum -c -')
    const execution = job.indexOf('run: start-cli ')
    assert.ok(verification >= 0 && execution > verification)
  }
})

test('Buzz source pin includes the reviewed migration and iOS auth repairs', async () => {
  const gitmodules = await readFile(
    new URL('../.gitmodules', import.meta.url),
    'utf8',
  )
  assert.match(gitmodules, /url = https:\/\/github.com\/block\/buzz.git/)
  const { stdout } = await execFile('git', ['-C', 'buzz', 'rev-parse', 'HEAD'])
  assert.equal(stdout.trim(), 'f87c10895ea35a9a2cea629fef1d7532a3fecbc5')
  for (const [path, expression] of [
    ['crates/buzz-auth/src/nip42.rs', /fn ws_and_wss_same_authority_are_equivalent\(/],
    ['crates/buzz-db/src/runtime/migration.rs', /fn startos_checksum_repair_allowlist_is_exact\(/],
  ]) {
    assert.match(await readFile(new URL(`../buzz/${path}`, import.meta.url), 'utf8'), expression)
  }
})

test('tagged snapshot accepts installed alpha upgrades without empty history nodes', async () => {
  const versions = await readFile(versionsPath, 'utf8')
  assert.match(versions, /export \{ current \} from '\.\.\/\.\.\/versions\/current'/)
  assert.match(versions, /export const other = \[\]/)

  const { manifest } = require('../javascript/index.js')
  const {
    ExtendedVersion,
    VersionRange,
  } = require('@start9labs/start-sdk/base/lib/exver')
  assert.equal(manifest.version, '0.5.28:0')
  for (const installed of ['0.5.20:1-alpha.2', '0.5.20:1-alpha.3', '0.5.23:0']) {
    assert.equal(VersionRange.parse(manifest.canMigrateFrom).satisfiedBy(
      ExtendedVersion.parse(installed)), true,
      `manifest range rejected ${installed}: ${manifest.canMigrateFrom}`)
  }
})
