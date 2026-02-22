$files = @(
	"C:\SeventySix\docker-compose.e2e.yml",
	"C:\SeventySix\docker-compose.loadtest.yml"
)

foreach ($file in $files) {
	$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
	$newLines = foreach ($line in $lines) {
		# Convert leading 4-space groups to 2-space
		if ($line -match '^( +)') {
			$leading = $matches[1]
			$rest = $line.Substring($leading.Length)
			# Count groups of 4 spaces
			$fourGroups = [Math]::Floor($leading.Length / 4)
			$remainder = $leading.Length % 4
			$newLeading = ("  " * $fourGroups) + (" " * $remainder)
			$newLeading + $rest
		}
		else {
			$line
		}
	}
	[System.IO.File]::WriteAllLines($file, $newLines, [System.Text.Encoding]::UTF8)
	Write-Host "Re-indented: $(Split-Path $file -Leaf)"
}

Write-Host "Done"
