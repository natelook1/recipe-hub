param(
    [ValidateSet("major","minor","patch")]
    [string]$Bump,
    [switch]$SkipDeploy
)
# Recipe Hub Release Script
# Bumps version, builds frontend, deploys backend to swarm
#
# Usage:
#   .\release                     # deploy current build, no version bump
#   .\release -Bump patch         # 1.0.0 -> 1.0.1
#   .\release -Bump minor         # 1.0.0 -> 1.1.0
#   .\release -Bump major         # 1.0.0 -> 2.0.0
#   .\release -SkipDeploy         # bump + push frontend only

Set-Location $PSScriptRoot

$SERVER      = "administrator@192.168.30.67"
$SERVICE     = "recipe-hub_api"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function OK($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "    [FAIL] $msg" -ForegroundColor Red; exit 1 }

# ── 0. Version Bump ────────────────────────────────────────────────────────────

if ($Bump) {
    Step "Bumping version ($Bump)..."

    # Read from backend/package.json
    $pkg = Get-Content "backend/package.json" -Raw | ConvertFrom-Json
    $parts = $pkg.version -split '\.'
    $major = [int]$parts[0]; $minor = [int]$parts[1]; $patch = [int]$parts[2]

    switch ($Bump) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
    }
    $newVersion = "$major.$minor.$patch"

    # Update backend/package.json
    $backendPkg = Get-Content "backend/package.json" -Raw
    $backendPkg = $backendPkg -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$newVersion`""
    Set-Content "backend/package.json" $backendPkg -NoNewline

    # Update frontend/package.json
    $frontendPkg = Get-Content "frontend/package.json" -Raw
    $frontendPkg = $frontendPkg -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$newVersion`""
    Set-Content "frontend/package.json" $frontendPkg -NoNewline

    # Update SettingsPage version display
    $settings = Get-Content "frontend/src/components/settings/SettingsPage.jsx" -Raw
    $settings = $settings -replace 'v\d+\.\d+\.\d+', "v$newVersion"
    Set-Content "frontend/src/components/settings/SettingsPage.jsx" $settings -NoNewline

    Write-Host "    Bumped to v$newVersion" -ForegroundColor Green

    git add backend/package.json frontend/package.json frontend/src/components/settings/SettingsPage.jsx
    git commit -m "chore: bump to v$newVersion"
    if ($LASTEXITCODE -ne 0) { Fail "git commit failed" }
    OK "Version bumped to v$newVersion"
}

# ── 1. Build Frontend ──────────────────────────────────────────────────────────

Step "Building frontend..."
Push-Location frontend
npm run build 2>&1
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm run build failed" }
Pop-Location
OK "Frontend built (dist/)"

# ── 2. Git Push ────────────────────────────────────────────────────────────────

Step "Pushing to GitHub..."
git push
if ($LASTEXITCODE -ne 0) { Fail "git push failed" }
OK "Pushed (Cloudflare Pages will deploy frontend automatically)"

# ── 3. Deploy Backend ─────────────────────────────────────────────────────────

if (-not $SkipDeploy) {
    Step "Deploying backend to swarm..."
    & "$PSScriptRoot\deploy-backend.ps1"
    if ($LASTEXITCODE -ne 0) { Fail "deploy-backend.ps1 failed" }
    OK "Backend deployed"
} else {
    Write-Host "`n    [SKIP] Backend deploy skipped" -ForegroundColor Yellow
}

Write-Host "`n=============================" -ForegroundColor Green
Write-Host "  Release complete!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
