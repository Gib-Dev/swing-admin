import { describe, it, expect } from "vitest";
import { getRegistrationConfirmationEmail } from "./templates";

describe("getRegistrationConfirmationEmail", () => {
  describe("English templates", () => {
    it("returns employee confirmation email", () => {
      const result = getRegistrationConfirmationEmail({
        type: "employee",
        tournamentName: "Summer Classic",
        locale: "en",
      });
      expect(result.subject).toBe("Registration Confirmed — Summer Classic");
      expect(result.html).toContain("Registration Confirmed");
      expect(result.html).toContain("employee registration");
      expect(result.html).toContain("Summer Classic");
    });

    it("returns sponsor confirmation email", () => {
      const result = getRegistrationConfirmationEmail({
        type: "sponsor",
        tournamentName: "Summer Classic",
        locale: "en",
      });
      expect(result.subject).toBe("Registration Confirmed — Summer Classic");
      expect(result.html).toContain("sponsor registration");
    });
  });

  describe("French templates", () => {
    it("returns employee confirmation in French", () => {
      const result = getRegistrationConfirmationEmail({
        type: "employee",
        tournamentName: "Classique Estival",
        locale: "fr",
      });
      expect(result.subject).toBe("Inscription confirmée — Classique Estival");
      expect(result.html).toContain("Inscription confirmée");
      expect(result.html).toContain("employé");
      expect(result.html).toContain("Classique Estival");
    });

    it("returns sponsor confirmation in French", () => {
      const result = getRegistrationConfirmationEmail({
        type: "sponsor",
        tournamentName: "Classique Estival",
        locale: "fr",
      });
      expect(result.html).toContain("commanditaire");
    });
  });

  describe("XSS protection", () => {
    it("escapes HTML in tournament name", () => {
      const result = getRegistrationConfirmationEmail({
        type: "employee",
        tournamentName: '<script>alert("xss")</script>',
        locale: "en",
      });
      expect(result.html).not.toContain("<script>");
      expect(result.html).toContain("&lt;script&gt;");
    });

    it("escapes ampersands", () => {
      const result = getRegistrationConfirmationEmail({
        type: "employee",
        tournamentName: "Tom & Jerry Open",
        locale: "en",
      });
      expect(result.html).toContain("Tom &amp; Jerry Open");
    });

    it("escapes quotes", () => {
      const result = getRegistrationConfirmationEmail({
        type: "employee",
        tournamentName: 'The "Big" Tournament',
        locale: "en",
      });
      expect(result.html).toContain("&quot;Big&quot;");
    });
  });

  describe("defaults to English", () => {
    it("uses English for non-fr locale", () => {
      const result = getRegistrationConfirmationEmail({
        type: "employee",
        tournamentName: "Test",
        locale: "de",
      });
      expect(result.subject).toContain("Registration Confirmed");
    });
  });
});
