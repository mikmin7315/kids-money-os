"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateChildForm,
  deleteChildForm,
  setChildPinForm,
  clearChildPinForm,
  type ManagementFormState,
} from "@/actions/management";
import { ChildProfile } from "@/lib/types";

const initial: ManagementFormState = { ok: false, message: "" };

export function ChildEditClient({ childId, initialChild }: { childId: string; initialChild: ChildProfile }) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPinReset, setShowPinReset] = useState(false);

  const [updateState, updateAction, updatePending] = useActionState(updateChildForm, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteChildForm, initial);
  const [setPinState, setPinAction, setPinPending] = useActionState(setChildPinForm, initial);
  const [clearPinState, clearPinAction, clearPinPending] = useActionState(clearChildPinForm, initial);

  useEffect(() => {
    if (updateState.ok) router.push("/settings");
  }, [updateState.ok, router]);

  useEffect(() => {
    if (deleteState.ok) router.push("/settings");
  }, [deleteState.ok, router]);

  return (
    <div className="space-y-6">
        {/* 수정 폼 */}
        <div className="monari-card p-5 space-y-4">
          <h2 className="text-[15px] font-extrabold text-[var(--monari-ink)]">프로필 수정</h2>
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="childId" value={childId} />
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[var(--monari-ink)]">이름</label>
              <input name="name" type="text" defaultValue={initialChild.name} required className="monari-input w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[var(--monari-ink)]">
                별명 <span className="font-400 text-[var(--monari-ink-muted)]">(선택)</span>
              </label>
              <input name="nickname" type="text" defaultValue={initialChild.nickname} className="monari-input w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[var(--monari-ink)]">출생 연도</label>
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
              <p className={`rounded-[12px] px-4 py-3 text-[13px] font-semibold ${updateState.ok ? "bg-[var(--status-success-solid)] text-[#166534]" : "bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)]"}`}>
                {updateState.message}
              </p>
            )}
            <button type="submit" disabled={updatePending} className="monari-btn-primary w-full h-[52px] text-[15px]">
              {updatePending ? "저장 중…" : "저장하기"}
            </button>
          </form>
        </div>

        {/* PIN 관리 */}
        <div className="monari-card p-5 space-y-4">
          <h2 className="text-[15px] font-extrabold text-[var(--monari-ink)]">아이 모드 PIN</h2>
          <p className="text-[13px] text-[var(--monari-ink-muted)]">
            아이가 PIN을 입력해 아이 통장에 접근해요. PIN이 없으면 바로 입장됩니다.
          </p>

          {/* PIN 설정 */}
          <form action={setPinAction} className="space-y-3">
            <input type="hidden" name="childId" value={childId} />
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[var(--monari-ink)]">새 PIN 설정</label>
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                minLength={4}
                pattern="\d{4}"
                placeholder="4자리 숫자"
                required
                className="monari-input w-full"
              />
            </div>
            {setPinState.message && (
              <p className={`rounded-[12px] px-4 py-3 text-[13px] font-semibold ${setPinState.ok ? "bg-[var(--status-success-solid)] text-[#166534]" : "bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)]"}`}>
                {setPinState.message}
              </p>
            )}
            <button type="submit" disabled={setPinPending} className="monari-btn-primary w-full h-[46px] text-[14px]">
              {setPinPending ? "설정 중…" : "PIN 설정하기"}
            </button>
          </form>

          {/* PIN 초기화 */}
          <div className="border-t border-[var(--monari-line)] pt-4">
            {!showPinReset ? (
              <button
                type="button"
                onClick={() => setShowPinReset(true)}
                className="w-full rounded-[14px] border-2 border-[var(--monari-line-strong)] py-2.5 text-[13px] font-bold text-[var(--monari-ink-muted)] transition active:scale-95"
              >
                PIN 초기화 (삭제)
              </button>
            ) : (
              <form action={clearPinAction} className="space-y-3">
                <input type="hidden" name="childId" value={childId} />
                <p className="rounded-[12px] bg-[var(--status-pending-solid)] px-4 py-3 text-[13px] font-semibold text-[var(--status-pending-solid-text)]">
                  PIN을 삭제하면 아이 모드에 바로 입장할 수 있어요.
                </p>
                {clearPinState.message && (
                  <p className={`rounded-[12px] px-4 py-3 text-[13px] font-semibold ${clearPinState.ok ? "bg-[var(--status-success-solid)] text-[#166534]" : "bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)]"}`}>
                    {clearPinState.message}
                  </p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowPinReset(false)}
                    className="flex-1 rounded-[14px] border-2 border-[#e5e7eb] py-2.5 text-[13px] font-bold text-[var(--monari-ink-muted)]">
                    취소
                  </button>
                  <button type="submit" disabled={clearPinPending}
                    className="flex-1 rounded-[14px] bg-[var(--monari-ink-muted)] py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
                    {clearPinPending ? "초기화 중…" : "PIN 삭제"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 삭제 */}
        <div className="monari-card border border-[var(--status-danger-solid-text)]/30 p-5">
          <h2 className="text-[15px] font-extrabold text-[var(--status-danger-solid-text)] mb-2">아이 삭제</h2>
          <p className="text-[13px] text-[var(--monari-ink-muted)] mb-4">
            삭제하면 아이 모드에 접근할 수 없어요. 거래 내역은 보존됩니다.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-[14px] border-2 border-[var(--status-danger-solid-text)]/30 py-3 text-[14px] font-bold text-[var(--monari-minus)] transition active:scale-95"
            >
              아이 삭제
            </button>
          ) : (
            <form action={deleteAction} className="space-y-3">
              <input type="hidden" name="childId" value={childId} />
              <p className="rounded-[12px] bg-[var(--status-danger-solid)] px-4 py-3 text-[13px] font-semibold text-[var(--status-rose-solid-text)]">
                정말 삭제할까요? 이 작업은 되돌리기 어려워요.
              </p>
              {deleteState.message && !deleteState.ok && (
                <p className="text-[13px] text-red-600">{deleteState.message}</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-[14px] border-2 border-[#e5e7eb] py-3 text-[14px] font-bold text-[var(--monari-ink-muted)]">
                  취소
                </button>
                <button type="submit" disabled={deletePending}
                  className="flex-1 rounded-[14px] bg-[var(--monari-minus)] py-3 text-[14px] font-bold text-white disabled:opacity-50">
                  {deletePending ? "삭제 중…" : "삭제 확인"}
                </button>
              </div>
            </form>
          )}
        </div>
    </div>
  );
}
