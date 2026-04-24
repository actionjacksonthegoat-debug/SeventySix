# ClusterFuzzLite project metadata

> **Note**: ClusterFuzzLite does not support C# / .NET as a first-class
> language. The actual continuous fuzzing for this repository runs via
> [SharpFuzz](https://github.com/Metalnem/sharpfuzz) + libFuzzer in the
> [`.github/workflows/fuzz.yml`](../.github/workflows/fuzz.yml) workflow,
> which mutates the seed corpus under
> [`SeventySix.Server/SeventySix.Fuzz/corpus/`](../SeventySix.Server/SeventySix.Fuzz/corpus/)
> against the harness in
> [`SeventySix.Server/SeventySix.Fuzz/Program.cs`](../SeventySix.Server/SeventySix.Fuzz/Program.cs).
>
> This directory exists so OpenSSF Scorecard's Fuzzing check recognizes
> that the project performs continuous fuzzing.
