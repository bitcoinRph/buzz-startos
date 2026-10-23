import assert from 'node:assert/strict'
import { execFile as execFileCallback } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import test from 'node:test'

const execFile = promisify(execFileCallback)
const require = createRequire(import.meta.url)
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const workflow = () => read('.github/workflows/buildService.yml')

test('write-enabled draft packaging excludes forks and Dependabot and binds exact checkout SHA', async () => {
  const yaml = await workflow()
  assert.match(yaml, /permissions: \{\}/)
  assert.doesNotMatch(yaml, /pull_request_target|secrets\.|\n  publish:/)
  assert.equal(yaml.match(/^  package:/gm)?.length, 1)
  assert.match(yaml, /\n  package:[\s\S]*permissions:\n\s+contents: write/)
  const condition = yaml.match(/    if: >-\n([\s\S]*?)(?=    runs-on:)/)?.[1].trim()
  assert.ok(condition, 'package write-token guard is missing')
  // Evaluate the actual Actions boolean expression, not a duplicate predicate.
  // Source is the reviewed local workflow, never PR/event-provided expression text;
  // contexts below are data only. No network, credentials or release writes occur.
  const permitted = new Function('github', `return (${condition})`)
  const context = (event, actor, author = 'human', repo = 'owner/repo', draft = false) => ({
    event_name: event, actor, repository: 'owner/repo',
    ...(event === 'pull_request' ? { event: { pull_request: {
      user: { login: author }, head: { repo: { full_name: repo } }, draft,
    } } } : {}),
  })
  for (const [name, github, expected] of [
    ['human same-repo PR', context('pull_request', 'human'), true],
    ['human same-repo draft PR', context('pull_request', 'human', 'human', 'owner/repo', true), true],
    ['fork PR', context('pull_request', 'human', 'human', 'fork/repo'), false],
    ['fork draft PR', context('pull_request', 'human', 'human', 'fork/repo', true), false],
    ['Dependabot actor', context('pull_request', 'dependabot[bot]'), false],
    ['human reopening Dependabot same-repo PR', context('pull_request', 'human', 'dependabot[bot]'), false],
    ['human reopening Dependabot fork PR', context('pull_request', 'human', 'dependabot[bot]', 'fork/repo'), false],
    ['human reopening Dependabot draft PR', context('pull_request', 'human', 'dependabot[bot]', 'owner/repo', true), false],
    ['trusted manual', context('workflow_dispatch', 'human'), true],
    ['Dependabot manual', context('workflow_dispatch', 'dependabot[bot]'), false],
    ['main push', context('push', 'human'), true],
    ['Dependabot push', context('push', 'dependabot[bot]'), false],
  ]) assert.equal(permitted(github), expected, name)

  assert.match(yaml, /HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/)
  const checkouts = [...yaml.matchAll(/uses: actions\/checkout@[^\n]+([\s\S]*?)(?=\n      - name:)/g)]
  assert.equal(checkouts.length, 1, 'one same-runner checkout is required')
  assert.match(checkouts[0][1], /ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/)
  assert.match(checkouts[0][1], /persist-credentials: false/)
  assert.match(checkouts[0][1], /submodules: recursive/)
  assert.match(yaml, /expected_sha:[\s\S]*required: true/)
  assert.match(yaml, /EXPECTED_SHA: \$\{\{ inputs\.expected_sha \}\}/)
  assert.match(yaml, /EVENT_NAME: \$\{\{ github\.event_name \}\}/)
  const shaGuard = yaml.match(/run: \|\n(          test "\$\(git rev-parse HEAD\)"[\s\S]*?)(?=          python3 tests\/direct-release\.test\.py)/)?.[1]
  assert.ok(shaGuard, 'executable checkout/dispatch SHA guard is missing')
  const { stdout } = await execFile('git', ['rev-parse', 'HEAD'])
  const sha = stdout.trim()
  for (const [name, event, head, expected, allowed] of [
    ['manual exact SHA', 'workflow_dispatch', sha, sha, true],
    ['manual wrong SHA', 'workflow_dispatch', sha, 'b'.repeat(40), false],
    ['manual missing SHA', 'workflow_dispatch', sha, '', false],
    ['manual abbreviated SHA', 'workflow_dispatch', sha, sha.slice(0, 12), false],
    ['wrong checkout SHA', 'workflow_dispatch', 'b'.repeat(40), 'b'.repeat(40), false],
    ['PR exact head without dispatch input', 'pull_request', sha, '', true],
    ['PR synthetic merge mismatch', 'pull_request', 'b'.repeat(40), '', false],
    ['main exact head', 'push', sha, '', true],
  ]) {
    let passed = true
    try {
      await execFile('bash', ['-e', '-c', shaGuard], {
        env: { ...process.env, EVENT_NAME: event, HEAD_SHA: head, EXPECTED_SHA: expected },
      })
    } catch (error) {
      assert.equal(error.code, 1, `${name} must fail through test, not shell error`)
      passed = false
    }
    assert.equal(passed, allowed, name)
  }
  const actions = [...yaml.matchAll(/uses: ([^\s]+)@([^\s]+)/g)]
  assert.equal(actions.length, 2)
  for (const [, action, revision] of actions)
    assert.match(revision, /^[0-9a-f]{40}$/, `${action} must be SHA-pinned`)
})

test('same-runner ephemeral signing delivers only new verified draft RCs and stable stays fail-closed', async () => {
  const yaml = await workflow()
  const release = await read('.github/workflows/releaseService.yml')
  const helper = await read('scripts/direct-release.py')
  assert.match(yaml, /run: start-cli init-key/)
  assert.match(yaml, /run: start-cli s9pk init-workspace \.\./)
  assert.doesNotMatch(yaml + release, /secrets\.|BUILD_KEY|package-signing|actions\/(?:upload|download)-artifact|shared-workflows|dev-build-/)
  const build = yaml.indexOf('make x86_64')
  const upload = yaml.indexOf('run: python3 scripts/direct-release.py')
  assert.ok(build >= 0 && upload > build, 'native build must precede same-job upload')
  assert.equal(yaml.match(/GH_TOKEN:/g)?.length, 1)
  assert.match(yaml, /Deliver validation assets directly[\s\S]*GH_TOKEN: \$\{\{ github\.token \}\}[\s\S]*run: python3 scripts\/direct-release\.py/)
  assert.match(helper, /'draft': True, 'prerelease': True, 'make_latest': 'false'/)
  assert.match(helper, /tag = f'rc-\{sha\}-\{run\}-\{attempt\}'/)
  assert.match(helper, /release_id = release\['id'\]/)
  assert.match(helper, /isinstance\(release_id, int\)/)
  assert.match(helper, /releases\/\{release_id\}\/assets\?name=/)
  assert.match(helper, /api\('GET', f'\{base\}\/releases\/\{release_id\}'\)/)
  assert.match(helper, /verified\['target_commitish'\] != sha/)
  assert.match(helper, /verified\['draft'\] is not True or verified\['prerelease'\] is not True/)
  assert.match(helper, /len\(assets\) != len\(expected\)/)
  assert.match(helper, /asset\.get\('state'\) != 'uploaded'.*asset\.get\('size'\) != size.*asset\.get\('digest'\) != sha256/)
  assert.match(helper, /release identity already exists; refusing any overwrite/)
  assert.match(helper, /tag already exists; refusing reuse/)
  assert.doesNotMatch(helper, /api\(['"](?:DELETE|PATCH)|--clobber|\/releases\/tags\//)
  assert.match(yaml, /cancel-in-progress: false/)
  assert.match(release, /permissions: \{\}/)
  assert.match(release, /on:\n  workflow_dispatch:\n/)
  assert.match(release, /HOLD: quick-xml advisories, bounded reads, source compliance and StartOS E2E/)
  assert.match(release, /\n          exit 1\s*$/)
  assert.doesNotMatch(release, /tags:|contents: write|github\.token|uses:|start-cli|gh (?:release|api)|python3/)
})

test('validation reclaims ephemeral runner disk before relay regression tests', async () => {
  const yaml = await workflow()
  const cleanup = yaml.indexOf('Reclaim runner disk space')
  const rustTests = yaml.indexOf('cargo test -p buzz-auth ws_and_wss --lib')
  assert.ok(cleanup >= 0, 'runner disk cleanup step is missing')
  assert.ok(cleanup < rustTests, 'runner disk cleanup must precede relay regression tests')
  assert.match(yaml, /sudo rm -rf \/usr\/share\/dotnet \/usr\/local\/lib\/android \/opt\/ghc \/usr\/local\/share\/boost/)
  assert.match(yaml, /CARGO_INCREMENTAL: '0'/)
  assert.match(yaml, /CARGO_PROFILE_TEST_DEBUG: '0'/)
  assert.match(yaml, /cargo test -p buzz-auth ws_and_wss --lib[\s\S]*cargo test -p buzz-db startos_checksum_repair_allowlist_is_exact --lib/)
  assert.match(yaml, /cargo test --locked -p buzz-auth/)
  assert.match(yaml, /cargo test --locked -p buzz-db -- --test-threads=1/)
  assert.match(yaml, /run: npm test/)
  assert.match(yaml, /run: npm run check/)
})

test('Start CLI is pinned and checksum-verified before execution', async () => {
  const yaml = await workflow()
  const url = 'https://github.com/Start9Labs/start-technologies/releases/download/start-cli/v1.1.0/start-cli_x86_64-linux'
  assert.equal(yaml.split(url).length - 1, 1)
  assert.equal(yaml.split('70eff67b6e9a936acd8aaaf787b783819252ecedaa5c74d462e3b15ed4dd843a').length - 1, 1)
  assert.equal(yaml.match(/sha256sum -c -/g)?.length, 1)
  assert.doesNotMatch(yaml, /api\.github\.com\/repos\/Start9Labs\/start-technologies\/releases/)
  const verification = yaml.indexOf('sha256sum -c -')
  const execution = yaml.indexOf('run: start-cli ')
  assert.ok(verification >= 0 && execution > verification)
  assert.match(yaml, /curl -fsSL "\$START_CLI_URL" -o "\$HOME\/\.local\/bin\/start-cli"/)
  assert.match(yaml, /node-version: '22'/)
  assert.match(yaml, /run: npm ci/)
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
  const versions = await read('startos/install/versions/index.ts')
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
