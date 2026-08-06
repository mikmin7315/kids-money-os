import { requireParentSession } from "@/lib/auth";
import Setup3Client from "./client";

export const dynamic = "force-dynamic";

export default async function Setup3Page() {
  await requireParentSession();
  return <Setup3Client />;
}
