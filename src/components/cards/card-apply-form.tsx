"use client";

import { useState } from "react";
import { useActionState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { applyCardAction, verifyKycAction } from "@/actions/cards";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

type KycResult = { ci: string; name: string; birthDate: string; gender: string };

export function CardApplyForm({ childOptions }: { childOptions: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(applyCardAction, initial);
  const [kyc, setKyc] = useState<KycResult | null>(null);
  const [kycPending, setKycPending] = useState(false);
  const [kycError, setKycError] = useState("");

  if (state.ok) {
    return (
      <div className="rounded-[16px] bg-[var(--status-success-solid)] px-5 py-8 text-center">
        <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
        <p className="text-sm font-bold text-[var(--status-success-solid-text)]">신청이 접수됐어요!</p>
        <p className="mt-1 text-xs text-[var(--monari-done)]">카드 발급 완료 시 알림을 보내드릴게요.</p>
      </div>
    );
  }

  async function handleKyc() {
    setKycPending(true);
    setKycError("");
    try {
      const { requestIdentityVerification } = await import("@portone/browser-sdk/v2");
      const verificationId = `kyc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const result = await requestIdentityVerification({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "",
        channelKey: process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY ?? "",
        identityVerificationId: verificationId,
      });

      if (result && "code" in result && result.code) {
        setKycError(result.message ?? "본인인증에 실패했어요.");
        return;
      }

      const verified = await verifyKycAction(verificationId);
      if (!verified.ok) {
        setKycError(verified.message ?? "본인인증 결과를 확인할 수 없어요.");
        return;
      }

      setKyc({
        ci: verified.ci ?? "",
        name: verified.name ?? "",
        birthDate: verified.birthDate ?? "",
        gender: verified.gender ?? "",
      });
    } catch (e) {
      setKycError(e instanceof Error ? e.message : "본인인증 중 오류가 발생했어요.");
    } finally {
      setKycPending(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4 rounded-[16px] border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm font-extrabold text-[var(--color-text)]">카드 신청하기</p>

      {state.message && (
        <p className="text-sm font-semibold text-[var(--monari-minus)]">{state.message}</p>
      )}

      {/* 보호자 본인인증 */}
      {kyc ? (
        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--monari-done)] bg-[var(--status-success-soft)] px-3 py-2.5">
          <CheckCircle2 size={16} className="shrink-0 text-[var(--monari-done)]" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[var(--monari-done)]">본인인증 완료</p>
            <p className="text-[11px] text-[var(--monari-ink-muted)] truncate">{kyc.name} 보호자 확인됨</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleKyc}
            disabled={kycPending}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--color-accent)] py-2.5 text-sm font-bold text-[var(--color-accent)] transition active:scale-[0.98] disabled:opacity-50"
          >
            <ShieldCheck size={15} />
            {kycPending ? "인증 중..." : "보호자 본인인증"}
          </button>
          {kycError && <p className="text-[12px] font-semibold text-[var(--monari-minus)]">{kycError}</p>}
          <p className="text-[11px] text-[var(--monari-ink-muted)]">법정대리인(부모) 인증이 필요해요.</p>
        </div>
      )}

      {/* 숨겨진 KYC 필드 */}
      <input type="hidden" name="ci" value={kyc?.ci ?? ""} />

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">아이 선택 *</label>
        <select name="child_id" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm">
          {childOptions.map((c) => (
            <option key={c.id} value={c.id}>{String(c.name)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">생년월일 * <span className="font-normal">(8자리, 예: 20150301)</span></label>
        <input
          name="birth_date"
          type="text"
          inputMode="numeric"
          maxLength={8}
          placeholder="20150301"
          defaultValue={kyc?.birthDate ?? ""}
          key={kyc?.birthDate}
          required
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">성별 *</label>
        <div className="flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--color-border)] py-2 text-sm has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[var(--color-accent)] has-[:checked]:text-white">
            <input type="radio" name="gender" value="M" className="sr-only" required
              defaultChecked={kyc?.gender === "M"}
              key={`M-${kyc?.gender}`} /> 남자
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--color-border)] py-2 text-sm has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[var(--color-accent)] has-[:checked]:text-white">
            <input type="radio" name="gender" value="F" className="sr-only"
              defaultChecked={kyc?.gender === "F"}
              key={`F-${kyc?.gender}`} /> 여자
          </label>
        </div>
      </div>

      <div className="rounded-[10px] bg-[var(--monari-surface-soft)] p-3 text-xs text-[var(--color-muted)]">
        신청 전 <span className="font-bold text-[var(--color-text)]">서비스 이용약관</span> 및{" "}
        <span className="font-bold text-[var(--color-text)]">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다.
      </div>

      <button
        type="submit"
        disabled={pending || !kyc}
        className="w-full rounded-[10px] bg-[var(--color-accent)] py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "발급 중..." : !kyc ? "본인인증 후 신청 가능" : "선불카드 발급 신청"}
      </button>
    </form>
  );
}
