import { requireParentSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { ChildPinClientPage } from "./client";

export const dynamic = "force-dynamic";

export default async function ChildPinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireParentSession();

  let hasPIN = false;
  try {
    const admin = getSupabaseAdminClient();
    const { data: child } = await admin
      .from("children")
      .select("pin_code")
      .eq("id", id)
      .maybeSingle();
    hasPIN = Boolean(child?.pin_code);
  } catch {
    hasPIN = false;
  }

  return <ChildPinClientPage childId={id} hasPIN={hasPIN} />;
}
