import { redirect } from "next/navigation";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { ChildEditClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ChildEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireParentSession();
  const { id: childId } = await params;

  const bundle = await getAppDataBundle();
  const child = bundle.children.find((c) => c.id === childId);
  if (!child) redirect("/settings");

  return <ChildEditClient childId={childId} initialChild={child} />;
}
