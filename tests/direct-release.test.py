"""Offline contracts; fixture bytes are NOT a built or installable s9pk."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


class WorkflowContracts(unittest.TestCase):
    def test_direct_same_runner_and_trust_boundary(self):
        build = (ROOT / '.github/workflows/buildService.yml').read_text()
        release = (ROOT / '.github/workflows/releaseService.yml').read_text()
        for forbidden in ('actions/upload-artifact', 'actions/download-artifact', 'shared-workflows', 'dev-build-'):
            self.assertNotIn(forbidden, build + release)
        self.assertIn('python3 scripts/direct-release.py', build)
        self.assertIn('github.event.pull_request.head.repo.full_name == github.repository', build)
        self.assertIn('ref: ${{ github.event.pull_request.head.sha || github.sha }}', build)
        self.assertIn('contents: write', build)
        self.assertIn('persist-credentials: false', build)
        self.assertIn('start-cli s9pk init-workspace ..', build)
        self.assertIn('make x86_64', build)
        self.assertNotIn('secrets.', build + release)
        self.assertIn('exit 1', release)
        self.assertNotIn('tags:', release)


class DeliveryContracts(unittest.TestCase):
    def setUp(self):
        path = ROOT / 'scripts/direct-release.py'
        self.assertTrue(path.exists(), 'direct release helper is missing')
        spec = importlib.util.spec_from_file_location('direct_release', path)
        self.m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.m)
        self.tmp = tempfile.TemporaryDirectory(dir=os.environ.get('TMPDIR'))
        self.addCleanup(self.tmp.cleanup)
        self.pkg = Path(self.tmp.name) / 'buzz_x86_64.s9pk'
        self.pkg.write_bytes(b'offline test fixture, not a package')
        self.sha = 'a' * 40
        self.env = {'GITHUB_REPOSITORY': 'owner/repo', 'HEAD_SHA': self.sha,
                    'GITHUB_RUN_ID': '123', 'GITHUB_RUN_ATTEMPT': '1'}
        self.calls = []
        self.assets = []
        self.exists = False
        self.bad_hash = False
        self.bad_target = False
        self.created = None

    def api(self, method, endpoint, payload=None, asset=None, missing_ok=False):
        self.calls.append((method, endpoint, payload, asset))
        if method == 'GET' and '/releases?per_page=100&page=' in endpoint:
            return [{'tag_name': self.tag()}] if self.exists else []
        if method == 'GET' and '/git/ref/tags/' in endpoint:
            return None
        if method == 'POST' and endpoint.endswith('/releases'):
            self.created = dict(payload, id=42, assets=[])
            return self.created.copy()
        if method == 'POST' and '/releases/42/assets?' in endpoint:
            digest = hashlib.sha256(asset.read_bytes()).hexdigest()
            obj = {'id': len(self.assets) + 10, 'name': asset.name,
                   'size': asset.stat().st_size, 'state': 'uploaded',
                   'digest': 'sha256:' + ('0' * 64 if self.bad_hash else digest)}
            self.assets.append(obj)
            return obj
        if method == 'GET' and endpoint.endswith('/releases/42'):
            return dict(self.created, assets=self.assets,
                        target_commitish='b' * 40 if self.bad_target else self.sha)
        self.fail('unexpected API operation: ' + method + ' ' + endpoint)

    def tag(self):
        return 'rc-' + self.sha + '-123-1'

    def deliver(self, sha=None):
        with patch.dict(os.environ, self.env), patch.object(self.m, 'api', self.api), patch.object(self.m, 'checkout_sha', return_value=sha or self.sha):
            return self.m.deliver(self.pkg)

    def test_draft_id_upload_and_exact_commit_provenance(self):
        result = self.deliver()
        self.assertEqual(result['id'], 42)
        self.assertTrue(self.created['draft'])
        self.assertTrue(self.created['prerelease'])
        self.assertEqual(self.created['make_latest'], 'false')
        self.assertEqual(self.created['target_commitish'], self.sha)
        self.assertEqual(self.created['tag_name'], self.tag())
        self.assertEqual(len(self.assets), 3)
        self.assertTrue(all('/releases/42/assets?' in c[1] for c in self.calls if c[3]))
        self.assertEqual(self.calls[-1][1], 'repos/owner/repo/releases/42')
        provenance = json.loads(self.pkg.with_name('provenance.json').read_text())
        self.assertEqual(provenance['commit'], self.sha)
        self.assertEqual(provenance['sha256'], hashlib.sha256(self.pkg.read_bytes()).hexdigest())
        self.assertEqual(provenance['package_version'], '0.5.28:0')

    def test_missing_package_fails_before_api(self):
        self.pkg.unlink()
        with self.assertRaises((ValueError, FileNotFoundError)):
            self.deliver()
        self.assertEqual(self.calls, [])

    def test_sha_mismatch_fails_before_api(self):
        with self.assertRaises(ValueError):
            self.deliver('b' * 40)
        self.assertEqual(self.calls, [])

    def test_invalid_sha_fails_before_api(self):
        self.env['HEAD_SHA'] = 'main'
        with self.assertRaises(ValueError):
            self.deliver()
        self.assertEqual(self.calls, [])

    def test_existing_release_never_overwritten(self):
        self.exists = True
        with self.assertRaises(ValueError):
            self.deliver()
        self.assertTrue(all(c[0] == 'GET' for c in self.calls))

    def test_existing_tag_never_reused(self):
        real = self.api
        def existing_tag(method, endpoint, **kwargs):
            if '/git/ref/tags/' in endpoint:
                return {'object': {'sha': self.sha}}
            return real(method, endpoint, **kwargs)
        with patch.dict(os.environ, self.env), patch.object(self.m, 'api', existing_tag), patch.object(self.m, 'checkout_sha', return_value=self.sha):
            with self.assertRaises(ValueError):
                self.m.deliver(self.pkg)
        self.assertTrue(all(c[0] == 'GET' for c in self.calls))

    def test_remote_hash_mismatch_fails(self):
        self.bad_hash = True
        with self.assertRaises(ValueError):
            self.deliver()

    def test_remote_commit_mismatch_fails(self):
        self.bad_target = True
        with self.assertRaises(ValueError):
            self.deliver()

    def test_draft_lookup_paginates_and_refuses_existing_second_page(self):
        real = self.api
        def pages(method, endpoint, **kwargs):
            if endpoint.endswith('page=1'):
                return [{'tag_name': 'other-' + str(i)} for i in range(100)]
            if endpoint.endswith('page=2'):
                return [{'tag_name': self.tag()}]
            return real(method, endpoint, **kwargs)
        with patch.dict(os.environ, self.env), patch.object(self.m, 'api', pages), patch.object(self.m, 'checkout_sha', return_value=self.sha):
            with self.assertRaises(ValueError):
                self.m.deliver(self.pkg)
        self.assertEqual(self.calls, [])

    def test_symlink_package_fails_before_api(self):
        other = self.pkg.with_name('actual.s9pk')
        self.pkg.rename(other)
        self.pkg.symlink_to(other)
        with self.assertRaises(ValueError):
            self.deliver()
        self.assertEqual(self.calls, [])

    def test_upload_transport_uses_numeric_id_and_binary_file_input(self):
        import subprocess
        endpoint = 'https://uploads.github.com/repos/owner/repo/releases/42/assets?name=buzz_x86_64.s9pk'
        completed = subprocess.CompletedProcess([], 0, '{"id":10}', '')
        with patch.object(self.m.subprocess, 'run', return_value=completed) as run:
            self.assertEqual(self.m.api('POST', endpoint, asset=self.pkg), {'id': 10})
        args = run.call_args.args[0]
        self.assertEqual(args[:5], ['gh', 'api', '--method', 'POST', endpoint])
        self.assertIn('Content-Type: application/octet-stream', args)
        self.assertEqual(args[-2:], ['--input', str(self.pkg)])
        self.assertNotIn('--clobber', args)

    def test_only_explicit_404_is_treated_as_missing(self):
        import subprocess
        with patch.object(self.m.subprocess, 'run', return_value=subprocess.CompletedProcess([], 1, '', 'gh: missing (HTTP 404)')):
            self.assertIsNone(self.m.api('GET', 'repos/owner/repo/git/ref/tags/new', missing_ok=True))
        with patch.object(self.m.subprocess, 'run', return_value=subprocess.CompletedProcess([], 1, '', 'gh: forbidden (HTTP 403)')):
            with self.assertRaises(RuntimeError):
                self.m.api('GET', 'repos/owner/repo/git/ref/tags/new', missing_ok=True)

    def test_missing_remote_digest_fails_closed(self):
        real = self.api
        def no_digest(method, endpoint, **kwargs):
            response = real(method, endpoint, **kwargs)
            if method == 'GET' and endpoint.endswith('/releases/42'):
                response['assets'][0].pop('digest')
            return response
        with patch.dict(os.environ, self.env), patch.object(self.m, 'api', no_digest), patch.object(self.m, 'checkout_sha', return_value=self.sha):
            with self.assertRaises(ValueError):
                self.m.deliver(self.pkg)

    def test_empty_package_fails_before_api(self):
        self.pkg.write_bytes(b'')
        with self.assertRaises(ValueError):
            self.deliver()
        self.assertEqual(self.calls, [])

    def test_2gib_package_rejected_before_hash_or_api(self):
        with self.pkg.open('wb') as stream:
            stream.truncate(2 * 1024 ** 3)
        with self.assertRaises(ValueError):
            self.deliver()
        self.assertEqual(self.calls, [])


if __name__ == '__main__':
    unittest.main()
