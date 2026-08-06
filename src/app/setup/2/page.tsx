import { requireParentSession } from "@/lib/auth";
import Setup2Client from "./client";

export const dynamic = "force-dynamic";

export default async function Setup2Page() {
  await requireParentSession();
  return <Setup2Client />;
}
