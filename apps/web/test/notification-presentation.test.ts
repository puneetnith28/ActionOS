import { describe, expect, it } from "vitest";
import type { NotificationRecord } from "@dueback/runtime/notifications";
import { notificationPresentation } from "../lib/notification-presentation";

describe("notification presentation", () => {
  it("shows truthful provider acceptance without calling it delivery", () => {
    expect(notificationPresentation({ deliveryStatus: "ACCEPTED", attemptCount: 1 } as NotificationRecord)).toMatchObject({
      copy: "Email accepted by the provider", canRetry: false, inAppOnly: false, attempts: 1
    });
  });

  it("allows bounded retry only for failed or unavailable delivery", () => {
    expect(notificationPresentation({ deliveryStatus: "FAILED", attemptCount: 2, destinationHint: "j•••@example.com" } as NotificationRecord)).toEqual({
      copy: "Email delivery failed", canRetry: true, inAppOnly: false, destination: "j•••@example.com", attempts: 2
    });
    expect(notificationPresentation({ deliveryStatus: "SUPPRESSED", attemptCount: 1 } as NotificationRecord).canRetry).toBe(false);
    expect(notificationPresentation({ deliveryStatus: "FAILED", attemptCount: 3 } as NotificationRecord).canRetry).toBe(false);
  });

  it("presents an unavailable optional email as a successful in-app return", () => {
    expect(notificationPresentation({ deliveryChannel: "IN_APP", deliveryStatus: "UNAVAILABLE", attemptCount: 1 } as NotificationRecord)).toMatchObject({
      copy: "Saved in your case", canRetry: false, inAppOnly: true, destination: "this case"
    });
  });
});
