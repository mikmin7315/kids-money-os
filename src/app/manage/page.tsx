import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { ManageContent } from "./manage-content";

export const dynamic = "force-dynamic";

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireParentSession();
  const [bundle, params] = await Promise.all([getAppDataBundle(), searchParams]);
  const initialTab = (["behaviors", "allowance", "interest"].includes(params.tab ?? "")
    ? params.tab
    : "behaviors") as "behaviors" | "allowance" | "interest";

  return (
    <MobileAppShell title="관리" subtitle="약속 · 용돈 · 이자">
      <ManageContent bundle={bundle} initialTab={initialTab} />
    </MobileAppShell>
  );
}
