"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { updateChildForm, deleteChildForm, type ManagementFormState } from "@/actions/management";
import { ChildProfile } from "@/lib/types";

const initial: ManagementFormState = { ok: false, message: "" };

export function ChildEditClient({ childId, initialChild }: { childId: string; initialChild: ChildProfile }) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [updateState, updateAction, updatePending] = useActionState(updateChildForm, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteChildForm, initial);

  useEffect(() => {
    if (updateState.ok) router.push("/settings");
  }, [updateState.ok, router]);

  useEffect(() => {
    if (deleteState.ok) router.push("/settings");
  }, [deleteState.ok, router]);

  return (
    <main className="min-h-screen bg-[var(--monari-bg)] px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <p className="text-xs font-bold text-[var(--monari-ink-muted)]">아이 정보 수정</p>
            <h1 className="text-xl font-extrabold text-[var(--monari-ink)]">{initialChild.name}</h1>
          </div>
        </div>

        {/* 수정 폼 */}
        <div className="monari-card p-5 space-y-4">
          <h2 className="text-[15px] font-800 text-[var(--monari-ink)]">프로필 수정</h2>
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="childId" value={childId} />
            <div>
              <label className="mb-1.5 block text-[13px] font-700 text-[var(--monari-ink)]">이름</label>
              <input name="name" type="text" defaultValue={initialChild.name} required className="monari-input w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-700 text-[var(--monari-ink)]">
                별명 <span className="font-400 text-[var(--monari-ink-muted)]">(선택)</span>
              </label>
              <input name="nickname" type="text" defaultValue={initialChild.nickname} className="monari-input w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-700 text-[var(--monari-ink)]">출생 연도</label>
              <input
                name="birthYear"
                type="number"
                defaultValue={initialChild.birthYear}
                min="2000"
                max={new Date().getFullYear()}
                required
                className="monari-input w-full"
              />
            </div>
            {updateState.message && (
              <p className={`rounded-[12px] px-4 py-3 text-[13px] font-600 ${updateState.ok ? "bg-[#f0fdf4] text-[#166534]" : "bg-[#fff1f2] text-[#be123c]"}`}>
                {updateState.message}
              </p>
            )}
            <button type="submit" disabled={updatePending} className="monari-btn-primary w-full h-[52px] text-[15px]">
              {updatePending ? "저장 중…" : "저장하기"}
            </button>
          </form>
        </div>

        {/* 삭제 */}
        <div className="monari-card p-5 border border-[#fecaca]">
          <h2 className="text-[15px] font-800 text-[#991b1b] mb-2">아이 삭제</h2>
          <p className="text-[13px] text-[var(--monari-ink-muted)] mb-4">
            삭제하면 아이 모드에 접근할 수 없어요. 거래 내역은 보존됩니다.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-[14px] border-2 border-[#fca5a5] py-3 text-[14px] font-700 text-[#dc2626] transition active:scale-95"
            >
              아이 삭제
            </button>
          ) : (
            <form action={deleteAction} className="space-y-3">
              <input type="hidden" name="childId" value={childId} />
              <p className="rounded-[12px] bg-[#fff1f2] px-4 py-3 text-[13px] font-600 text-[#be123c]">
                정말 삭제할까요? 이 작업은 되돌리기 어려워요.
              </p>
              {deleteState.message && !deleteState.ok && (
                <p className="text-[13px] text-red-600">{deleteState.message}</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-[14px] border-2 border-[#e5e7eb] py-3 text-[14px] font-700 text-[var(--monari-ink-muted)]">
                  취소
                </button>
                <button type="submit" disabled={deletePending}
                  className="flex-1 rounded-[14px] bg-[#dc2626] py-3 text-[14px] font-700 text-white disabled:opacity-50">
                  {deletePending ? "삭제 중…" : "삭제 확인"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
