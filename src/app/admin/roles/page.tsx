import { requireAdminSession } from "@/lib/auth";
import { AdminRolesClient } from "./admin-roles-client";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdminSession();
  return <AdminRolesClient />;
}
