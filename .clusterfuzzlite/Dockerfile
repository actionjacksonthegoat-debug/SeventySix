# SeventySix uses SharpFuzz + libFuzzer for continuous fuzzing of the .NET
# attack surface (see .github/workflows/fuzz.yml). ClusterFuzzLite does not
# natively support C# / .NET, so this Dockerfile is intentionally minimal:
# it is referenced by the OpenSSF Scorecard Fuzzing check but the active
# fuzzing pipeline is driven by GitHub Actions, not by ClusterFuzzLite.
#
# Pinned by digest for supply-chain hardening (Scorecard: Pinned-Dependencies).
FROM gcr.io/oss-fuzz-base/base-builder@sha256:7ac9d75c7d6b054c82b2178b22f698e9e27ced0ed3e37352f99de1778505470f

COPY . $SRC/SeventySix
COPY .clusterfuzzlite/build.sh $SRC/build.sh
WORKDIR $SRC/SeventySix
