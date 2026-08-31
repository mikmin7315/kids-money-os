"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { registerKonaUser } from "@/lib/konaplate/cards";

export type CardFormState = { ok: boolean; message: string };

export async function applyCardAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const childId = String(formData.get("child_id") ?? "");
  const birthDate = String(formData.get("birth_date") ?? ""); // YYYYMMDD
  const gender = String(formData.get("gender") ?? "");        // M | F

  if (!childId) return { ok: false, message: "아이를 선택해주세요." };
  if (!birthDate || !/^\d{8}$/.test(birthDate))
    return { ok: false, message: "생년월일을 8자리로 입력해주세요. (예: 20150301)" };
  if (!gender || !["M", "F"].includes(gender))
    return { ok: false, message: "성별을 선택해주세요." };

  const supabase = await getSupabaseServerClient();

  // 중복 신청 체크
  const { data: existing } = await supabase
    .from("card_applications")
    .select("id, status")
    .eq("parent_id", auth.user!.id)
    .eq("child_id", childId)
    .not("status", "in", '("cancelled","rejected")')
    .maybeSingle();
  if (existing) return { ok: false, message: "이미 신청 중이거나 발급된 카드가 있어요." };

  // 아이 정보 조회
  const { data: child } = await supabase
    .from("children")
    .select("id, name")
    .eq("id", childId)
    .eq("parent_id", auth.user!.id)
    .single();
  if (!child) return { ok: false, message: "아이 정보를 찾을 수 없어요." };

  // 부모 이메일 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", auth.user!.id)
    .single();

  // DB에 신청 레코드 먼저 생성 (initiated)
  const { data: application, error: appErr } = await supabase
    .from("card_applications")
    .insert({
      parent_id: auth.user!.id,
      child_id: childId,
      status: "initiated",
      partner: "konaplate",
    })
    .select("id")
    .single();
  if (appErr || !application) return { ok: false, message: "신청에 실패했어요." };

  // 코나플레이트 회원 등록 (→ 모바일 선불카드 자동 발급)
  try {
    const konaEmail = `${childId.replace(/-/g, "").slice(0, 12)}@monari.card`;
    const kona = await registerKonaUser({
      loginId: childId.replace(/-/g, "").slice(0, 20),
      loginPassword: birthDate.slice(2), // 생년월일 6자리 (YYMMDD)
      birthDate,
      userName: child.name,
      email: profile?.email
        ? `child+${childId.slice(0, 8)}@${profile.email.split("@")[1]}`
        : konaEmail,
      nationality: "KOR",
      gender,
    });

    // 신청 상태 → submitted, external_reference에 코나 userId 저장
    await supabase
      .from("card_applications")
      .update({
        status: "submitted",
        external_reference: kona.userId,
        notes: JSON.stringify({ cardNo: kona.cardNo, expiryDate: kona.expiryDate }),
      })
      .eq("id", application.id);

    // child_cards 레코드 생성 (last4는 카드번호 끝 4자리)
    await supabase.from("child_cards").insert({
      child_id: childId,
      parent_id: auth.user!.id,
      application_id: application.id,
      status: "active",
      partner: "konaplate",
      last4: kona.cardNo.slice(-4),
      issued_at: new Date().toISOString(),
      expires_at: `20${kona.expiryDate.slice(0, 2)}-${kona.expiryDate.slice(2)}-01`,
    });

    // 연동 로그
    await supabase.from("card_integration_logs").insert({
      event_type: "user_registration",
      request: { loginId: childId.slice(0, 8), childId },
      response: { userId: kona.userId, cardNo: `****${kona.cardNo.slice(-4)}` },
      status_code: 200,
    });
  } catch (err) {
    // 코나플레이트 실패 시 신청만 남기고 에러 반환
    await supabase
      .from("card_applications")
      .update({ status: "initiated", notes: String(err) })
      .eq("id", application.id);
    await supabase.from("card_integration_logs").insert({
      event_type: "user_registration",
      request: { childId },
      error_message: String(err),
      status_code: 500,
    });
    return { ok: false, message: "카드 발급 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/cards");
  revalidatePath("/cards/status");
  return { ok: true, message: "카드 발급이 완료됐어요! 🎉" };
}

export async function toggleCardAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const cardId = String(formData.get("card_id") ?? "");
  const enabled = formData.get("is_enabled") === "true";

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_cards")
    .update({ is_enabled: enabled })
    .eq("id", cardId)
    .eq("parent_id", auth.user!.id);
  if (error) return { ok: false, message: "변경에 실패했어요." };

  revalidatePath("/cards");
  return { ok: true, message: enabled ? "카드를 활성화했어요." : "카드를 일시 정지했어요." };
}

export async function updateCardLimitsAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const cardId = String(formData.get("card_id") ?? "");
  const daily = parseInt(String(formData.get("daily_limit") ?? "0"), 10);
  const monthly = parseInt(String(formData.get("monthly_limit") ?? "0"), 10);

  if (!daily || !monthly || daily > monthly) {
    return { ok: false, message: "한도를 올바르게 입력해주세요. (일 한도 ≤ 월 한도)" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_cards")
    .update({ daily_limit: daily, monthly_limit: monthly })
    .eq("id", cardId)
    .eq("parent_id", auth.user!.id);
  if (error) return { ok: false, message: "한도 변경에 실패했어요." };

  revalidatePath("/cards");
  return { ok: true, message: "한도를 변경했어요." };
}

export async function reportCardLostAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const cardId = String(formData.get("card_id") ?? "");

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_cards")
    .update({ status: "lost", is_enabled: false })
    .eq("id", cardId)
    .eq("parent_id", auth.user!.id);
  if (error) return { ok: false, message: "분실 신고에 실패했어요." };

  revalidatePath("/cards");
  return { ok: true, message: "카드를 즉시 정지하고 분실 신고했어요." };
}
