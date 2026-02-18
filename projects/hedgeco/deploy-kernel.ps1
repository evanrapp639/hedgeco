# HedgeCo Kernel Deployment Script for Windows
# Run in PowerShell as Administrator

Write-Host "🚀 HedgeCo Kernel Deployment" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check for npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Install Node.js first." -ForegroundColor Red
    exit 1
}

# Get Upstash credentials
Write-Host "`n🔑 Upstash Configuration" -ForegroundColor Yellow
$redisHost = Read-Host "Enter Redis Host (clever-ladybird-59195.upstash.io)"
$redisPort = Read-Host "Enter Redis Port (6379)"
$redisPassword = Read-Host "Enter Redis Password (Token from Upstash)" -AsSecureString
$redisPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($redisPassword)
)

# Generate API keys
Write-Host "`n🔐 Generating API Keys..." -ForegroundColor Yellow
$keys = @()
for ($i = 1; $i -le 5; $i++) {
    $key = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
    $keys += $key
    Write-Host "Key $i : $key" -ForegroundColor Cyan
}

$apiKeys = $keys -join ","

# Install Railway CLI
Write-Host "`n📦 Installing Railway CLI..." -ForegroundColor Yellow
npm install -g @railway/cli
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
    exit 1
}

# Login to Railway
Write-Host "`n🔐 Logging into Railway..." -ForegroundColor Yellow
railway login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway login failed" -ForegroundColor Red
    exit 1
}

# Navigate to kernel
$kernelPath = "$env:USERPROFILE\.openclaw\workspace\projects\hedgeco\apps\kernel"
if (-not (Test-Path $kernelPath)) {
    Write-Host "❌ Kernel path not found: $kernelPath" -ForegroundColor Red
    exit 1
}

Set-Location $kernelPath
Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Green

# Initialize Railway project
Write-Host "`n🏗️ Initializing Railway project..." -ForegroundColor Yellow
railway init --name hedgeco-kernel --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway init failed" -ForegroundColor Red
    exit 1
}

# Set environment variables
Write-Host "`n⚙️ Setting environment variables..." -ForegroundColor Yellow
railway variables set REDIS_HOST=$redisHost
railway variables set REDIS_PORT=$redisPort
railway variables set REDIS_PASSWORD=$redisPasswordPlain
railway variables set API_KEYS=$apiKeys
railway variables set ALLOWED_ORIGINS="*"
railway variables set PORT="3001"

# Deploy
Write-Host "`n🚀 Deploying to Railway..." -ForegroundColor Yellow
railway deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Get deployment URL
Write-Host "`n🌐 Getting deployment URL..." -ForegroundColor Yellow
$status = railway status --json | ConvertFrom-Json
$url = $status.service.domain

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "Kernel URL: https://$url" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Test Commands:" -ForegroundColor Yellow
Write-Host "Test health: curl https://$url/health" -ForegroundColor White
Write-Host ""
Write-Host "Test action (replace KEY1 with Scooby's key):" -ForegroundColor White
Write-Host "curl -X POST https://$url/action \`" -ForegroundColor Gray
Write-Host "  -H `"X-Agent: scooby`" \`" -ForegroundColor Gray
Write-Host "  -H `"Authorization: Bearer $($keys[0])`" \`" -ForegroundColor Gray
Write-Host "  -H `"Content-Type: application/json`" \`" -ForegroundColor Gray
Write-Host "  -d '{`"agent`":`"scooby`",`"action`":`"test`",`"entityId`":`"test`",`"data`":{}}'" -ForegroundColor Gray
Write-Host ""
Write-Host "🔑 Your API Keys (save these!):" -ForegroundColor Yellow
for ($i = 0; $i -lt $keys.Count; $i++) {
    $agent = @("Scooby", "Shaggy", "Daphne", "Velma", "Fred")[$i]
    Write-Host "$agent : $($keys[$i])" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "⚠️  Save these keys securely! You can't retrieve them later." -ForegroundColor Red
Write-Host "📝 Next: Update web app to use kernel URL" -ForegroundColor Green

# Clean up password from memory
$redisPasswordPlain = $null
[GC]::Collect()