import { requireParentSession } from "@/lib/auth";
import Setup4Client from "./client";

export const dynamic = "force-dynamic";

export default async function Setup4Page() {
  await requireParentSession();
  return <Setup4Client />;
}
