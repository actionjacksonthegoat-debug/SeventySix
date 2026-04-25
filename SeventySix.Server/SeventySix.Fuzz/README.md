# SeventySix.Fuzz

Continuous fuzzing harness for the SeventySix Ecosystem, targeting the
user-controlled
[`RegistrationTokenService.Decode`](../SeventySix.Shared/Utilities/RegistrationTokenService.cs)
surface (Base64URL → JSON → `CombinedRegistrationTokenDto`).

## Why SharpFuzz instead of ClusterFuzzLite?

ClusterFuzzLite officially supports C/C++, Go, Java/JVM, Python, Rust, and
Swift — **not C# / .NET**. We therefore use [SharpFuzz](https://github.com/Metalnem/sharpfuzz)
plus libFuzzer for native AFL-style fuzzing of managed code. The
`.clusterfuzzlite/` directory at the repository root holds the project
metadata that OpenSSF Scorecard's Fuzzing check looks for, while the
[`.github/workflows/fuzz.yml`](../../.github/workflows/fuzz.yml) workflow
performs the actual fuzzing on every pull request and on a daily schedule.

## Local run

```pwsh
cd SeventySix.Server/SeventySix.Fuzz
dotnet build -c Release
dotnet run -c Release --no-build
```

The harness reads from stdin so you can pipe corpus files in:

```pwsh
Get-Content corpus/valid_token.txt | dotnet run -c Release --no-build
```

## Adding a target

1. Add a `ProjectReference` for the new target's project.
2. Replace the call inside `Fuzzer.Run` with the new target invocation.
3. Add representative seed inputs to `corpus/`.
