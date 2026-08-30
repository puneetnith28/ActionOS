import { describe, expect, it } from "vitest";
import { CapabilityRegistry, publicCapabilities } from "../src/capability-registry";

const now = "2026-08-16T00:00:00.000Z";

describe("channel registry", () => {
  it("reports managed email unavailable until outbound and inbound gates pass", () => {
    const capabilities = publicCapabilities({
      now,
      sandboxAvailable: true,
      managedEmailOutbound: true,
      managedEmailInbound: false
    });
    expect(capabilities.find((item) => item.channelType === "MANAGED_EMAIL")).toMatchObject({
      status: "UNAVAILABLE",
      canSend: true,
      canReceive: false
    });
  });

  it("refuses a future or adapterless channel", () => {
    const capability = publicCapabilities({
      now,
      sandboxAvailable: false,
      managedEmailOutbound: false,
      managedEmailInbound: false
    })[2];
    if (!capability) throw new Error("fixture missing");
    const registry = new CapabilityRegistry([{ capability }]);
    expect(() => registry.requireAvailable("GMAIL_CONNECTED")).toThrow(
      "CONTACT_CHANNEL_UNAVAILABLE"
    );
  });

  it("reports the partner proof only when its controlled fixture is configured", () => {
    const capabilities = publicCapabilities({
      now,
      sandboxAvailable: true,
      managedEmailOutbound: false,
      managedEmailInbound: false,
      partnerFixtureAvailable: true
    });
    expect(capabilities.find((item) => item.channelType === "PARTNER_API")).toMatchObject({
      status: "AVAILABLE",
      canSend: true,
      canReceive: false,
      reasonCodes: ["CONTROLLED_PARTNER_FIXTURE"]
    });
  });
});
