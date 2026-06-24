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
    <div className="mx-auto min-h-screen max-w-[460px] overflow-hidden bg-[#faf5ff] shadow-[0_0_70px_rgba(76,29,149,0.16)]">
      {children}
      <ChildBottomNav childId={id} />
    </div>
  );
}
