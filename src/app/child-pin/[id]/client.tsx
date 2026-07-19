"use client";

import { useActionState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Surface } from "@/components/ui/primitives";
import { PinInput } from "@/components/ui/pin-input";
import {
  validateChildPinForm,
  enterChildModeDirectForm,
  type ManagementFormState,
} from "@/actions/management";
import { useFormStatus } from "react-dom";

const initialState: ManagementFormState = { ok: false, message: "" };

export function ChildPinClientPage({
  childId,
  hasPIN,
}: {
  childId: string;
  hasPIN: boolean;
}) {
  const router = useRouter();

  return (
    <div data-theme="child-mint" style={{ background: "#F0FEFA", minHeight: "100dvh" }}>
      <PageContainer>
        <MobileShell>
          <AppHeader eyebrow="아이 모드" title="PIN 입력" />

          <section className="mt-10 flex flex-col items-center">
            {hasPIN ? (
              <PinFormView childId={childId} onSuccess={() => router.push(`/child/${childId}`)} />
            ) : (
              <NoPinView childId={childId} onSuccess={() => router.push(`/child/${childId}`)} />
            )}

            <button
              onClick={() => router.back()}
              className="mt-6 text-sm text-[var(--color-muted)] underline"
            >
              돌아가기
            </button>
          </section>
        </MobileShell>
      </PageContainer>
    </div>
  );
}

function PinFormView({ childId, onSuccess }: { childId: string; onSuccess: () => void }) {
  const [state, action] = useActionState(validateChildPinForm, initialState);

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <div className="w-full max-w-sm space-y-4">
      <Surface className="border-[var(--color-chip-border)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,242,203,0.92))]">
        <p className="text-center font-display text-2xl font-semibold">아이 PIN을 입력해주세요</p>
        <p className="mt-3 text-center text-sm leading-6 text-[var(--color-muted)]">
          부모님이 설정한 4자리 숫자를 입력하면 내 통장 화면으로 이동합니다.
        </p>

        <form action={action} className="mt-6 space-y-6">
          <input type="hidden" name="childId" value={childId} />
          <PinInput name="pin" autoFocus />
          <PinSubmitButton />
          {state.message && !state.ok && (
            <p className="text-center text-sm font-medium text-[var(--monari-minus)]">{state.message}</p>
          )}
        </form>
      </Surface>

      <div className="rounded-[16px] bg-white/70 px-4 py-3.5 text-center text-[13px] text-[var(--color-muted)]">
        PIN을 잊었나요?{" "}
        <span className="font-700 text-[#059669]">
          부모님이 설정 → 아이 정보에서 PIN을 초기화할 수 있어요.
        </span>
      </div>
    </div>
  );
}

function NoPinView({ childId, onSuccess }: { childId: string; onSuccess: () => void }) {
  const [state, action] = useActionState(enterChildModeDirectForm, initialState);

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <Surface className="w-full max-w-sm border-[var(--color-chip-border)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,242,203,0.92))]">
      <p className="text-center font-display text-2xl font-semibold">아이 모드로 입장</p>
      <p className="mt-3 text-center text-sm leading-6 text-[var(--color-muted)]">
        아직 PIN이 설정되지 않았어요.{" "}
        <span className="font-700 text-[#059669]">바로 입장</span>하거나{" "}
        부모님 설정에서 PIN을 먼저 설정할 수 있어요.
      </p>

      <form action={action} className="mt-6">
        <input type="hidden" name="childId" value={childId} />
        <DirectEntryButton />
        {state.message && !state.ok && (
          <p className="mt-3 text-center text-sm font-medium text-[var(--monari-minus)]">{state.message}</p>
        )}
      </form>
    </Surface>
  );
}

function PinSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60"
    >
      {pending ? "확인 중..." : "입력 완료"}
    </button>
  );
}

function DirectEntryButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[#059669] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "입장 중..." : "아이 모드로 입장하기"}
    </button>
  );
}
