import assert from "node:assert/strict";
import test from "node:test";
import { isValidInterestRateRange } from "../src/lib/interest-policy.ts";

test("accepts an ordered interest-rate range", () => {
  assert.equal(
    isValidInterestRateRange({ minInterestRate: 1, baseInterestRate: 3, maxInterestRate: 7 }),
    true,
  );
});

test("accepts equal boundaries", () => {
  assert.equal(
    isValidInterestRateRange({ minInterestRate: 3, baseInterestRate: 3, maxInterestRate: 3 }),
    true,
  );
});

test("rejects reversed, out-of-range, and non-finite values", () => {
  assert.equal(
    isValidInterestRateRange({ minInterestRate: 4, baseInterestRate: 3, maxInterestRate: 7 }),
    false,
  );
  assert.equal(
    isValidInterestRateRange({ minInterestRate: 0, baseInterestRate: 10, maxInterestRate: 101 }),
    false,
  );
  assert.equal(
    isValidInterestRateRange({ minInterestRate: 0, baseInterestRate: Number.NaN, maxInterestRate: 10 }),
    false,
  );
});
