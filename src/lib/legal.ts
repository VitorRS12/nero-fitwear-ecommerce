export const TERMS_VERSION = "2026-11-18";

export interface TermsAcceptance {
  terms_version: string;
  terms_accepted_at: string;
}

export function buildTermsAcceptance(now: Date = new Date()): TermsAcceptance {
  return { terms_version: TERMS_VERSION, terms_accepted_at: now.toISOString() };
}

export function hasAcceptedCurrentTerms(metadata: { terms_version?: unknown; terms_accepted_at?: unknown } | null | undefined): boolean {
  return metadata?.terms_version === TERMS_VERSION && typeof metadata?.terms_accepted_at === "string";
}
