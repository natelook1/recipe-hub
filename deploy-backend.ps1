#!/usr/bin/env pwsh
# Deploy Recipe Hub backend to swarm-mgr-01

$SERVER       = "administrator@192.168.30.67"
$REMOTE_TMP   = "/tmp/recipe-hub-deploy"
$REMOTE_STACK = "/opt/appdata/stacks/recipe-hub.yml"
$SERVICE      = "recipe-hub_api"
$IMAGE        = "recipe-hub-api:latest"
$HEALTH_URL   = "http://localhost:3002/health"

Write-Host "`n=== Recipe Hub Deploy ===" -ForegroundColor Cyan

Write-Host "[1/5] Clearing remote staging area..." -ForegroundColor Yellow
ssh $SERVER "rm -rf $REMOTE_TMP && mkdir -p $REMOTE_TMP"

Write-Host "[2/5] Uploading source..." -ForegroundColor Yellow
scp "backend/Dockerfile"    "${SERVER}:${REMOTE_TMP}/"
scp "backend/package.json"  "${SERVER}:${REMOTE_TMP}/"
scp "backend/server.js"     "${SERVER}:${REMOTE_TMP}/"
scp "backend/gemini.js"     "${SERVER}:${REMOTE_TMP}/"
scp "stack/recipe-hub.yml"  "${SERVER}:/tmp/recipe-hub.yml"
ssh $SERVER "sudo mv /tmp/recipe-hub.yml $REMOTE_STACK"

Write-Host "[3/5] Building Docker image..." -ForegroundColor Yellow
$buildResult = ssh $SERVER "cd $REMOTE_TMP && docker build --no-cache -t $IMAGE . 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build FAILED:" -ForegroundColor Red
    Write-Host $buildResult
    exit 1
}
Write-Host "  Build OK" -ForegroundColor Green

Write-Host "[4/5] Deploying stack..." -ForegroundColor Yellow
ssh $SERVER "docker stack deploy -c $REMOTE_STACK recipe-hub 2>&1 && docker service update --force $SERVICE 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "[5/5] Waiting for health check..." -ForegroundColor Yellow
$attempt = 0
$maxAttempts = 20
while ($true) {
    $attempt++
    if ($attempt -gt $maxAttempts) {
        Write-Host "  Health check timed out after $maxAttempts attempts" -ForegroundColor Red
        exit 1
    }
    try {
        $resp = ssh $SERVER "curl -sf $HEALTH_URL" 2>$null
        if ($resp -match '"ok":true') {
            Write-Host "  Live after $attempt attempt(s)" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "  [$attempt/$maxAttempts] Not ready..." -ForegroundColor Gray
    Start-Sleep 3
}

Write-Host "`nDeploy complete!" -ForegroundColor Green
Write-Host "API: https://recipes.looknet.ca/health" -ForegroundColor Cyan
