import { describe, it, expect } from "vitest";
import { issueFormToken, checkSubmission, HONEYPOT_FIELD, TOKEN_FIELD } from "../src/modules/notifications/honeypot";

describe("honeypot + timing token", () => {
  it("accepts a human-paced submission with empty honeypot", () => {
    const t = issueFormToken(Date.now() - 5000);
    expect(checkSubmission({ [TOKEN_FIELD]: t, [HONEYPOT_FIELD]: "" })).toEqual({ ok: true });
  });
  it("rejects when the honeypot is filled", () => {
    const t = issueFormToken(Date.now() - 5000);
    expect(checkSubmission({ [TOKEN_FIELD]: t, [HONEYPOT_FIELD]: "http://spam.example" })).toEqual({ ok: false, reason: "honeypot_filled" });
  });
  it("rejects instant submissions", () => {
    const t = issueFormToken();
    expect(checkSubmission({ [TOKEN_FIELD]: t })).toEqual({ ok: false, reason: "too_fast" });
  });
  it("rejects forged or expired tokens", () => {
    expect(checkSubmission({ [TOKEN_FIELD]: "1000.deadbeef" })).toEqual({ ok: false, reason: "invalid_token" });
    expect(checkSubmission({})).toEqual({ ok: false, reason: "invalid_token" });
    const old = issueFormToken(Date.now() - 7 * 60 * 60 * 1000);
    expect(checkSubmission({ [TOKEN_FIELD]: old })).toEqual({ ok: false, reason: "expired_token" });
  });
});
