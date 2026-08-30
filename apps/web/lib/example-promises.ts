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
      label: "Database Provisioning",
      text: `Provision a new Postgres database in the us-central1 region with 100GB storage. Send the connection string to the operations team.`
    },
    {
      label: "Data Migration",
      text: `Migrate tenant configuration for account ACCT-731 from the legacy API to the new partner system.`
    },
    {
      label: "Incident Escalation",
      text: `Escalate high-priority ticket TICK-842 to the on-call engineer and verify that it has been acknowledged.`
    },
    {
      label: "Certificate Renewal",
      text: `Renew the SSL certificate for the internal gateway before it expires next week.`
    }
  ] as const;
}
