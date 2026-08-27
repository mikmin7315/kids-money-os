import { ChildBottomNav } from "@/components/child/child-bottom-nav";
import type { ReactNode } from "react";

export default async function ChildLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto min-h-dvh max-w-[460px] overflow-hidden bg-[#E0F2FE] shadow-[0_0_70px_rgba(14,165,233,0.14)] sm:border-x sm:border-[rgba(14,165,233,0.12)]">
      {children}
      <ChildBottomNav childId={id} />
    </div>
  );
}
