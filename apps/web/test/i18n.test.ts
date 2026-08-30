import { describe, expect, it } from "vitest";
import { getMessages, isLocale, localizePath } from "../lib/i18n";
import { getReviewCopy } from "../lib/review-copy";

describe("localized routing", () => {
  it("recognizes exactly the three supported locales", () => {
    expect(["en", "es", "pt"].every(isLocale)).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("adds or replaces a locale without changing the product path", () => {
    expect(localizePath("/cases/mission_1/review", "es")).toBe("/es/cases/mission_1/review");
    expect(localizePath("/en/privacy", "pt")).toBe("/pt/privacy");
    expect(localizePath("/", "en")).toBe("/en");
  });

  it("ships complete top-level dictionaries for every locale", () => {
    const keys = Object.keys(getMessages("en"));
    expect(Object.keys(getMessages("es"))).toEqual(keys);
    expect(Object.keys(getMessages("pt"))).toEqual(keys);
  });

  it("ships the same boundary.consent keys in all three languages", () => {
    const keys = Object.keys(getReviewCopy("en"));
    expect(Object.keys(getReviewCopy("es"))).toEqual(keys);
    expect(Object.keys(getReviewCopy("pt"))).toEqual(keys);
    expect(getReviewCopy("es").authorized).not.toBe(getReviewCopy("en").authorized);
    expect(getReviewCopy("pt").confirmDelete).not.toBe(getReviewCopy("en").confirmDelete);
  });
});
