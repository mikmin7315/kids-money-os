"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const MASK_COOKIE = "amount_masked";

export async function toggleAmountMaskAction(
  _prev: unknown,
  formData: FormData,
): Promise<void> {
  const childId = String(formData.get("childId") ?? "");
  const cookieStore = await cookies();
  const current = cookieStore.get(MASK_COOKIE)?.value === "1";
  if (current) {
    cookieStore.delete(MASK_COOKIE);
  } else {
    cookieStore.set(MASK_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  }
  if (childId) {
    revalidatePath(`/child/${childId}`);
    revalidatePath(`/child/${childId}/balance`);
    revalidatePath(`/child/${childId}/history`);
  }
}

export async function getAmountMasked(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(MASK_COOKIE)?.value === "1";
}
