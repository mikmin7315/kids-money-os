export type InterestRateRange = {
  minInterestRate: number;
  baseInterestRate: number;
  maxInterestRate: number;
};

export function isValidInterestRateRange(range: InterestRateRange): boolean {
  return (
    Number.isFinite(range.minInterestRate) &&
    Number.isFinite(range.baseInterestRate) &&
    Number.isFinite(range.maxInterestRate) &&
    range.minInterestRate >= 0 &&
    range.maxInterestRate <= 100 &&
    range.minInterestRate <= range.baseInterestRate &&
    range.baseInterestRate <= range.maxInterestRate
  );
}
