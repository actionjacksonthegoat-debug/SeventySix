@echo off
:: pwsh.cmd — Resolves PowerShell 7 from PATH or known install locations.
:: Used by npm scripts to ensure pwsh is found even when PATH isn't refreshed
:: (e.g. in VS Code terminals started before PowerShell 7 was installed).
::
:: Usage (from package.json): "start": "scripts/pwsh.cmd -File scripts/start-dev.ps1"

setlocal

:: Check PATH first
where pwsh >nul 2>&1
if %ERRORLEVEL% EQU 0 ( set "PWSH_EXE=pwsh" & goto :run )

:: Check known install locations
if exist "C:\Program Files\PowerShell\7\pwsh.exe" (
    set "PWSH_EXE=C:\Program Files\PowerShell\7\pwsh.exe"
    goto :run
)
if exist "C:\Program Files\PowerShell\7-preview\pwsh.exe" (
    set "PWSH_EXE=C:\Program Files\PowerShell\7-preview\pwsh.exe"
    goto :run
)

echo [ERROR] PowerShell 7 not found. Run: scripts\bootstrap.cmd
exit /b 1

:run
"%PWSH_EXE%" -ExecutionPolicy Bypass %*
exit /b %ERRORLEVEL%
