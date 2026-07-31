import { requireParentSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { ChildPinClientPage } from "./client";

export const dynamic = "force-dynamic";

export default async function ChildPinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireParentSession();

  let hasPIN = false;
  let dbError = false;
  try {
    const admin = getSupabaseAdminClient();
    const { data: child, error } = await admin
      .from("children")
      .select("pin_code")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      dbError = true;
    } else {
      hasPIN = Boolean(child?.pin_code);
    }
  } catch {
    dbError = true;
  }

  return <ChildPinClientPage childId={id} hasPIN={hasPIN} dbError={dbError} />;
}
