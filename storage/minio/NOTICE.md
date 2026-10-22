# MinIO distribution notice

MinIO is licensed under GNU Affero General Public License v3.0; see
/usr/share/licenses/minio/LICENSE. Upstream copyright notices remain in source.

Official repository: https://github.com/minio/minio
Release: RELEASE.2025-10-15T17-29-55Z
Exact source commit: 9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a
Source archive: https://github.com/minio/minio/archive/9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a.tar.gz

The binary is built from that source without MinIO application changes, using
the accompanying storage/minio/Dockerfile, Go 1.24.8, the source's go.mod/go.sum
and buildscripts/gen-ldflags.go. The StartOS wrapper and Dockerfile form part of
the build/install instructions and must accompany distribution.

Before conveying the image or s9pk, the distributor must provide corresponding
source access as required by AGPLv3 section 6 (including required dependency
source and build/install scripts), and preserve license/copyright notices.
This notice and remote upstream source links alone are not certification of
compliance or a verified durable distribution/source hosting arrangement.
The repository is archived; future security maintenance is a separate risk.
