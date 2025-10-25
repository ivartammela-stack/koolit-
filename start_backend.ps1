Param(
    [string]$BackendRel = "emotsioonid-backend",
    [string]$Port = "8000",
    [switch]$FreshInstall,
    [switch]$NoMigrate,
    [switch]$Debug
)

function Info($m){ Write-Host "[INFO] $m" }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

$Root = $PSScriptRoot
if(-not $Root){ $Root = Split-Path -Parent $MyInvocation.MyCommand.Path }

$backendDir = Join-Path $Root $BackendRel
if(-not (Test-Path $backendDir)){ Err ("Backend folder not found: {0}" -f $backendDir); exit 1 }
Set-Location -Path $backendDir

# Python lookup
$py = $null; $cands = @("py -3","py","python","python3")
foreach($c in $cands){ try{ $v = & $ExecutionContext.InvokeCommand.ExpandString("$c") --version 2>$null; if($LASTEXITCODE -eq 0){ $py = $c; break } }catch{} }
if(-not $py){ Err "Python not found in PATH."; exit 1 }

# venv
if(-not (Test-Path ".venv")){
  Info "Creating venv..."; & $ExecutionContext.InvokeCommand.ExpandString("$py") -m venv .venv; if($LASTEXITCODE -ne 0){ Err "venv failed"; exit 1 }
}
. ".\.venv\Scripts\Activate.ps1" 2>$null
if($LASTEXITCODE -ne 0){ Err "venv activate failed"; exit 1 }

Info "Upgrading pip..."
python -m pip install --upgrade pip

# requirements.txt
$req = Join-Path $backendDir "requirements.txt"
if($FreshInstall -and (Test-Path $req)){
  Info ("Installing deps from: {0}" -f $req); pip install -r $req
} elseif(-not (Test-Path $req)){
  Warn "requirements.txt not found -- installing minimal Django stack"; pip install django djangorestframework
} else {
  Info "Skipping deps (use -FreshInstall to force)"
}

# manage.py
$manage = Get-ChildItem -Path $backendDir -Filter "manage.py" -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
if(-not $manage){ Err "manage.py not found under backend folder"; exit 1 }
Set-Location -Path $manage.DirectoryName

# .env
if(Test-Path ".env"){
  Info "Loading .env..."
  Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if([string]::IsNullOrWhiteSpace($line)){ return }
    if($line.StartsWith("#")){ return }
    $i = $line.IndexOf("=")
    if($i -gt 0){
      $n = $line.Substring(0,$i).Trim()
      $v = $line.Substring($i+1).Trim().Trim('"')
      [Environment]::SetEnvironmentVariable($n,$v,"Process")
      if($Debug){ Write-Host ("  set {0}={1}" -f $n, $v) -ForegroundColor DarkGray }
    }
  }
}

# migrations
if(-not $NoMigrate){
  Info "Running migrations..."
  python manage.py makemigrations; if($LASTEXITCODE -ne 0){ Err "makemigrations failed"; exit 1 }
  python manage.py migrate; if($LASTEXITCODE -ne 0){ Err "migrate failed"; exit 1 }
}else{ Info "Skipping migrations (-NoMigrate)" }

Info ("Starting server: http://127.0.0.1:{0}/" -f $Port)
python manage.py runserver ("0.0.0.0:{0}" -f $Port)
