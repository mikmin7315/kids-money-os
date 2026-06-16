import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) {
    args.set(key, "true");
  } else {
    args.set(key, next);
    i += 1;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const email = String(args.get("email") ?? process.env.MONARI_ADMIN_EMAIL ?? "").trim().toLowerCase();
const name = String(args.get("name") ?? process.env.MONARI_ADMIN_NAME ?? "Monari Admin").trim();
const shouldCreate = args.has("create");
const password = process.env.MONARI_ADMIN_PASSWORD;

if (!email) {
  fail("Usage: npm run admin:ensure -- --email owner@example.com");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const user = await findUserByEmail(email);
let userId = user?.id;

if (!userId) {
  if (!shouldCreate) {
    fail(`No Supabase Auth user found for ${email}. Sign up first, or rerun with --create and MONARI_ADMIN_PASSWORD.`);
  }

  if (!password || password.length < 12) {
    fail("MONARI_ADMIN_PASSWORD must be set to at least 12 characters when using --create.");
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !data.user) {
    fail(`Failed to create admin auth user: ${error?.message ?? "unknown error"}`);
  }

  userId = data.user.id;
  console.log(`Created Supabase Auth user: ${email}`);
}

const { data: existingProfile, error: existingProfileError } = await admin
  .from("profiles")
  .select("id")
  .eq("id", userId)
  .maybeSingle();

if (existingProfileError) {
  fail(`Failed to read existing profile: ${existingProfileError.message}`);
}

const { error: profileError } = existingProfile
  ? await admin
      .from("profiles")
      .update({
        role: "admin",
        email,
        name,
      })
      .eq("id", userId)
  : await admin.from("profiles").insert({
      id: userId,
      role: "admin",
      email,
      name,
      consent_version: "admin",
      consent_at: new Date().toISOString(),
    });

if (profileError) {
  fail(`Failed to upsert admin profile: ${profileError.message}`);
}

const { data: profile, error: readError } = await admin
  .from("profiles")
  .select("id, email, name, role")
  .eq("id", userId)
  .single();

if (readError || profile?.role !== "admin") {
  fail(`Admin verification failed: ${readError?.message ?? "profile role is not admin"}`);
}

console.log(`Admin ready: ${profile.email} (${profile.id})`);

async function findUserByEmail(targetEmail) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail(`Failed to list auth users: ${error.message}`);

    const match = data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail);
    if (match) return match;
    if (data.users.length < 1000) return null;
  }

  fail("Too many users to scan safely. Narrow this script before continuing.");
}

function loadEnvFile(fileName) {
  const file = resolve(process.cwd(), fileName);
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
