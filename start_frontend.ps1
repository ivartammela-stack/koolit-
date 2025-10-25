Param(
    [string]$FrontendRel = "emotsioonid-frontend"
)

function Info($m){ Write-Host "[INFO] $m" }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

$Root = $PSScriptRoot
if(-not $Root){ $Root = Split-Path -Parent $MyInvocation.MyCommand.Path }

$frontDir = Join-Path $Root $FrontendRel
if(-not (Test-Path $frontDir)){ Err ("Frontend folder not found: {0}" -f $frontDir); exit 1 }
if(-not (Test-Path (Join-Path $frontDir "package.json"))){ Err "package.json not found in frontend folder"; exit 1 }

Set-Location -Path $frontDir

# npm presence
$npmOK = $true
try { npm -v | Out-Null } catch { $npmOK = $false }
if(-not $npmOK){ Err "npm not found in PATH. Install Node.js LTS." ; exit 1 }

if(-not (Test-Path "node_modules")){
  Info "Installing frontend deps (npm install)..."
  npm install
}

Info "Starting Vite (npm run dev)..."
npm run dev
