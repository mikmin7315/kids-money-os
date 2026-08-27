'use client';

import { useState, useTransition } from 'react';
import { Lock, Fingerprint, RefreshCw } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AppLockOverlayProps {
  onUnlock: () => void;
}

export function AppLockOverlay({ onUnlock }: AppLockOverlayProps) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleUnlock() {
    setError('');
    startTransition(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        onUnlock();
      } else {
        const current = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(current)}`;
      }
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(145deg, #0C4B78 0%, #0369A1 45%, #0EA5E9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* 잠금 아이콘 */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <Lock size={40} color="white" strokeWidth={2} />
      </div>

      <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>
        앱이 잠겼어요
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 40, textAlign: 'center' }}>
        잠금을 해제하면 계속 이용할 수 있어요
      </p>

      {error && (
        <p style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
          {error}
        </p>
      )}

      {/* 해제 버튼 */}
      <button
        onClick={handleUnlock}
        disabled={isPending}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'white',
          color: '#0EA5E9',
          border: 'none',
          borderRadius: 9999,
          padding: '16px 40px',
          fontSize: 16,
          fontWeight: 900,
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          minWidth: 200,
          justifyContent: 'center',
        }}
      >
        {isPending ? (
          <><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> 확인 중…</>
        ) : (
          <><Fingerprint size={20} /> 잠금 해제</>
        )}
      </button>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 20, textAlign: 'center' }}>
        세션이 만료됐다면 재로그인이 필요해요
      </p>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
