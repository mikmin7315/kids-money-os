"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function cancelSubscriptionAction(): Promise<{ ok: boolean; message: string }> {
  const auth = await requireParentSession();

  const profile = auth.profile as {
    subscription_tier?: string;
    subscription_cancelled_at?: string | null;
  } | null;

  if (profile?.subscription_tier !== "plus") {
    return { ok: false, message: "활성 구독이 없어요." };
  }

  if (profile?.subscription_cancelled_at) {
    return { ok: false, message: "이미 해지 신청이 완료된 구독이에요." };
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await adminSupabase
    .from("profiles")
    .update({ subscription_cancelled_at: new Date().toISOString() })
    .eq("id", auth.user!.id);

  if (error) return { ok: false, message: "해지 처리 중 오류가 발생했어요." };

  revalidatePath("/settings/subscription");
  return {
    ok: true,
    message: "구독 해지 신청이 완료됐어요. 이용 기간이 끝날 때까지 플러스 기능을 계속 사용할 수 있어요.",
  };
}
