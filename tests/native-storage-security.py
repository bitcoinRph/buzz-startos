#!/usr/bin/env python3
"""Native MinIO boundary regression; binaries supplied, no Docker/live service.
Usage: python3 tests/native-storage-security.py /path/to/minio /path/to/mc
Only disposable loopback state under TMPDIR is touched; credentials never printed.
"""
import hashlib
import json
import os
import pathlib
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

minio, mc = [str(pathlib.Path(x).resolve()) for x in sys.argv[1:]]
with tempfile.TemporaryDirectory(prefix='buzz-storage-security-', dir=os.environ['TMPDIR']) as tmp:
    root = pathlib.Path(tmp)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    endpoint = f'http://127.0.0.1:{port}'
    password = secrets.token_hex(24)
    env = dict(os.environ, MINIO_ROOT_USER='securityproof', MINIO_ROOT_PASSWORD=password,
               MINIO_BROWSER='off')
    client = dict(os.environ, MC_CONFIG_DIR=str(root/'mc'),
                  MC_HOST_proof=f'http://securityproof:{password}@127.0.0.1:{port}')
    result = {}
    process = None
    def command(*args, environment=client):
        return subprocess.run([mc, '--json', *args], env=environment,
                              capture_output=True, timeout=20)
    def success(*args):
        response = command(*args)
        assert response.returncode == 0, f'authenticated operation failed: {args[0]}'
    def denied(method, path, expected=403):
        request = urllib.request.Request(endpoint+path, method=method,
                                         data=b'unauthorized' if method == 'PUT' else None)
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                status = response.status
        except urllib.error.HTTPError as error:
            status = error.code
        assert status == expected, f'{method} {path}: {status}, wanted {expected}'
        result[f'anonymous_{method}_{path}'] = status
    def start(log):
        proc = subprocess.Popen([minio, 'server', str(root/'data'), '--address', f'127.0.0.1:{port}'],
                                env=env, stdout=log, stderr=log)
        for _ in range(100):
            try:
                with urllib.request.urlopen(endpoint+'/minio/health/ready', timeout=1) as response:
                    if response.status == 200:
                        return proc
            except (OSError, urllib.error.URLError):
                pass
            if proc.poll() is not None:
                raise AssertionError('MinIO exited before readiness')
            time.sleep(.1)
        proc.terminate()
        proc.wait(timeout=20)
        raise AssertionError('MinIO readiness timed out')
    with (root/'server.log').open('wb') as log:
        try:
            process = start(log)
            success('mb', 'proof/buzz-security')
            success('anonymous', 'set', 'none', 'proof/buzz-security')
            payload = root/'payload'; payload.write_bytes(secrets.token_bytes(64))
            success('cp', str(payload), 'proof/buzz-security/payload')
            success('cp', 'proof/buzz-security/payload', str(root/'download'))
            assert payload.read_bytes() == (root/'download').read_bytes()
            for method, path in [('GET', '/buzz-security/payload'), ('HEAD', '/buzz-security/payload'),
                                 ('GET', '/buzz-security/'), ('PUT', '/buzz-security/forbidden')]:
                denied(method, path)
            # Positive control proves the anonymous-GET probe can detect public policy.
            success('anonymous', 'set', 'download', 'proof/buzz-security')
            with urllib.request.urlopen(endpoint+'/buzz-security/payload', timeout=5) as response:
                assert response.read() == payload.read_bytes()
            success('anonymous', 'set', 'none', 'proof/buzz-security')
            denied('GET', '/buzz-security/payload')
            for name, user, secret, code in [
                ('bad_key', 'invalidsecurityproof', password, b'InvalidAccessKeyId'),
                ('bad_signature', 'securityproof', secrets.token_hex(24), b'SignatureDoesNotMatch'),
            ]:
                bad = dict(client, MC_HOST_proof=f'http://{user}:{secret}@127.0.0.1:{port}')
                response = command('cat', 'proof/buzz-security/payload', environment=bad)
                assert response.returncode != 0, name+' unexpectedly succeeded'
                assert code in response.stdout+response.stderr, name+' unexpected rejection'
                assert payload.read_bytes() not in response.stdout, name+' returned private bytes'
                result[name] = code.decode()
            process.terminate(); process.wait(timeout=20)
            process = start(log)
            success('cp', 'proof/buzz-security/payload', str(root/'restart'))
            assert payload.read_bytes() == (root/'restart').read_bytes()
            denied('GET', '/buzz-security/payload')
            result['authenticated_roundtrip_restart_sha256'] = hashlib.sha256(payload.read_bytes()).hexdigest()
            result['public_policy_control'] = 'GET 200 with exact private fixture bytes before restoring none'
        finally:
            if process is not None and process.poll() is None:
                process.terminate(); process.wait(timeout=20)
    result['disposable_server_stopped'] = True
    print(json.dumps(result, indent=2))
