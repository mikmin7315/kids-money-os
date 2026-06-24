import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { OnboardingCarousel } from "@/components/onboarding/onboarding-carousel";

export default async function OnboardingPage() {
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return <OnboardingCarousel />;
}
