import { afterEach, describe, expect, it } from "vitest";
import { defaultIntakeChannel } from "../lib/intake-channel-policy";

describe("default intake channel", () => {
  const previousMode = process.env.COMPANY_CONTACT_MODE;
  afterEach(() => {
    if (previousMode === undefined) delete process.env.COMPANY_CONTACT_MODE;
    else process.env.COMPANY_CONTACT_MODE = previousMode;
  });

  it("stays in the controlled demo even when managed email is configured", () => {
    process.env.COMPANY_CONTACT_MODE = "email";
    expect(defaultIntakeChannel()).toMatchObject({
      recipient: "merchant@controlled.actionos.test",
      channel: { channelType: "CONTROLLED_SANDBOX" }
    });
  });
});
