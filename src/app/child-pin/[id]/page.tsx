"use client";

import { useActionState, use } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Surface } from "@/components/ui/primitives";
import { validateChildPinForm, type ManagementFormState } from "@/actions/management";
import { useFormStatus } from "react-dom";

const initialState: ManagementFormState = { ok: false, message: "" };

export default function ChildPinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [state, action] = useActionState(validateChildPinForm, initialState);

  useEffect(() => {
    if (state.ok) {
      router.push(`/child/${id}`);
    }
  }, [state.ok, id, router]);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="아이 모드" title="PIN 입력" />

        <section className="mt-12 flex flex-col items-center">
          <Surface className="w-full max-w-sm">
            <p className="text-center text-lg font-semibold">아이 PIN을 입력해주세요</p>
            <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
              부모님이 설정한 4자리 숫자를 입력합니다.
            </p>

            <form action={action} className="mt-6 space-y-4">
              <input type="hidden" name="childId" value={id} />
              <input
                name="pin"
                type="password"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete="off"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-center text-2xl tracking-[0.5em] text-[var(--color-text)]"
                placeholder="••••"
              />
              <PinSubmitButton />
              {state.message && !state.ok && (
                <p className="text-center text-sm text-rose-700">{state.message}</p>
              )}
            </form>
          </Surface>

          <button
            onClick={() => router.back()}
            className="mt-6 text-sm text-[var(--color-muted)] underline"
          >
            돌아가기
          </button>
        </section>
      </MobileShell>
    </PageContainer>
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
