$serverPath = "C:\SeventySix\SeventySix.Server"
$files = Get-ChildItem -Recurse -Filter "*.cs" -Path $serverPath |
    Select-String "OptionsValidator|Options\.cs|ResilienceOptions|OutputCacheOptions|AppDataProtectionOptions|E2ESeederOptions" -List |
    Select-Object -ExpandProperty Path |
    Select-Object -Unique

Write-Host "Files to update: $($files.Count)"

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $newContent = $content `
        -replace '\bResilienceOptionsValidator\b', 'ResilienceSettingsValidator' `
        -replace '\bOutputCacheOptionsValidator\b', 'OutputCacheSettingsValidator' `
        -replace '\bAppDataProtectionOptionsValidator\b', 'DataProtectionSettingsValidator' `
        -replace 'ResilienceOptions\.cs', 'ResilienceSettings.cs' `
        -replace 'OutputCacheOptions\.cs', 'OutputCacheSettings.cs' `
        -replace 'DataProtectionOptions\.cs', 'DataProtectionSettings.cs' `
        -replace 'AppDataProtectionOptionsValidator\.cs', 'DataProtectionSettingsValidator.cs' `
        -replace 'ResilienceOptionsValidator\.cs', 'ResilienceSettingsValidator.cs' `
        -replace 'OutputCacheOptionsValidator\.cs', 'OutputCacheSettingsValidator.cs' `
        -replace 'AppDataProtectionOptionsValidatorUnitTests\.cs', 'DataProtectionSettingsValidatorUnitTests.cs' `
        -replace 'ResilienceOptionsValidatorUnitTests\.cs', 'ResilienceSettingsValidatorUnitTests.cs' `
        -replace 'OutputCacheOptionsValidatorUnitTests\.cs', 'OutputCacheSettingsValidatorUnitTests.cs'
    if ($content -ne $newContent) {
        [System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $(Split-Path $file -Leaf)"
    }
}

Write-Host "Done"
