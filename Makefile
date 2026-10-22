# overrides to s9pk.mk must precede the include statement
# The bundled images (ghcr.io/block/buzz, postgres, redis, minio) publish
# amd64 + arm64 only — no riscv64.
ARCHES := x86 arm
include s9pk.mk
