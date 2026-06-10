# Android Release Build

Monari uses `com.monari.family` as the Android application ID. Release builds
enable R8 minification and are signed only when all four signing environment
variables are present:

```powershell
$env:MONARI_UPLOAD_STORE_FILE = "C:\absolute\path\to\monari-upload.jks"
$env:MONARI_UPLOAD_STORE_PASSWORD = "<store password>"
$env:MONARI_UPLOAD_KEY_ALIAS = "monari-upload"
$env:MONARI_UPLOAD_KEY_PASSWORD = "<key password>"
```

Never commit the keystore or its passwords. Keep an encrypted backup of the
upload keystore outside the repository. Losing the upload key can block future
Play Store updates until Google approves an upload-key reset.

Build a signed Android App Bundle:

```powershell
$env:CAPACITOR_SERVER_URL = "https://kids-money-os.vercel.app"
npm run native:sync

# Adjust JAVA_HOME when Android Studio is installed somewhere else.
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
Set-Location android
.\gradlew.bat clean bundleRelease
```

The generated bundle is:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Build a signed APK for device smoke testing:

```powershell
.\gradlew.bat assembleRelease
```

The generated APK is
`android/app/build/outputs/apk/release/app-release.apk`.

Keep the matching R8 mapping file from
`android/app/build/outputs/mapping/release/mapping.txt` with each uploaded
release.

Increment `versionCode` before every Play Store upload after the initial
version 1 release.
