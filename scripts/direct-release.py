#!/usr/bin/env python3
"""Upload a locally built validation package to a NEW draft release, never publish.

Uses only the runner's GH_TOKEN through gh; no Actions artifact service or keys.
Partial failures deliberately leave the draft for inspection, never delete/clobber.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]


def checkout_sha():
    return subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()


def api(method, endpoint, payload=None, asset=None, missing_ok=False):
    args = ['gh', 'api', '--method', method, endpoint,
            '-H', 'X-GitHub-Api-Version: 2022-11-28']
    data = None
    if asset is not None:
        args += ['-H', 'Content-Type: application/octet-stream', '--input', str(asset)]
    elif payload is not None:
        args += ['-H', 'Content-Type: application/json', '--input', '-']
        data = json.dumps(payload)
    result = subprocess.run(args, input=data, text=True, capture_output=True, check=False)
    if result.returncode:
        if missing_ok and '(HTTP 404)' in result.stderr:
            return None
        raise RuntimeError(f'GitHub {method} failed: {result.stderr.strip()}')
    return json.loads(result.stdout)


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def deliver(package):
    sha = os.environ['HEAD_SHA']
    repo = os.environ['GITHUB_REPOSITORY']
    run = os.environ['GITHUB_RUN_ID']
    attempt = os.environ['GITHUB_RUN_ATTEMPT']
    if not re.fullmatch(r'[0-9a-f]{40}', sha) or checkout_sha() != sha:
        raise ValueError('expected full commit SHA must match checked-out HEAD')
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repo):
        raise ValueError('invalid repository')
    if not re.fullmatch(r'[1-9][0-9]*', run) or not re.fullmatch(r'[1-9][0-9]*', attempt):
        raise ValueError('invalid workflow run identity')
    if package.is_symlink() or not package.is_file():
        raise ValueError('native package is missing or not a regular file')
    if not 0 < package.stat().st_size < 2 * 1024 ** 3:
        raise ValueError('each release asset must be nonempty and under 2 GiB')
    version_text = (ROOT / 'startos/versions/current.ts').read_text()
    versions = re.findall(r"version:\s*'([^']+)'", version_text)
    if len(versions) != 1:
        raise ValueError('cannot resolve package version from current.ts')
    package_hash = digest(package)
    checksum = package.with_name(package.name + '.sha256')
    checksum.write_text(f'{package_hash}  {package.name}\n')
    provenance = package.with_name('provenance.json')
    provenance.write_text(json.dumps({
        'commit': sha, 'repository': repo, 'package_version': versions[0],
        'run_id': run, 'run_attempt': attempt,
        'run_url': f'https://github.com/{repo}/actions/runs/{run}',
        'package': package.name, 'sha256': package_hash,
        'size': package.stat().st_size, 'signing': 'ephemeral developer key; validation only',
        'release_status': 'HOLD: security, source compliance and StartOS E2E gates incomplete',
    }, indent=2) + '\n')
    files = [package, checksum, provenance]
    expected = {p.name: (p.stat().st_size, 'sha256:' + digest(p)) for p in files}
    tag = f'rc-{sha}-{run}-{attempt}'
    base = f'repos/{repo}'
    # Draft releases need authenticated list/ID APIs; tags/latest is NOT a draft lookup.
    page = 1
    while True:
        releases = api('GET', f'{base}/releases?per_page=100&page={page}')
        if any(r['tag_name'] == tag for r in releases):
            raise ValueError('release identity already exists; refusing any overwrite')
        if len(releases) < 100:
            break
        page += 1
    if api('GET', f'{base}/git/ref/tags/{tag}', missing_ok=True) is not None:
        raise ValueError('tag already exists; refusing reuse')
    release = api('POST', f'{base}/releases', payload={
        'tag_name': tag, 'target_commitish': sha,
        'name': f'Validation RC {versions[0]} / {sha[:12]} / {run}.{attempt}',
        'body': f'Commit: {sha}\nRun: https://github.com/{repo}/actions/runs/{run}\n'
                'HOLD — validation only, ephemeral signing key, NOT install-ready or stable. '
                'Security advisories, bounded reads, source compliance and StartOS E2E remain gates. '
                'Do not publish this draft or feed it to stable pollers. See provenance.json.',
        'draft': True, 'prerelease': True, 'make_latest': 'false',
    })
    release_id = release['id']
    if not isinstance(release_id, int) or isinstance(release_id, bool) or release_id <= 0:
        raise ValueError('invalid draft release ID')
    for path in files:
        endpoint = f'https://uploads.github.com/{base}/releases/{release_id}/assets?name={quote(path.name, safe="")}'
        api('POST', endpoint, asset=path)
    # Read the exact newly-created draft by numeric ID, not by tag (drafts have no tag yet).
    verified = api('GET', f'{base}/releases/{release_id}')
    if (verified['id'] != release_id or verified['tag_name'] != tag
            or verified['target_commitish'] != sha
            or verified['draft'] is not True or verified['prerelease'] is not True):
        raise ValueError('draft release identity/provenance mismatch')
    assets = verified['assets']
    if len(assets) != len(expected) or {a['name'] for a in assets} != set(expected):
        raise ValueError('unexpected or missing release assets')
    for asset in assets:
        size, sha256 = expected[asset['name']]
        if asset.get('state') != 'uploaded' or asset.get('size') != size or asset.get('digest') != sha256:
            raise ValueError('remote asset size/state/SHA256 mismatch')
    return verified


if __name__ == '__main__':
    result = deliver(Path('buzz_x86_64.s9pk'))
    report = f'Draft release ID {result["id"]}: {result.get("html_url", "")}\nValidation only; stable publication remains HOLD.\n'
    print(report)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(report)
