# SharpFuzz Seed Corpus

This directory holds **deterministic, version-controlled seed inputs** for every
SharpFuzz target in `SeventySix.Fuzz`. Each subdirectory matches a `FUZZ_TARGET`
value handled by [`Program.cs`](../Program.cs).

| Subdirectory              | `FUZZ_TARGET`            | Method under test                  |
| ------------------------- | ------------------------ | ---------------------------------- |
| `registration-token/`     | `registration-token`     | `RegistrationTokenService.Decode`  |
| `log-sanitize/`           | `log-sanitize`           | `LogSanitizer.Sanitize`            |
| `log-mask-email/`         | `log-mask-email`         | `LogSanitizer.MaskEmail`           |
| `log-mask-username/`      | `log-mask-username`      | `LogSanitizer.MaskUsername`        |
| `log-mask-email-subject/` | `log-mask-email-subject` | `LogSanitizer.MaskEmailSubject`    |

## What belongs here

- **DO commit** small, deterministic seed files that exercise the happy path,
  every documented bad-input branch, and known historical regressions.
- **DO NOT commit** runtime artifacts. The Fuzz project's `.gitignore` excludes
  `mutated/`, `crashes/`, `findings/`, and `*.crash` outputs produced by CI.

## Running locally

```pwsh
cd SeventySix.Server\SeventySix.Fuzz
dotnet build --configuration Release /p:TreatWarningsAsErrors=true

# Replay every seed for every target.
foreach ($t in 'registration-token','log-sanitize','log-mask-email','log-mask-username','log-mask-email-subject') {
    $env:FUZZ_TARGET = $t
    Get-ChildItem "corpus/$t" -File | ForEach-Object {
        Get-Content $_.FullName -AsByteStream -Raw | dotnet run --configuration Release --no-build
    }
}
```

The CI workflow [`fuzz.yml`](../../../.github/workflows/fuzz.yml) replays the
same seeds in a matrix job, then runs bounded mutation with managed-memory
growth tracking via the `FUZZ_MEMORY_BUDGET_MB` environment variable.
