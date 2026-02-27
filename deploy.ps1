# QuickChat Convex Deployment Script
# Usage: .\deploy.ps1 -DeployKey "your_key_here"

param(
    [string]$DeployKey = ""
)

# If no deploy key provided as parameter, try to get from environment or prompt
if (-not $DeployKey) {
    $DeployKey = $env:CONVEX_DEPLOY_KEY
}

if (-not $DeployKey -or $DeployKey -eq "your_convex_deploy_key_here") {
    Write-Host "Error: CONVEX_DEPLOY_KEY is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your deploy key:" -ForegroundColor Yellow
    Write-Host "1. Go to https://dashboard.convex.dev/" -ForegroundColor White
    Write-Host "2. Select your project (astute-ostrich-773)" -ForegroundColor White
    Write-Host "3. Click Settings (gear icon) -> Environment Variables" -ForegroundColor White
    Write-Host "4. Find the Deploy section and copy your deployment key" -ForegroundColor White
    Write-Host "5. Run: .\deploy.ps1 -DeployKey 'your_key_here'" -ForegroundColor White
    exit 1
}

# Set the environment variable
$env:CONVEX_DEPLOY_KEY = $DeployKey

Write-Host "Deploying to Convex..." -ForegroundColor Green

# Run convex deploy
npx convex deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
