"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PaymentButton({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayment() {
    setLoading(true);
    setError(null);
    try {
      const { requestPayment } = await import("@portone/browser-sdk/v2");
      const paymentId = `monari-plus-${userId}-${Date.now()}`;

      const result = await requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "",
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "",
        paymentId,
        orderName: "모나리 플러스 구독 (1개월)",
        totalAmount: 3900,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: { email: userEmail },
      });

      if (!result || result.code) {
        setError(result?.message ?? "결제에 실패했어요.");
        return;
      }

      // 서버에 결제 완료 처리 요청
      const res = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "결제 확인 중 오류가 발생했어요.");
        return;
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full rounded-[16px] bg-white py-3.5 text-[15px] font-black text-[#7C3AED] transition active:scale-[0.97] disabled:opacity-60"
      >
        {loading ? "결제 진행 중..." : "월 3,900원으로 시작하기"}
      </button>
      {error && (
        <p className="mt-3 text-center text-[13px] font-semibold text-red-300">{error}</p>
      )}
    </div>
  );
}
