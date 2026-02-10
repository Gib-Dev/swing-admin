import { describe, it, expect } from "vitest";
import {
  formatAmountForStripe,
  formatAmountFromStripe,
  formatCurrency,
} from "./index";

describe("formatAmountForStripe", () => {
  it("converts dollars to cents for CAD", () => {
    expect(formatAmountForStripe(150, "CAD")).toBe(15000);
  });

  it("converts dollars to cents for USD", () => {
    expect(formatAmountForStripe(99.99, "USD")).toBe(9999);
  });

  it("rounds correctly for decimal amounts", () => {
    expect(formatAmountForStripe(10.505, "CAD")).toBe(1051);
  });

  it("returns amount as-is for zero-decimal currencies (JPY)", () => {
    expect(formatAmountForStripe(1000, "JPY")).toBe(1000);
  });

  it("returns amount as-is for KRW", () => {
    expect(formatAmountForStripe(50000, "KRW")).toBe(50000);
  });

  it("is case-insensitive for currency", () => {
    expect(formatAmountForStripe(100, "cad")).toBe(10000);
    expect(formatAmountForStripe(100, "jpy")).toBe(100);
  });
});

describe("formatAmountFromStripe", () => {
  it("converts cents to dollars for CAD", () => {
    expect(formatAmountFromStripe(15000, "CAD")).toBe(150);
  });

  it("converts cents to dollars for USD", () => {
    expect(formatAmountFromStripe(9999, "USD")).toBe(99.99);
  });

  it("returns amount as-is for zero-decimal currencies (JPY)", () => {
    expect(formatAmountFromStripe(1000, "JPY")).toBe(1000);
  });

  it("is case-insensitive for currency", () => {
    expect(formatAmountFromStripe(10000, "cad")).toBe(100);
  });
});

describe("formatCurrency", () => {
  it("formats CAD with en-CA locale", () => {
    const result = formatCurrency(150, "CAD", "en-CA");
    expect(result).toContain("150");
    expect(result).toContain("$");
  });

  it("formats USD", () => {
    const result = formatCurrency(99.99, "USD", "en-US");
    expect(result).toContain("99.99");
  });

  it("defaults to en-CA locale", () => {
    const result = formatCurrency(100, "CAD");
    expect(result).toContain("$");
  });

  it("formats with French locale", () => {
    const result = formatCurrency(150, "CAD", "fr-CA");
    expect(result).toContain("150");
  });
});
