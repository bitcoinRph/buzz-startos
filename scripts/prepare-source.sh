#!/bin/sh
# Build the official tagged snapshot plus the reviewed, versioned StartOS patch.
set -eu
cd "$(dirname "$0")/.."
expected=f87c10895ea35a9a2cea629fef1d7532a3fecbc5
actual=$(git -C buzz rev-parse HEAD)
[ "$actual" = "$expected" ] || { printf '%s\n' 'Unexpected Buzz source commit; refusing to apply compatibility patch' >&2; exit 1; }
patch="$(pwd)/patches/startos-relay.patch"
if git -C buzz apply --reverse --check "$patch" 2>/dev/null; then
  exit 0
fi
git -C buzz apply --check "$patch"
git -C buzz apply "$patch"
