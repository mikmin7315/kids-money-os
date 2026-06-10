import { existsSync, readFileSync } from "node:fs";

const failures = [];
const warnings = [];

function read(path) {
  return readFileSync(path, "utf8");
}

function readRequired(path) {
  if (!existsSync(path)) {
    fail(`Required release file is missing: ${path}`);
    return "";
  }
  return read(path);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    read(path)
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trimStart().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        if (separator < 0) return [line.trim(), ""];
        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2");
        return [key, value];
      }),
  );
}

const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.production"),
  ...loadEnvFile(".env.production.local"),
};
const env = { ...fileEnv, ...process.env };

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function requireValue(name) {
  const value = env[name]?.trim();
  if (!value) fail(`${name} is required.`);
  return value ?? "";
}

function requireHttpsUrl(name) {
  const value = requireValue(name);
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") fail(`${name} must use https.`);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) fail(`${name} must not use localhost.`);
    return url;
  } catch {
    fail(`${name} must be a valid URL.`);
    return null;
  }
}

const supabaseUrl = requireHttpsUrl("NEXT_PUBLIC_SUPABASE_URL");
if (supabaseUrl && !/^[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl.hostname)) {
  fail("NEXT_PUBLIC_SUPABASE_URL must be a Supabase project URL.");
}

for (const name of ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  const value = requireValue(name);
  if (value.startsWith("your-")) fail(`${name} still contains a placeholder.`);
}

const siteUrl = requireHttpsUrl("NEXT_PUBLIC_SITE_URL");
const capacitorUrl = requireHttpsUrl("CAPACITOR_SERVER_URL");
if (siteUrl && capacitorUrl && siteUrl.hostname !== capacitorUrl.hostname) {
  fail("CAPACITOR_SERVER_URL must use the same hostname as NEXT_PUBLIC_SITE_URL.");
}

const supportEmail = requireValue("NEXT_PUBLIC_SUPPORT_EMAIL");
if (supportEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) || supportEmail === "support@example.com")) {
  fail("NEXT_PUBLIC_SUPPORT_EMAIL must be a real support email address.");
}

const releaseBundleId = requireValue("RELEASE_BUNDLE_ID");
if (releaseBundleId && !/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9-]+)+$/.test(releaseBundleId)) {
  fail("RELEASE_BUNDLE_ID must be a valid reverse-domain bundle ID.");
}

const capacitorConfig = readRequired("capacitor.config.ts");
const androidGradle = readRequired("android/app/build.gradle");
const androidManifest = readRequired("android/app/src/main/AndroidManifest.xml");
const androidStrings = readRequired("android/app/src/main/res/values/strings.xml");
const iosInfo = readRequired("ios/App/App/Info.plist");
const iosProject = readRequired("ios/App/App.xcodeproj/project.pbxproj");
const packageJson = JSON.parse(readRequired("package.json") || "{}");
const androidOauthFilter = androidManifest.match(
  /<intent-filter>[\s\S]*?android:host="auth"[\s\S]*?android:pathPrefix="\/callback"[\s\S]*?<\/intent-filter>/,
)?.[0];
const iosBundleIds = [...iosProject.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((match) => match[1]);

const bundleSources = [
  ["Capacitor appId", capacitorConfig.match(/appId:\s*["']([^"']+)["']/)?.[1]],
  ["Android namespace", androidGradle.match(/namespace\s*=\s*"([^"]+)"/)?.[1]],
  ["Android applicationId", androidGradle.match(/applicationId\s+"([^"]+)"/)?.[1]],
  ["Android OAuth scheme", androidOauthFilter?.match(/android:scheme="([^"]+)"/)?.[1]],
  ["Android package_name", androidStrings.match(/<string name="package_name">([^<]+)<\/string>/)?.[1]],
  ["Android custom_url_scheme", androidStrings.match(/<string name="custom_url_scheme">([^<]+)<\/string>/)?.[1]],
  ["iOS OAuth scheme", iosInfo.match(/<key>CFBundleURLSchemes<\/key>[\s\S]*?<string>([^<]+)<\/string>/)?.[1]],
  ...iosBundleIds.map((bundleId, index) => [`iOS bundle ID #${index + 1}`, bundleId]),
];

for (const [label, value] of bundleSources) {
  if (!value) fail(`${label} could not be read.`);
  else if (releaseBundleId && value !== releaseBundleId) fail(`${label} is "${value}", expected "${releaseBundleId}".`);
}

const nativeRedirect = requireValue("NEXT_PUBLIC_NATIVE_AUTH_REDIRECT_URL");
if (releaseBundleId && nativeRedirect !== `${releaseBundleId}://auth/callback`) {
  fail(`NEXT_PUBLIC_NATIVE_AUTH_REDIRECT_URL must be ${releaseBundleId}://auth/callback.`);
}
if (!androidOauthFilter) {
  fail("Android OAuth intent filter must use host auth and pathPrefix /callback.");
}
if (!/android:usesCleartextTraffic="false"/.test(androidManifest)) {
  fail("Android must disable cleartext traffic.");
}
if (capacitorUrl && !/cleartext:\s*false/.test(capacitorConfig)) {
  fail("Capacitor server.cleartext must be false.");
}

const androidVersionName = androidGradle.match(/versionName\s+"([^"]+)"/)?.[1];
if (androidVersionName !== packageJson.version) {
  fail(`Android versionName "${androidVersionName}" does not match package.json version "${packageJson.version}".`);
}
const androidVersionCode = Number(androidGradle.match(/versionCode\s+(\d+)/)?.[1]);
if (!Number.isInteger(androidVersionCode) || androidVersionCode < 1) fail("Android versionCode must be a positive integer.");
if (androidVersionCode === 1) warn("Android versionCode is 1; keep it only for the first Play Store upload.");

const iosMarketingVersions = [...iosProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1]);
for (const [index, version] of iosMarketingVersions.entries()) {
  if (version !== packageJson.version) {
    fail(`iOS MARKETING_VERSION #${index + 1} "${version}" does not match package.json version "${packageJson.version}".`);
  }
}
const iosBuildNumbers = [...iosProject.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map((match) => Number(match[1]));
if (iosBuildNumbers.length === 0 || iosBuildNumbers.some((build) => !Number.isInteger(build) || build < 1)) {
  fail("Every iOS CURRENT_PROJECT_VERSION must be a positive integer.");
}
if (iosBuildNumbers.every((build) => build === 1)) {
  warn("iOS CURRENT_PROJECT_VERSION is 1; keep it only for the first App Store upload.");
}
if (/minifyEnabled\s+false/.test(androidGradle)) warn("Android release minification is disabled.");
if (env.SUPABASE_REDIRECT_URLS_CONFIRMED !== "true") {
  warn("Confirm the web and native OAuth redirect URLs in Supabase, then set SUPABASE_REDIRECT_URLS_CONFIRMED=true.");
}

for (const message of warnings) console.warn(`preflight warning: ${message}`);
for (const message of failures) console.error(`preflight failure: ${message}`);

if (failures.length > 0) {
  console.error(`\nRelease preflight failed with ${failures.length} blocking issue(s).`);
  process.exit(1);
}

console.log(`Release preflight passed with ${warnings.length} warning(s).`);
