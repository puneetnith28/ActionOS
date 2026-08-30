import { describe, expect, it } from "vitest";
import { activeCaseChannel, channelCopy } from "../lib/channel-copy";

describe("case channel copy", () => {
  it("never projects sandbox or callback language onto managed email", () => {
    const copy = Object.values(channelCopy(activeCaseChannel("MANAGED_EMAIL"))).join(" ");
    expect(copy).toContain("email");
    expect(copy).not.toMatch(/sandbox|callback|demo merchant/i);
  });

  it("retains an explicit disclosure for the controlled sandbox", () => {
    const copy = Object.values(channelCopy(activeCaseChannel("CONTROLLED_SANDBOX"))).join(" ");
    expect(copy).toMatch(/accelerated demo/i);
    expect(copy).toMatch(/not a real company/i);
    expect(copy).not.toMatch(/adapter|callback/i);
  });

  it("fails closed to sandbox copy for legacy unknown channel records", () => {
    expect(activeCaseChannel(undefined)).toBe("CONTROLLED_SANDBOX");
    expect(activeCaseChannel("UNKNOWN")).toBe("CONTROLLED_SANDBOX");
  });
});
