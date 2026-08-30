export function defaultIntakeChannel() {
  return {
    recipient: process.env.MERCHANT_SANDBOX_RECIPIENT ?? "merchant@controlled.actionos.test",
    channel: {
      channelType: "CONTROLLED_SANDBOX" as const,
      senderIdentity: "ActionOS controlled demo",
      replyRoute: "Signed callback"
    }
  };
}
