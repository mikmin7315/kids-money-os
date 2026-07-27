import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { ManageContent } from "./manage-content";

export const dynamic = "force-dynamic";

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireParentSession();
  const [bundle, params] = await Promise.all([getAppDataBundle(), searchParams]);
  const initialTab = (["behaviors", "allowance", "interest"].includes(params.tab ?? "")
    ? params.tab
    : "behaviors") as "behaviors" | "allowance" | "interest";

  const activeBehaviors = bundle.behaviorRules.filter((r) => r.isActive).length;
  const allowanceRules = bundle.allowanceRules.length;
  const interestPolicies = bundle.interestPolicies.length;

  return (
    <AppNavShell>
      <PageHero>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">금융 관리</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-4">관리</h1>
        <div className="grid grid-cols-3 gap-2">
          <HeroPill label="행동 약속" value={`${activeBehaviors}개`} />
          <HeroPill label="정기 용돈" value={`${allowanceRules}건`} />
          <HeroPill label="이자 설정" value={`${interestPolicies}명`} />
        </div>
      </PageHero>
      <PageContent className="pt-4">
        <ManageContent bundle={bundle} initialTab={initialTab} />
      </PageContent>
    </AppNavShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/15 bg-white/10 px-2 py-2.5 text-center">
      <p className="text-[10px] font-semibold text-white/70">{label}</p>
      <p className="mt-0.5 text-sm font-black text-white">{value}</p>
    </div>
  );
}
