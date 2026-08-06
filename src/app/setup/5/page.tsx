import { requireParentSession } from "@/lib/auth";
import Setup5Client from "./client";

export const dynamic = "force-dynamic";

export default async function Setup5Page() {
  await requireParentSession();
  return <Setup5Client />;
}
