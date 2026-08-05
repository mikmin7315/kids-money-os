import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { BehaviorRuleEditForm } from "@/components/finance/management-forms";
import { AppNavShell, PageContent } from "@/components/monari/app-nav-shell";

export const dynamic = "force-dynamic";

export default async function BehaviorRuleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireParentSession();
  const { id } = await params;
  const bundle = await getAppDataBundle();
  const rule = bundle.behaviorRules.find((r) => r.id === id);
  if (!rule) notFound();

  return (
    <AppNavShell>
      <PageContent className="pt-6">
        <Link
          href="/behaviors"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
        >
          <ArrowLeft size={15} /> 약속 목록으로
        </Link>

        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[var(--monari-ink-muted)] mb-1">약속 수정</p>
        <h1 className="text-[22px] font-black text-[var(--monari-ink)] mb-5 leading-tight">{rule.title}</h1>

        <div className="monari-card p-5">
          <BehaviorRuleEditForm
            rule={{
              id: rule.id,
              title: rule.title,
              description: rule.description,
              rewardAmount: rule.rewardAmount,
              interestDelta: rule.interestDelta,
              requiresParentApproval: rule.requiresParentApproval,
              monthlyTargetRate: rule.monthlyTargetRate,
            }}
          />
        </div>
      </PageContent>
    </AppNavShell>
  );
}
