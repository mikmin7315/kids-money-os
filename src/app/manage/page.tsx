import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { AppNavShell, PageContent } from "@/components/monari/app-nav-shell";
import { ManageContent } from "./manage-content";

export const dynamic = "force-dynamic";

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireParentSession();
  const [bundle, params] = await Promise.all([getAppDataBundle(), searchParams]);
  const initialTab = (["behaviors", "allowance", "interest"].includes(params.tab ?? "")
    ? params.tab
    : "behaviors") as "behaviors" | "allowance" | "interest";

  return (
    <AppNavShell>
      <PageContent className="pt-4">
        <ManageContent bundle={bundle} initialTab={initialTab} />
      </PageContent>
    </AppNavShell>
  );
}
