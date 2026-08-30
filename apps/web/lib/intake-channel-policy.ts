import { config } from "./config";

export function defaultIntakeChannel() {
  return {
    recipient: config.urls.sandboxRecipient,
    channel: {
      channelType: "CONTROLLED_SANDBOX" as const,
      senderIdentity: "ActionOS controlled demo",
      replyRoute: "Signed callback"
    }
  };
}
