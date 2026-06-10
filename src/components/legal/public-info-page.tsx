import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { getSupportEmail } from "@/lib/public-info";

export function PublicInfoPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const supportEmail = getSupportEmail();

  return (
    <main className="min-h-screen bg-[var(--monari-bg)] px-4 py-8 text-[var(--monari-ink)] sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/login" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--monari-hero)]">
          <ArrowLeft size={17} aria-hidden="true" />
          Monari로 돌아가기
        </Link>

        <header className="monari-card mt-4 p-6 sm:p-8">
          <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--monari-primary)]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--monari-ink-soft)]">{description}</p>
        </header>

        <div className="mt-4 space-y-4">{children}</div>

        <footer className="mt-8 rounded-3xl border border-[var(--monari-line)] bg-white/70 p-5">
          <nav aria-label="정책 및 고객지원" className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-[var(--monari-hero)]">
            <Link href="/legal/privacy">개인정보 처리 안내</Link>
            <Link href="/legal/terms">이용약관</Link>
            <Link href="/account-deletion">계정 삭제 안내</Link>
            <Link href="/support">고객지원</Link>
          </nav>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--monari-ink-muted)]">
            <Mail size={14} aria-hidden="true" />
            {supportEmail ? (
              <a href={`mailto:${supportEmail}`} className="font-semibold underline underline-offset-2">{supportEmail}</a>
            ) : (
              <Link href="/support" className="font-semibold underline underline-offset-2">고객지원 안내 보기</Link>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="monari-card p-5 sm:p-6">
      <h2 className="text-lg font-black tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--monari-ink-soft)]">{children}</div>
    </section>
  );
}

export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--monari-primary)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
