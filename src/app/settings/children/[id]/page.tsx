import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { ChildEditClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ChildEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireParentSession();
  const { id: childId } = await params;

  const bundle = await getAppDataBundle();
  const child = bundle.children.find((c) => c.id === childId);
  if (!child) redirect("/settings");

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">아이 프로필 관리</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">{child.name}</h1>
        <p className="mt-0.5 text-[13px] text-white/65">{child.birthYear}년생</p>
      </PageHero>
      <PageContent className="pt-5">
        <ChildEditClient childId={childId} initialChild={child} />
      </PageContent>
    </AppNavShell>
  );
}
