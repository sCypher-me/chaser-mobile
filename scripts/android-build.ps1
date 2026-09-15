param(
  [ValidateSet('apk', 'aab')]
  [string]$Target = 'apk'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$userProfilePath = [Environment]::GetFolderPath('UserProfile')
$localAppDataPath = [Environment]::GetFolderPath('LocalApplicationData')

$jdkCandidates = @()
if ($env:JAVA_HOME) { $jdkCandidates += $env:JAVA_HOME }
$jdkCandidates += Get-ChildItem -LiteralPath (Join-Path $userProfilePath '.jdks') -Directory -Filter '*21*' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
$jdkCandidates += 'C:\Program Files\Android\Android Studio\jbr'
$jdk = $jdkCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'bin\java.exe') } | Select-Object -First 1
if (-not $jdk) { throw 'JDK compatível não encontrado. Instale o JDK 21 ou defina JAVA_HOME.' }

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $localAppDataPath 'Android\Sdk' }
if (-not (Test-Path -LiteralPath $sdk)) { throw 'Android SDK não encontrado. Instale pelo Android Studio ou defina ANDROID_HOME.' }

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$gradleTask = if ($Target -eq 'aab') { 'bundleRelease' } else { 'assembleDebug' }

Push-Location (Join-Path $projectRoot 'android')
try { & '.\gradlew.bat' $gradleTask; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
finally { Pop-Location }
