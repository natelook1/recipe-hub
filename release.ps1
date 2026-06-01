param(
    [ValidateSet("major","minor","patch")]
    [string]$Bump,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)
# Recipe Hub Release Script
#
# Usage:
#   .\release                        # full release: git push + backend deploy
#   .\release -Bump patch            # 1.0.0 -> 1.0.1, then full release
#   .\release -Bump minor            # 1.0.0 -> 1.1.0, then full release
#   .\release -Bump major            # 1.0.0 -> 2.0.0, then full release
#   .\release -BackendOnly           # git push + SSH deploy backend only
#   .\release -FrontendOnly          # git push only (Cloudflare Pages auto-deploys)

Set-Location $PSScriptRoot

$SERVER       = "administrator@192.168.30.67"
$REMOTE_DIR   = "/opt/recipe-hub"
$REMOTE_STACK = "$REMOTE_DIR/stack/recipe-hub.yml"
$SERVICE      = "recipe-hub_api"
$IMAGE        = "recipe-hub-api:latest"
$HEALTH_URL   = "http://localhost:3002/health"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function OK($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "    [FAIL] $msg" -ForegroundColor Red; exit 1 }
function Skip($msg) { Write-Host "    [SKIP] $msg" -ForegroundColor Yellow }

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Recipe Hub Release" -ForegroundColor Cyan
if ($BackendOnly)  { Write-Host "  Mode: Backend only" -ForegroundColor DarkCyan }
if ($FrontendOnly) { Write-Host "  Mode: Frontend only" -ForegroundColor DarkCyan }
Write-Host "============================================" -ForegroundColor Cyan

# ── 0. Version Bump ────────────────────────────────────────────────────────────

if ($Bump) {
    Step "Bumping version ($Bump)..."

    $pkg   = Get-Content "backend/package.json" -Raw | ConvertFrom-Json
    $parts = $pkg.version -split '\.'
    $major = [int]$parts[0]; $minor = [int]$parts[1]; $patch = [int]$parts[2]

    switch ($Bump) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
    }
    $newVersion = "$major.$minor.$patch"

    $backendPkg = Get-Content "backend/package.json" -Raw
    $backendPkg = $backendPkg -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$newVersion`""
    Set-Content "backend/package.json" $backendPkg -NoNewline

    $frontendPkg = Get-Content "frontend/package.json" -Raw
    $frontendPkg = $frontendPkg -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$newVersion`""
    Set-Content "frontend/package.json" $frontendPkg -NoNewline

    $settings = Get-Content "frontend/src/components/settings/SettingsPage.jsx" -Raw
    $settings = $settings -replace 'v\d+\.\d+\.\d+', "v$newVersion"
    Set-Content "frontend/src/components/settings/SettingsPage.jsx" $settings -NoNewline

    git add backend/package.json frontend/package.json frontend/src/components/settings/SettingsPage.jsx
    git commit -m "chore: bump to v$newVersion"
    if ($LASTEXITCODE -ne 0) { Fail "git commit failed" }
    OK "Bumped to v$newVersion"
}

# ── 1. Git Push ────────────────────────────────────────────────────────────────

Step "Pushing to GitHub..."
git push
if ($LASTEXITCODE -ne 0) { Fail "git push failed" }
OK "Pushed - Cloudflare Pages will deploy frontend automatically"

if ($FrontendOnly) {
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "  Done (frontend only)" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    exit 0
}

# ── 2. SSH: git pull on server ─────────────────────────────────────────────────

Step "Pulling latest code on swarm-mgr-01..."
ssh $SERVER "sudo chown -R administrator:administrator $REMOTE_DIR; git config --global --add safe.directory $REMOTE_DIR; cd $REMOTE_DIR && git pull"
if ($LASTEXITCODE -ne 0) { Fail "git pull on server failed - is the repo cloned at $REMOTE_DIR?" }
OK "Server repo up to date"

# ── 3. Build Docker image on server ───────────────────────────────────────────

Step "Building Docker image on server..."
$buildOut = ssh $SERVER "cd $REMOTE_DIR/backend && docker build --no-cache -t $IMAGE . 2>&1"
Write-Host $buildOut -ForegroundColor DarkGray
if ($LASTEXITCODE -ne 0) { Fail "docker build failed" }
OK "Image built: $IMAGE"

# ── 4. Deploy stack + force update ────────────────────────────────────────────

Step "Deploying stack..."
ssh $SERVER "docker stack deploy -c $REMOTE_STACK recipe-hub"
if ($LASTEXITCODE -ne 0) { Fail "docker stack deploy failed" }

Step "Forcing service update..."
ssh $SERVER "docker service update --force --detach=false $SERVICE"
if ($LASTEXITCODE -ne 0) { Fail "docker service update failed" }
OK "Service updated"

# ── 5. Health check ────────────────────────────────────────────────────────────

Step "Waiting for health check..."
$attempt    = 0
$maxAttempts = 20
while ($true) {
    $attempt++
    if ($attempt -gt $maxAttempts) { Fail "Health check timed out after $maxAttempts attempts" }
    $resp = ssh $SERVER "curl -sf $HEALTH_URL 2>/dev/null"
    if ($resp -match '"ok":true') {
        Write-Host "    Live after $attempt attempt(s)" -ForegroundColor Green
        break
    }
    Write-Host "    [$attempt/$maxAttempts] Not ready yet..." -ForegroundColor Gray
    Start-Sleep 3
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Release complete!" -ForegroundColor Green
Write-Host "  API : https://recipes.looknet.ca/health" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
