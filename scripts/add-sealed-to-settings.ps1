$serverPath = "C:\SeventySix\SeventySix.Server"
$files = Get-ChildItem -Recurse -Filter "*.cs" -Path $serverPath |
Select-String '^\s*public record \w+Settings' -List |
Select-Object -ExpandProperty Path |
Select-Object -Unique

Write-Host "Files to update: $($files.Count)"

foreach ($file in $files) {
	$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
	# Add 'sealed' after 'public record' only if 'sealed' is not already there
	$newContent = [regex]::Replace($content, '(?m)^(\s*)public record (\w+Settings)', '$1public sealed record $2')
	if ($content -ne $newContent) {
		[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
		Write-Host "Updated: $(Split-Path $file -Leaf)"
	}
}

Write-Host "Done"
