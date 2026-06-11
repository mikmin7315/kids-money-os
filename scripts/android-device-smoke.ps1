param(
  [string]$ApkPath = "$env:USERPROFILE\.monari-release\artifacts\1.0.0\monari-1.0.0-release.apk",
  [string]$PackageId = "com.monari.family"
)

$ErrorActionPreference = "Stop"
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path -LiteralPath $adb)) {
  throw "ADB not found at $adb. Install Android SDK Platform-Tools."
}
if (-not (Test-Path -LiteralPath $ApkPath)) {
  throw "Release APK not found at $ApkPath."
}

[array]$devices = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\sdevice$" }
if ($devices.Count -ne 1) {
  throw "Connect exactly one unlocked Android device with USB debugging enabled."
}

& $adb install -r $ApkPath
if ($LASTEXITCODE -ne 0) { throw "APK installation failed." }

& $adb shell am force-stop $PackageId
& $adb shell monkey -p $PackageId -c android.intent.category.LAUNCHER 1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "App launcher smoke test failed." }

$deepLinkResult = & $adb shell am start -W -a android.intent.action.VIEW -d "${PackageId}://auth/callback?smoke=1" -p $PackageId 2>&1
if ($LASTEXITCODE -ne 0 -or ($deepLinkResult -join "`n") -notmatch "Status:\s+ok") {
  throw "Native auth callback deep link failed.`n$($deepLinkResult -join "`n")"
}

Write-Host ""
Write-Host "Automated device checks passed. Complete the manual scenarios in docs/android-device-smoke.md."
