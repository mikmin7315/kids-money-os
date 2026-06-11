import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trimStart().startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2");
        return [line.slice(0, separator).trim(), value];
      }),
  );
}

const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.production"),
  ...loadEnvFile(".env.production.local"),
  ...process.env,
};

function required(name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function unwrap(label, request) {
  const { data, error } = await request;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

if (env.RUN_PRODUCTION_CASCADE_TEST !== "true") {
  throw new Error(
    "Account deletion verification creates and deletes production test data. Set RUN_PRODUCTION_CASCADE_TEST=true to confirm.",
  );
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const projectHost = new URL(supabaseUrl).hostname;
const expectedHost = required("EXPECTED_SUPABASE_PROJECT_HOST");

assert(projectHost === expectedHost, `Supabase host "${projectHost}" does not match EXPECTED_SUPABASE_PROJECT_HOST.`);

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const marker = Date.now();
const email = `cascade-test-${marker}@example.com`;
const password = `${randomBytes(24).toString("base64url")}Aa1!`;
let userId;
let childId;
let behaviorRuleId;

async function countRows(table, column, value) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true }).eq(column, value);
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return count ?? 0;
}

async function cleanup() {
  const attempts = [];
  if (childId) {
    attempts.push(
      admin.from("money_transactions").delete().eq("child_id", childId),
      admin.from("behavior_logs").delete().eq("child_id", childId),
      admin.from("interest_policies").delete().eq("child_id", childId),
      admin.from("borrow_conditions").delete().eq("child_id", childId),
      admin.from("wallet_snapshots").delete().eq("child_id", childId),
      admin.from("children").delete().eq("id", childId),
    );
  }
  if (behaviorRuleId) attempts.push(admin.from("behavior_rules").delete().eq("id", behaviorRuleId));
  if (userId) {
    attempts.push(admin.from("profiles").delete().eq("id", userId));
    attempts.push(admin.auth.admin.deleteUser(userId));
  }

  for (const request of attempts) {
    try {
      await request;
    } catch {
      // Best-effort cleanup must not hide the original verification failure.
    }
  }
}

async function authUserExists(id) {
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (!error) return Boolean(data?.user);
  if (error.status === 404 || error.code === "user_not_found") return false;
  throw new Error(`verify deleted auth user: ${error.message}`);
}

try {
  const created = await unwrap(
    "create test user",
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Cascade Test", consent_version: "2026-06-10" },
    }),
  );
  userId = created.user.id;

  const child = await unwrap(
    "create child",
    admin.from("children").insert({ parent_id: userId, name: "Cascade Test Child", birth_year: 2016 }).select("id").single(),
  );
  childId = child.id;

  const rule = await unwrap(
    "create behavior rule",
    admin.from("behavior_rules").insert({ parent_id: userId, title: "Cascade Test Rule", reward_amount: 100 }).select("id").single(),
  );
  behaviorRuleId = rule.id;

  const firstTransaction = await unwrap(
    "create first transaction",
    admin
      .from("money_transactions")
      .insert({ child_id: childId, tx_date: "2026-06-11", type: "allowance", amount: 1000, created_by: userId })
      .select("id")
      .single(),
  );
  await unwrap(
    "create second transaction",
    admin.from("money_transactions").insert({
      child_id: childId,
      tx_date: "2026-06-11",
      type: "spend",
      amount: 200,
      created_by: userId,
    }),
  );
  await unwrap(
    "create behavior log",
    admin.from("behavior_logs").insert({ child_id: childId, behavior_rule_id: rule.id, behavior_date: "2026-06-11" }),
  );
  await unwrap(
    "create interest policy",
    admin.from("interest_policies").insert({ parent_id: userId, child_id: childId, base_interest_rate: 3 }),
  );
  await unwrap(
    "create borrow condition",
    admin.from("borrow_conditions").insert({ parent_id: userId, child_id: childId, max_amount: 10000 }),
  );

  await unwrap("delete one transaction", admin.from("money_transactions").delete().eq("id", firstTransaction.id));
  const wallet = await unwrap(
    "read recalculated wallet",
    admin.from("wallet_snapshots").select("balance").eq("child_id", childId).maybeSingle(),
  );
  assert(wallet, "Wallet snapshot was not created for the test child.");
  assert(wallet.balance === -200, `Wallet balance after transaction deletion was ${wallet.balance}, expected -200.`);

  await unwrap("delete auth user", admin.auth.admin.deleteUser(userId));

  const checks = {
    profiles: await countRows("profiles", "id", userId),
    children: await countRows("children", "parent_id", userId),
    behavior_rules: await countRows("behavior_rules", "parent_id", userId),
    money_transactions: await countRows("money_transactions", "child_id", childId),
    behavior_logs: await countRows("behavior_logs", "child_id", childId),
    wallet_snapshots: await countRows("wallet_snapshots", "child_id", childId),
    interest_policies: await countRows("interest_policies", "child_id", childId),
    borrow_conditions: await countRows("borrow_conditions", "child_id", childId),
  };
  checks.auth_user = (await authUserExists(userId)) ? 1 : 0;

  assert(Object.values(checks).every((count) => count === 0), `Cascade left data behind: ${JSON.stringify(checks)}`);
  userId = undefined;
  console.log("account-deletion: transaction recalculation and full account cascade passed");
} finally {
  await cleanup();
}
