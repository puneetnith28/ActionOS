export function defaultIntakeChannel() {
  return {
    recipient: process.env.MERCHANT_SANDBOX_RECIPIENT ?? "merchant@controlled.dueback.test",
    channel: {
      channelType: "CONTROLLED_SANDBOX" as const,
      senderIdentity: "DueBack controlled demo",
      replyRoute: "Signed callback"
    }
  };
}
