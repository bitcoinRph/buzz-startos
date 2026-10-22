# overrides to s9pk.mk must precede the include statement
# All source builds and auxiliary images support amd64 + arm64, not riscv64.
ARCHES := x86 arm
include s9pk.mk

.PHONY: prepare-source
prepare-source:
	sh scripts/prepare-source.sh

ingredients: prepare-source
javascript/index.js: scripts/prepare-source.sh patches/startos-relay.patch
