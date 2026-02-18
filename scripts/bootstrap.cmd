@echo off
:: bootstrap.cmd — Windows entry point. Works with cmd.exe only (no PowerShell required).
:: Installs PowerShell 7 and Node.js (LTS) via winget if missing, then delegates to bootstrap.ps1.
::
:: USAGE (first-time setup, before npm is available):
::   scripts\bootstrap.cmd
::
:: After bootstrap completes, use npm commands:
::   npm start / npm test / etc.

setlocal

:: ============================================================
:: Step 1: Ensure PowerShell 7 is available
:: ============================================================
call :find_pwsh
if defined PWSH_EXE goto :check_node

echo.
echo  PowerShell 7 not found. Attempting installation via winget...
echo.

where winget >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :no_winget

winget install --id Microsoft.PowerShell --accept-source-agreements --accept-package-agreements
:: Refresh PATH from registry after install
call :refresh_path

call :find_pwsh
if defined PWSH_EXE goto :check_node

echo  [ERROR] PowerShell 7 install failed. Install manually: https://aka.ms/install-powershell
exit /b 1

:: ============================================================
:: Step 2: Ensure Node.js LTS is available (needed for npm commands)
:: ============================================================
:check_node
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :run

echo.
echo  Node.js not found. Installing Node.js LTS via winget...
echo.

where winget >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] winget not available. Install Node.js manually: https://nodejs.org/en/download/
    echo  Then re-run: scripts\bootstrap.cmd
    exit /b 1
)

winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
:: Refresh PATH from registry after install
call :refresh_path

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] Node.js install succeeded but not yet on PATH in this session.
    echo  Open a new terminal and re-run: scripts\bootstrap.cmd
    exit /b 1
)

:run
echo  [OK] PowerShell 7 found: %PWSH_EXE%
"%PWSH_EXE%" -ExecutionPolicy Bypass -File "%~dp0bootstrap.ps1" %*
exit /b %ERRORLEVEL%

:: ============================================================
:: Subroutines
:: ============================================================
:no_winget
echo  [ERROR] winget not available.
echo  Install PowerShell 7: https://aka.ms/install-powershell
echo  Install Node.js LTS:  https://nodejs.org/en/download/
echo  Then re-run: scripts\bootstrap.cmd
exit /b 1

:find_pwsh
where pwsh >nul 2>&1
if %ERRORLEVEL% EQU 0 ( set "PWSH_EXE=pwsh" & exit /b 0 )
if exist "C:\Program Files\PowerShell\7\pwsh.exe" ( set "PWSH_EXE=C:\Program Files\PowerShell\7\pwsh.exe" & exit /b 0 )
if exist "C:\Program Files\PowerShell\7-preview\pwsh.exe" ( set "PWSH_EXE=C:\Program Files\PowerShell\7-preview\pwsh.exe" & exit /b 0 )
exit /b 1

:refresh_path
for /f "tokens=2*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul ^| findstr /i "Path"') do set "SYS_PATH=%%B"
for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul ^| findstr /i "Path"') do set "USR_PATH=%%B"
if defined SYS_PATH set "PATH=%SYS_PATH%;%USR_PATH%;%PATH%"
exit /b 0
