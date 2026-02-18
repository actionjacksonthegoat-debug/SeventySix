#!/usr/bin/env bash
set -euo pipefail

# bootstrap.sh — Linux/macOS entry point. Works with bash only (no PowerShell required).
# Installs PowerShell 7 and Node.js LTS if missing, then delegates to bootstrap.ps1.
#
# USAGE (first-time setup, before npm is available):
#   bash scripts/bootstrap.sh
#
# After bootstrap completes, use npm commands:
#   npm start / npm test / etc.

install_pwsh() {
    if command -v apt-get &>/dev/null; then
        # Debian / Ubuntu (includes GitHub Actions ubuntu-latest)
        sudo apt-get update -q && sudo apt-get install -y powershell
    elif command -v dnf &>/dev/null; then
        # Fedora / RHEL 8+
        sudo dnf install -y powershell
    elif command -v yum &>/dev/null; then
        # RHEL 7 / CentOS
        sudo yum install -y powershell
    elif command -v brew &>/dev/null; then
        # macOS (Homebrew)
        brew install --cask powershell
    else
        echo '[ERROR] Cannot install PowerShell automatically on this OS.'
        echo 'Please install it manually: https://aka.ms/install-powershell'
        exit 1
    fi
}

install_node() {
    if command -v apt-get &>/dev/null; then
        # Debian / Ubuntu — use NodeSource LTS
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v dnf &>/dev/null; then
        sudo dnf install -y nodejs npm
    elif command -v yum &>/dev/null; then
        sudo yum install -y nodejs npm
    elif command -v brew &>/dev/null; then
        brew install node
    else
        echo '[ERROR] Cannot install Node.js automatically on this OS.'
        echo 'Please install it manually: https://nodejs.org/en/download/'
        exit 1
    fi
}

if ! command -v pwsh &>/dev/null; then
    echo ' PowerShell 7 not found. Installing...'
    install_pwsh
fi

if ! command -v node &>/dev/null; then
    echo ' Node.js not found. Installing Node.js LTS...'
    install_node
fi

exec pwsh -ExecutionPolicy Bypass -File "$(dirname "$0")/bootstrap.ps1" "$@"
