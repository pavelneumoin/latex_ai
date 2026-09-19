$ErrorActionPreference = 'Stop'
$appDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $appDir
if (-not (Test-Path -LiteralPath '.env.local')) {
    throw 'Create frontend/.env.local before starting. See LOCAL_SETUP.md.'
}
& npm.cmd run dev -- -H 127.0.0.1
exit $LASTEXITCODE
