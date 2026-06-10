export const CURRENT_CONSENT_VERSION = "2026-06-10";

export function hasCurrentConsent(profile: Record<string, unknown> | null) {
  return Boolean(
    profile?.consent_at &&
    profile?.consent_version === CURRENT_CONSENT_VERSION,
  );
}
