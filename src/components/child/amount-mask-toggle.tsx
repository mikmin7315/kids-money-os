"use client";

import { useActionState } from "react";
import { toggleAmountMaskAction } from "@/actions/child-prefs";
import { Eye, EyeOff } from "lucide-react";

export function AmountMaskToggle({
  childId,
  masked,
}: {
  childId: string;
  masked: boolean;
}) {
  const [, formAction, pending] = useActionState(toggleAmountMaskAction, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="childId" value={childId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={masked ? "금액 보기" : "금액 숨기기"}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition active:scale-90 disabled:opacity-50"
      >
        {masked ? <EyeOff className="h-5 w-5 text-white" /> : <Eye className="h-5 w-5 text-white" />}
      </button>
    </form>
  );
}
