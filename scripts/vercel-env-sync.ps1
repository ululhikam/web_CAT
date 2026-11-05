<#
.SYNOPSIS
  Menyalin variabel environment dari .env repo ke satu project Vercel.

.DESCRIPTION
  Dipakai untuk menyiapkan project `tes-cat-api`. Nilai yang di-push diambil
  dari `.env` di root repo, dengan beberapa penimpaan yang wajib untuk produksi:

    APP_URL   -> https://tes-cat-mu.vercel.app
    API_URL   -> https://tes-cat-api.vercel.app
    NODE_ENV  -> production

  COOKIE_DOMAIN sengaja TIDAK dikirim: web mem-proxy /api ke project API,
  sehingga cookie harus host-only pada domain web (tes-cat-mu.vercel.app).

.EXAMPLE
  pwsh -File scripts/vercel-env-sync.ps1 -Project tes-cat-api -LinkDir apps/api
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Project,
  [Parameter(Mandatory = $true)][string]$LinkDir,
  [string[]]$Targets = @('production'),
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw "Tidak menemukan $envFile" }

$linkPath = Join-Path $repoRoot $LinkDir
$projectJson = Join-Path $linkPath '.vercel\\project.json'
if (-not (Test-Path -LiteralPath $projectJson)) {
  throw "Belum ada .vercel/project.json di $linkPath. Jalankan 'vercel link --project $Project' di sana dulu."
}

# Baca .env
$values = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
  $name, $raw = $line -split '=', 2
  $name = $name.Trim()
  if (-not $name) { continue }
  $value = $raw.Trim()
  if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  $values[$name] = $value
}

# Penimpaan untuk produksi
$values['NODE_ENV'] = 'production'
$values['APP_URL'] = 'https://tes-cat-mu.vercel.app'
$values['API_URL'] = 'https://tes-cat-api.vercel.app'
$values['MAIL_FROM'] = $values['EMAIL_FROM']
$values.Remove('EMAIL_FROM')
$values.Remove('COOKIE_DOMAIN')
foreach ($skip in @('PORT', 'ALLOW_REMOTE_DB', 'CONFIRM_DATABASE', 'SHADOW_DATABASE_URL',
    'DATABASE_URL_TEST', 'SEED_DEMO_USERS', 'BOOTSTRAP_SUPER_ADMIN_EMAIL',
    'BOOTSTRAP_SUPER_ADMIN_PASSWORD', 'BOOTSTRAP_SUPER_ADMIN_NAME',
    'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD', 'BOOTSTRAP_ADMIN_NAME',
    'MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY', 'MIDTRANS_IS_PRODUCTION')) {
  $values.Remove($skip)
}

$names = @($values.Keys | Sort-Object)
# `TZ` disediakan platform Vercel dan tidak boleh ditimpa.
$names = $names | Where-Object { $_ -ne 'TZ' }
$scope = 'hikkkammmms-projects'

Push-Location -LiteralPath $linkPath
try {
  foreach ($target in $Targets) {
    foreach ($name in $names) {
      $value = $values[$name]
      if ([string]::IsNullOrEmpty($value)) {
        Write-Host "skip  $name (kosong)" -ForegroundColor DarkYellow
        continue
      }
      if ($DryRun) {
        Write-Host "dry   $name -> $target ($($value.Length) char)"
        continue
      }
      $previous = $ErrorActionPreference
      $ErrorActionPreference = 'Continue'
      & vercel env add $name $target --value $value --yes --force --scope $scope 2>$null | Out-Null
      $exitCode = $LASTEXITCODE
      $ErrorActionPreference = $previous
      if ($exitCode -ne 0) { throw "Gagal menambah $name untuk $target (exit $exitCode)" }
      Write-Host "ok    $name -> $target" -ForegroundColor Green
    }
  }
}
finally {
  Pop-Location
}
