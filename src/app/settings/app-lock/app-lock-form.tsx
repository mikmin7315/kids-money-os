'use client';

import { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useAppLock } from '@/components/auth/app-lock-provider';

const TIMEOUT_OPTIONS = [
  { label: '즉시', value: 0 },
  { label: '1분', value: 1 },
  { label: '5분', value: 5 },
  { label: '15분', value: 15 },
  { label: '30분', value: 30 },
];

export function AppLockSettingsForm() {
  const { settings, saveSettings, lockNow } = useAppLock();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [timeout, setTimeout_] = useState(settings.timeoutMinutes);

function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    saveSettings({ enabled: next, timeoutMinutes: timeout });
  }

  function handleTimeout(v: number) {
    setTimeout_(v);
    saveSettings({ enabled, timeoutMinutes: v });
  }

  return (
    <div className="space-y-4 mb-6">
      {/* 잠금 토글 */}
      <div className="monari-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[14px]"
              style={{ background: enabled ? 'linear-gradient(135deg,#7C3AED,#6C3FE8)' : '#F3F4F6' }}
            >
              {enabled ? (
                <Lock size={18} color="white" strokeWidth={2.5} />
              ) : (
                <Unlock size={18} color="#9CA3AF" strokeWidth={2.5} />
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-[var(--monari-ink)]">앱 잠금</p>
              <p className="text-[12px] text-[var(--monari-ink-muted)]">
                {enabled ? '활성화됨' : '비활성화됨'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            role="switch"
            aria-checked={enabled}
            className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200"
            style={{ background: enabled ? '#7C3AED' : '#D1D5DB' }}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: enabled ? 'translateX(22px)' : 'translateX(4px)' }}
            />
          </button>
        </div>
      </div>

      {/* 잠금 시간 선택 */}
      {enabled && (
        <>
          <div className="monari-card p-4">
            <p className="mb-3 text-[13px] font-bold text-[var(--monari-ink)]">잠금까지 대기 시간</p>
            <div className="grid grid-cols-5 gap-2">
              {TIMEOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTimeout(opt.value)}
                  className="rounded-[12px] py-2.5 text-[12px] font-bold transition-colors"
                  style={
                    timeout === opt.value
                      ? { background: 'linear-gradient(135deg,#7C3AED,#6C3FE8)', color: '#fff' }
                      : { background: '#F3F4F6', color: '#6B7280' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={lockNow}
            className="w-full rounded-[16px] py-3.5 text-[14px] font-bold transition-opacity active:opacity-70"
            style={{ background: 'linear-gradient(135deg,#3B0764,#6C3FE8)', color: '#fff' }}
          >
            지금 잠금
          </button>
        </>
      )}
    </div>
  );
}
