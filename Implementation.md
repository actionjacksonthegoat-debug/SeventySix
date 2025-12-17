# Implementation Plan: Fix Code Formatter Dictionary/Collection Initializer Issues

## Problem Statement

When running `npm run format:server`, we get these warnings that cannot be automatically fixed:

```
Unable to fix RCS0053. Code fix FixFormattingOfListCodeFixProvider didn't return a Fix All action.
Unable to fix SS003. Code fix AssignmentContinuationIndentCodeFixProvider didn't return a Fix All action.
```

**Root Cause**: Two distinct but related issues exist:

1. **RCS0053 (Roslynator)**: External analyzer - no action required from our side
2. **SS003 (Custom Analyzer)**: Our `AssignmentContinuationIndentCodeFixProvider` fails to provide Fix All actions for certain patterns

The unstaged changes after formatting reveal the formatter is making **incorrect** indentation changes to:

-   Dictionary initializers (`new Dictionary<K,V> { { key, value } }`)
-   Collection initializers with complex elements
-   Nested object initializers assigned to properties

---

## Analysis of Current Behavior

### Pattern 1: Dictionary Initializer After Assignment (SS003 False Positive)

**Current Code (CORRECT but flagged/changed):**

```csharp
CallsByApi =
    new Dictionary<string, int>
    {                          // ← Should be +1 tab from property
        { "Key", 150 },
    },
```

**After Format (INCORRECT):**

```csharp
CallsByApi =
    new Dictionary<string, int>
{                              // ← Incorrectly de-indented
    { "Key", 150 },
},
```

### Pattern 2: `Extensions` Collection Initializer (SS003 False Positive)

**Current Code (CORRECT):**

```csharp
Extensions =
    { ["errorCode"] = result.ErrorCode },  // +1 tab from property name
```

**After Format (INCORRECT):**

```csharp
Extensions =
{ ["errorCode"] = result.ErrorCode },      // At same level as property
```

### Root Cause Analysis

The `AssignmentContinuationIndentAnalyzer.cs` currently:

1. Registers for `VariableDeclaration`, `SimpleAssignmentExpression`, and `ComplexElementInitializerExpression`
2. Correctly handles property assignments within object initializers
3. **INCORRECTLY** handles dictionary/collection initializer braces that follow `new Type` on next line

The analyzer's `CheckContinuationIndent` method calculates expected indent as `statementIndent + "\t"`, but for nested initializers within object initializers, it fails to account for:

-   Collection initializer braces `{ }` without explicit type
-   Dictionary initializer braces that are the VALUE of a property assignment

---

## Affected Files (Unstaged Changes)

| File                                      | Issue Type                                      |
| ----------------------------------------- | ----------------------------------------------- |
| `AuthController.cs`                       | `Extensions = { }` pattern (6 occurrences)      |
| `HealthControllerTests.cs`                | `new Dictionary<K,V> { }` nested in object init |
| `ThirdPartyApiRequestsControllerTests.cs` | `new Dictionary<K,V> { }` nested in object init |
| `HealthStatusResponseTests.cs`            | `new Dictionary<K,V> { }` nested in object init |
| `RateLimitingServiceTests.cs`             | `new Dictionary<K,V> { }` nested in object init |
| `ThirdPartyApiStatisticsResponseTests.cs` | `new Dictionary<K,V>()` standalone assignment   |
| `CreateClientLogCommandValidatorTests.cs` | `new Dictionary<K,V> { }` nested in object init |

---

## Implementation Tasks

### Task 1: Analyze and Fix SS003 Analyzer Detection Logic

**File**: `SeventySix.Analyzers/AssignmentContinuationIndentAnalyzer.cs`

**Problem**: The analyzer reports SS003 warnings for correctly-formatted dictionary/collection initializers.

**Changes Required**:

1. **Add detection for collection expression initializers** (lines after `=` that start with `{`)

    - When value is `InitializerExpressionSyntax` with kind `CollectionInitializerExpression`
    - The opening brace should be at `statementIndent + "\t"`, NOT same level as key

2. **Exclude implicit collection initializers from assignment continuation check**:

    ```csharp
    // In CheckContinuationIndent method
    // If value is an InitializerExpressionSyntax without preceding type
    // (e.g., Extensions = { ["key"] = value })
    // Skip the SS003 check - different rule applies
    ```

3. **Fix nested dictionary initializer handling**:
    - When `new Dictionary<K,V>` is followed by `{ }` on next line
    - The `{` should be at same level as `new`, not `+1 tab` from property

**Expected Outcome**: No SS003 warnings for correctly-indented dictionary/collection initializers.

---

### Task 2: Update CodeFixProvider for Fix All Support

**File**: `SeventySix.Analyzers/AssignmentContinuationIndentCodeFixProvider.cs`

**Problem**: `BatchFixer` fails silently when it cannot calculate correct indentation.

**Changes Required**:

1. **Improve `CalculateExpectedIndent` method**:

    ```csharp
    // Add case for InitializerExpressionSyntax (collection/dictionary init)
    if (node is InitializerExpressionSyntax initExpr
        && initExpr.Parent is ObjectCreationExpressionSyntax)
    {
        // Opening brace should align with 'new' keyword
        return GetLeadingWhitespace(initExpr.Parent.GetFirstToken());
    }
    ```

2. **Handle implicit collection initializers** (`Extensions = { }`):
    - These should NOT be modified by this analyzer
    - Return early if value is direct `InitializerExpressionSyntax` without `ObjectCreationExpressionSyntax` parent

---

### Task 3: Create Comprehensive Unit Tests

**New File**: `Tests/SeventySix.Analyzers.Tests/AssignmentContinuationIndentAnalyzerTests.cs`

**Test Cases (80/20 Rule - Focus on Critical Paths)**:

| Test Name                                                     | Description                        |
| ------------------------------------------------------------- | ---------------------------------- |
| `Analyzer_DoesNotReport_ForDictionaryInitializerInObjectInit` | Dict init nested in object init    |
| `Analyzer_DoesNotReport_ForImplicitCollectionInit`            | `Extensions = { }` pattern         |
| `Analyzer_Reports_ForIncorrectVariableAssignment`             | Basic assignment newline violation |
| `CodeFix_CorrectlyIndents_PropertyAssignment`                 | Fix property in object init        |
| `CodeFix_BatchFixer_FixesMultipleViolations`                  | Verify Fix All works               |

---

### Task 4: Verify RCS0053 External Analyzer Behavior

**Action**: Research only - no code changes

The RCS0053 warnings from Roslynator's `FixFormattingOfListCodeFixProvider` cannot be fixed by us. These are external analyzer limitations.

**Options**:

1. **Suppress** RCS0053 in `.editorconfig` for specific patterns
2. **Document** as known limitation
3. **Report issue** to Roslynator repository

**Recommendation**: Document as known limitation; the warnings don't cause incorrect formatting.

---

## Test-Driven Development Approach

### Phase 1: Write Failing Tests

1. Create test project `SeventySix.Analyzers.Tests`
2. Add test cases per Task 3
3. Verify tests fail (confirming the bug exists)

### Phase 2: Implement Fixes

1. Fix analyzer detection logic (Task 1)
2. Fix code fix provider (Task 2)
3. Run tests - verify passing

### Phase 3: Integration Verification

1. Run `npm run format:server`
2. Verify no unstaged changes to test files
3. Verify SS003 warnings eliminated

---

## Implementation Order

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Create Test Project & Write Failing Tests                │
│    └── Validates current behavior is broken                 │
├─────────────────────────────────────────────────────────────┤
│ 2. Fix AssignmentContinuationIndentAnalyzer                 │
│    └── Add exclusions for dictionary/collection init        │
├─────────────────────────────────────────────────────────────┤
│ 3. Fix AssignmentContinuationIndentCodeFixProvider          │
│    └── Improve indent calculation for nested scenarios      │
├─────────────────────────────────────────────────────────────┤
│ 4. Run Tests & Verify Format Command                        │
│    └── No unstaged changes after npm run format:server      │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

-   [ ] `npm run format:server` produces no SS003 "Unable to fix" warnings
-   [ ] No unstaged changes in test files after formatting
-   [ ] `AuthController.cs` `Extensions = { }` pattern not modified
-   [ ] Dictionary initializers maintain correct indentation
-   [ ] Unit tests pass for all scenarios

---

## Code Patterns Reference

### CORRECT: Dictionary in Object Initializer

```csharp
ThirdPartyApiStatisticsResponse response =
    new()
    {
        CallsByApi =
            new Dictionary<string, int>
            {
                { "Key", 150 },
            },
    };
```

### CORRECT: Implicit Collection Initializer

```csharp
new ProblemDetails
{
    Extensions =
        { ["errorCode"] = errorCode },
};
```

### CORRECT: Standalone Dictionary Assignment

```csharp
Dictionary<string, int> callsByApi =
    new()
    {
        { "ExternalAPI", 150 },
    };
```

---

## Risk Assessment

| Risk                                   | Likelihood | Impact | Mitigation                       |
| -------------------------------------- | ---------- | ------ | -------------------------------- |
| Breaking existing correct formatting   | Medium     | High   | Comprehensive test coverage      |
| Analyzer changes affect other projects | Low        | Medium | Isolated to SeventySix namespace |
| Performance regression in analyzer     | Low        | Low    | Avoid expensive operations       |

---

## Estimated Effort

| Task                         | Estimated Time |
| ---------------------------- | -------------- |
| Task 1: Fix Analyzer         | 2-3 hours      |
| Task 2: Fix CodeFix Provider | 1-2 hours      |
| Task 3: Unit Tests           | 2-3 hours      |
| Task 4: Documentation        | 30 minutes     |
| **Total**                    | **6-9 hours**  |

---

## Notes

-   The RCS0053 warnings are external (Roslynator) and cannot be fixed in our codebase
-   Focus on SS003 custom analyzer which we control
-   Follow TDD: tests first, then implementation
-   Keep changes minimal - KISS principle

