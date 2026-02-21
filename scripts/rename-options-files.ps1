$serverPath = "C:\SeventySix\SeventySix.Server"

# Map: old filename pattern -> new filename
$renames = @(
	@{ From = "AppDataProtectionOptionsValidator.cs"; To = "DataProtectionSettingsValidator.cs"; Dir = "$serverPath\SeventySix.Api\Configuration" }
	@{ From = "DataProtectionOptions.cs"; To = "DataProtectionSettings.cs"; Dir = "$serverPath\SeventySix.Api\Configuration" }
	@{ From = "OutputCacheOptions.cs"; To = "OutputCacheSettings.cs"; Dir = "$serverPath\SeventySix.Api\Configuration" }
	@{ From = "OutputCacheOptionsValidator.cs"; To = "OutputCacheSettingsValidator.cs"; Dir = "$serverPath\SeventySix.Api\Configuration" }
	@{ From = "ResilienceOptions.cs"; To = "ResilienceSettings.cs"; Dir = "$serverPath\SeventySix.Shared\Settings" }
	@{ From = "ResilienceOptionsValidator.cs"; To = "ResilienceSettingsValidator.cs"; Dir = "$serverPath\SeventySix.Shared\Settings" }
	@{ From = "AppDataProtectionOptionsValidatorUnitTests.cs"; To = "DataProtectionSettingsValidatorUnitTests.cs"; Dir = "$serverPath\Tests\SeventySix.Api.Tests\Configuration" }
	@{ From = "OutputCacheOptionsValidatorUnitTests.cs"; To = "OutputCacheSettingsValidatorUnitTests.cs"; Dir = "$serverPath\Tests\SeventySix.Api.Tests\Configuration" }
	@{ From = "ResilienceOptionsValidatorUnitTests.cs"; To = "ResilienceSettingsValidatorUnitTests.cs"; Dir = "$serverPath\Tests\SeventySix.Shared.Tests\Validators" }
)

foreach ($r in $renames) {
	$fromPath = Join-Path $r.Dir $r.From
	$toPath = Join-Path $r.Dir $r.To
	if (Test-Path $fromPath) {
		Rename-Item -Path $fromPath -NewName $r.To -Force
		Write-Host "Renamed: $($r.From) -> $($r.To)"
	}
 else {
		Write-Host "NOT FOUND: $fromPath"
	}
}

Write-Host "File renames done."
