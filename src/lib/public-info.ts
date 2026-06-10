export const policyEffectiveDate = "2026년 6월 10일";

export function getSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null;
}
