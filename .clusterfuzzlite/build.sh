#!/usr/bin/env bash
# Placeholder build script. Real continuous fuzzing for this repository runs
# in .github/workflows/fuzz.yml because ClusterFuzzLite does not natively
# support .NET. See ../.clusterfuzzlite/README.md.
set -euo pipefail
echo "SeventySix fuzzing is performed via SharpFuzz in .github/workflows/fuzz.yml"
echo "This script intentionally performs no work."
exit 0
