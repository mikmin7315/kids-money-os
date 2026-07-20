import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="monari-auth-shell">
      <section className="monari-card w-full p-8 text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-xl font-black text-[var(--monari-ink)]">페이지를 찾을 수 없어요</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--monari-ink-soft)]">
          요청하신 페이지가 없거나 이동된 것 같아요.
        </p>
        <div className="mt-5">
          <Link href="/" className="monari-btn-primary w-full gap-2 flex items-center justify-center">
            <Home size={17} />
            홈으로 가기
          </Link>
        </div>
      </section>
    </main>
  );
}
