import { requireParentSession } from "@/lib/auth";
import { CompleteFlow } from "@/components/onboarding/complete-flow";

export default async function OnboardingCompletePage() {
  const auth = await requireParentSession();
  const currentRegion = (auth.profile as { region?: string | null } | null)?.region ?? null;

  return <CompleteFlow currentRegion={currentRegion} />;
}
