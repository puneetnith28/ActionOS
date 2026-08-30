function pastDate(daysAgo: number, now: Date): string {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function examplePromises(now = new Date()) {
  return [
    {
      label: "Missing refund",
      text: `Northstar Store promised to refund USD 59 for order ORDER-1842 by ${pastDate(1, now)}, but the refund has not arrived.`
    },
    {
      label: "Cancellation",
      text: `Northstar Travel promised to cancel booking BOOKING-731 and confirm a full USD 120 refund by ${pastDate(2, now)}.`
    },
    {
      label: "Replacement",
      text: `Northstar Electronics promised to replace the damaged headphones from order ORDER-992 by ${pastDate(1, now)}.`
    },
    {
      label: "Missing document",
      text: `Northstar Insurance promised to email the coverage certificate for case CASE-441 by ${pastDate(3, now)}.`
    }
  ] as const;
}
