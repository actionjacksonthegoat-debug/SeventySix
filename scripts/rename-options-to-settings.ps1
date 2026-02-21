$serverPath = "C:\SeventySix\SeventySix.Server"
$files = Get-ChildItem -Recurse -Filter "*.cs" -Path $serverPath |
    Select-String "ResilienceOptions|OutputCacheOptions|AppDataProtectionOptions|E2ESeederOptions" -List |
    Select-Object -ExpandProperty Path |
    Select-Object -Unique

Write-Host "Files to update: $($files.Count)"

foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $newContent = $content `
        -replace '\bResilienceOptions\b', 'ResilienceSettings' `
        -replace '\bOutputCacheOptions\b', 'OutputCacheSettings' `
        -replace '\bAppDataProtectionOptions\b', 'DataProtectionSettings' `
        -replace '\bE2ESeederOptions\b', 'E2ESeederSettings'
    if ($content -ne $newContent) {
        [System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $(Split-Path $file -Leaf)"
    }
}

Write-Host "Done"
