import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { ManageContent } from "./manage-content";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();

  return (
    <MobileAppShell title="관리" subtitle="약속 · 용돈 · 이자">
      <ManageContent bundle={bundle} />
    </MobileAppShell>
  );
}
